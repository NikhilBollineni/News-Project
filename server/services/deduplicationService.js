const crypto = require('crypto');
const ProcessedArticle = require('../models/ProcessedArticle');
const logger = require('../utils/logger');

class DeduplicationService {
  constructor() {
    this.seenSignatures = new Set();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    this.lastCacheRefresh = 0;
  }

  /**
   * Normalize URL for deduplication
   */
  normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Remove common tracking parameters
      const paramsToRemove = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'ref', 'source', 'campaign', 'medium',
        '_ga', '_gl', 'mc_cid', 'mc_eid', 'pk_source', 'pk_campaign',
        'yclid', 'gclsrc', 'dclid', 'msclkid'
      ];
      
      paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
      
      // Normalize protocol
      urlObj.protocol = 'https:';
      
      // Remove trailing slash (except for root)
      let normalizedUrl = urlObj.toString();
      if (normalizedUrl.endsWith('/') && normalizedUrl.length > 1) {
        normalizedUrl = normalizedUrl.slice(0, -1);
      }
      
      return normalizedUrl;
    } catch (error) {
      logger.error(`Error normalizing URL ${url}:`, error.message);
      return url;
    }
  }

  /**
   * Generate content fingerprint for advanced deduplication
   */
  generateContentFingerprint(title, content) {
    if (!title && !content) return '';
    
    const text = `${title || ''} ${content || ''}`
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Take first 500 characters for fingerprint
    const fingerprintText = text.substring(0, 500);
    
    return crypto.createHash('sha256').update(fingerprintText).digest('hex');
  }

  /**
   * Generate title fingerprint
   */
  generateTitleFingerprint(title) {
    if (!title) return '';
    
    const normalized = title
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 120); // Keep first 120 chars
    
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  /**
   * Refresh the seen signatures cache from database
   */
  async refreshSeenSignatures() {
    try {
      const now = Date.now();
      if (now - this.lastCacheRefresh < this.cacheExpiry) {
        return; // Cache is still fresh
      }
      
      logger.info('Refreshing deduplication cache...');
      
      const articles = await ProcessedArticle.find({
        $or: [
          { canonicalUrl: { $exists: true } },
          { titleFingerprint: { $exists: true } }
        ]
      }, { canonicalUrl: 1, titleFingerprint: 1, contentFingerprint: 1 });
      
      this.seenSignatures.clear();
      
      articles.forEach(article => {
        if (article.canonicalUrl) {
          this.seenSignatures.add(`url:${article.canonicalUrl}`);
        }
        if (article.titleFingerprint) {
          this.seenSignatures.add(`title:${article.titleFingerprint}`);
        }
        if (article.contentFingerprint) {
          this.seenSignatures.add(`content:${article.contentFingerprint}`);
        }
      });
      
      this.lastCacheRefresh = now;
      logger.info(`Deduplication cache refreshed with ${this.seenSignatures.size} signatures`);
      
    } catch (error) {
      logger.error('Error refreshing seen signatures:', error.message);
    }
  }

  /**
   * Check if an article is a duplicate
   */
  async isDuplicate(article) {
    await this.refreshSeenSignatures();
    
    const canonicalUrl = this.normalizeUrl(article.link);
    const titleFingerprint = this.generateTitleFingerprint(article.title);
    const contentFingerprint = this.generateContentFingerprint(article.title, article.cleanText);
    
    // Check against cache
    const urlSignature = `url:${canonicalUrl}`;
    const titleSignature = `title:${titleFingerprint}`;
    const contentSignature = `content:${contentFingerprint}`;
    
    const isDuplicate = this.seenSignatures.has(urlSignature) || 
                       this.seenSignatures.has(titleSignature) ||
                       this.seenSignatures.has(contentSignature);
    
    // Also check database for recent duplicates (last 24 hours)
    if (!isDuplicate) {
      const recentDuplicate = await ProcessedArticle.findOne({
        $and: [
          {
            $or: [
              { canonicalUrl: canonicalUrl },
              { titleFingerprint: titleFingerprint },
              { contentFingerprint: contentFingerprint }
            ]
          },
          { fetchedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        ]
      });
      
      if (recentDuplicate) {
        return {
          isDuplicate: true,
          reason: 'recent_duplicate',
          duplicateId: recentDuplicate._id
        };
      }
    }
    
    return {
      isDuplicate,
      reason: isDuplicate ? 'signature_match' : 'unique',
      canonicalUrl,
      titleFingerprint,
      contentFingerprint
    };
  }

  /**
   * Mark article as seen (add to cache)
   */
  markAsSeen(article) {
    if (article.canonicalUrl) {
      this.seenSignatures.add(`url:${article.canonicalUrl}`);
    }
    if (article.titleFingerprint) {
      this.seenSignatures.add(`title:${article.titleFingerprint}`);
    }
    if (article.contentFingerprint) {
      this.seenSignatures.add(`content:${article.contentFingerprint}`);
    }
  }

  /**
   * Find potential duplicates for manual review
   */
  async findPotentialDuplicates(limit = 50) {
    try {
      // Find articles with similar titles (using text search)
      const articles = await ProcessedArticle.find({
        title: { $exists: true, $ne: '' }
      })
      .sort({ publishedAt: -1 })
      .limit(limit * 2); // Get more to account for filtering
      
      const potentialDuplicates = [];
      const processed = new Set();
      
      for (let i = 0; i < articles.length; i++) {
        const article1 = articles[i];
        
        if (processed.has(article1._id.toString())) continue;
        
        for (let j = i + 1; j < articles.length; j++) {
          const article2 = articles[j];
          
          if (processed.has(article2._id.toString())) continue;
          
          const similarity = this.calculateTitleSimilarity(article1.title, article2.title);
          
          if (similarity > 0.8) { // 80% similarity threshold
            potentialDuplicates.push({
              article1: {
                id: article1._id,
                title: article1.title,
                url: article1.link,
                publishedAt: article1.publishedAt
              },
              article2: {
                id: article2._id,
                title: article2.title,
                url: article2.link,
                publishedAt: article2.publishedAt
              },
              similarity,
              reason: 'title_similarity'
            });
            
            processed.add(article1._id.toString());
            processed.add(article2._id.toString());
          }
        }
      }
      
      return potentialDuplicates.slice(0, limit);
      
    } catch (error) {
      logger.error('Error finding potential duplicates:', error.message);
      return [];
    }
  }

  /**
   * Calculate title similarity using Jaccard similarity
   */
  calculateTitleSimilarity(title1, title2) {
    if (!title1 || !title2) return 0;
    
    const words1 = new Set(title1.toLowerCase().split(/\s+/));
    const words2 = new Set(title2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Clean up old duplicate records
   */
  async cleanupOldDuplicates(daysOld = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      
      const result = await ProcessedArticle.deleteMany({
        isDuplicate: true,
        fetchedAt: { $lt: cutoffDate }
      });
      
      logger.info(`Cleaned up ${result.deletedCount} old duplicate records`);
      return result.deletedCount;
      
    } catch (error) {
      logger.error('Error cleaning up old duplicates:', error.message);
      return 0;
    }
  }
}

module.exports = new DeduplicationService();
