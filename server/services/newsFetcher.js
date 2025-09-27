const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const NewsSource = require('../models/NewsSource');
const ProcessedArticle = require('../models/ProcessedArticle');
const IngestionLog = require('../models/IngestionLog');
const logger = require('../utils/logger');

class NewsFetcher {
  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': process.env.USER_AGENT || 'NewsIngestionBot/1.0'
      }
    });
    
    this.config = {
      maxConcurrentFetches: parseInt(process.env.MAX_CONCURRENT_FETCHES) || 3,
      requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 10000,
      retryAttempts: parseInt(process.env.RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(process.env.RETRY_DELAY) || 5000
    };
  }

  /**
   * Normalize URL by removing UTM parameters and trailing slashes
   */
  normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      // Remove UTM parameters
      const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
      paramsToRemove.forEach(param => urlObj.searchParams.delete(param));
      
      // Remove trailing slash
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
   * Generate title fingerprint for deduplication
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
   * Validate and normalize feed item
   */
  normalizeFeedItem(item, sourceId) {
    if (!item.title || !item.link) {
      return null; // Drop items without required fields
    }

    const normalizedUrl = this.normalizeUrl(item.link);
    const titleFingerprint = this.generateTitleFingerprint(item.title);

    return {
      sourceId,
      title: item.title.trim(),
      link: normalizedUrl,
      snippet: item.contentSnippet || item.content || item.description || '',
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      rawFeedItem: item,
      canonicalUrl: normalizedUrl,
      titleFingerprint
    };
  }

  /**
   * Fetch RSS feed with retry logic
   */
  async fetchRSSFeed(source, retryCount = 0) {
    const startTime = Date.now();
    
    try {
      logger.info(`Fetching RSS feed: ${source.name} (${source.url})`);
      
      const feed = await this.parser.parseURL(source.url);
      const responseTime = Date.now() - startTime;
      
      logger.info(`Successfully fetched ${feed.items?.length || 0} items from ${source.name} in ${responseTime}ms`);
      
      return {
        success: true,
        feed,
        responseTime,
        itemCount: feed.items?.length || 0
      };
      
    } catch (error) {
      logger.error(`Error fetching RSS feed ${source.name}:`, error.message);
      
      if (retryCount < this.config.retryAttempts) {
        logger.info(`Retrying fetch for ${source.name} (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        return this.fetchRSSFeed(source, retryCount + 1);
      }
      
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Check for duplicates using canonical URL and title fingerprint
   */
  async checkDuplicates(normalizedItems) {
    const canonicalUrls = normalizedItems.map(item => item.canonicalUrl).filter(Boolean);
    const titleFingerprints = normalizedItems.map(item => item.titleFingerprint).filter(Boolean);
    
    const existingItems = await ProcessedArticle.find({
      $or: [
        { canonicalUrl: { $in: canonicalUrls } },
        { titleFingerprint: { $in: titleFingerprints } }
      ]
    }, { canonicalUrl: 1, titleFingerprint: 1 });
    
    const existingCanonicalUrls = new Set(existingItems.map(item => item.canonicalUrl));
    const existingFingerprints = new Set(existingItems.map(item => item.titleFingerprint));
    
    // Mark duplicates
    const uniqueItems = normalizedItems.filter(item => {
      const isDuplicate = existingCanonicalUrls.has(item.canonicalUrl) || 
                         existingFingerprints.has(item.titleFingerprint);
      
      if (isDuplicate) {
        item.isDuplicate = true;
      }
      
      return !isDuplicate;
    });
    
    logger.info(`Found ${normalizedItems.length - uniqueItems.length} duplicates, ${uniqueItems.length} unique items`);
    
    return uniqueItems;
  }

  /**
   * Process a single news source
   */
  async processSource(source) {
    const runId = crypto.randomUUID();
    const log = new IngestionLog({
      sourceId: source.sourceId,
      runId,
      status: 'started',
      startedAt: new Date(),
      config: this.config
    });
    
    try {
      logger.info(`Starting ingestion for source: ${source.name}`);
      
      // Fetch RSS feed
      const fetchResult = await this.fetchRSSFeed(source);
      
      if (!fetchResult.success) {
        throw new Error(fetchResult.error);
      }
      
      log.itemsDiscovered = fetchResult.itemCount;
      
      // Normalize feed items
      const normalizedItems = fetchResult.feed.items
        .map(item => this.normalizeFeedItem(item, source.sourceId))
        .filter(Boolean); // Remove null items
      
      log.itemsUnique = normalizedItems.length;
      
      // Check for duplicates
      const uniqueItems = await this.checkDuplicates(normalizedItems);
      
      // Save unique items to database
      const savedArticles = [];
      for (const item of uniqueItems) {
        try {
          const article = new ProcessedArticle({
            ...item,
            gptStatus: 'pending',
            fetchedAt: new Date()
          });
          
          await article.save();
          savedArticles.push(article);
          log.itemsSaved++;
          
        } catch (saveError) {
          if (saveError.code === 11000) {
            // Duplicate key error - item was added by another process
            log.itemsSkipped++;
            logger.warn(`Duplicate article skipped: ${item.title}`);
          } else {
            logger.error(`Error saving article: ${saveError.message}`);
            log.errors = log.errors || [];
            log.errors.push(saveError.message);
          }
        }
      }
      
      // Update source statistics
      source.lastFetched = new Date();
      source.successCount++;
      source.avgResponseTime = source.avgResponseTime 
        ? (source.avgResponseTime + fetchResult.responseTime) / 2
        : fetchResult.responseTime;
      source.isHealthy = true;
      await source.save();
      
      // Update log
      log.status = 'completed';
      log.completedAt = new Date();
      log.duration = log.completedAt - log.startedAt;
      log.avgResponseTime = fetchResult.responseTime;
      await log.save();
      
      logger.info(`Completed ingestion for ${source.name}: ${log.itemsSaved} articles saved`);
      
      return {
        success: true,
        itemsSaved: log.itemsSaved,
        itemsSkipped: log.itemsSkipped,
        duration: log.duration
      };
      
    } catch (error) {
      logger.error(`Error processing source ${source.name}:`, error.message);
      
      // Update source error statistics
      source.errorCount++;
      source.lastError = error.message;
      source.isHealthy = source.errorCount > 5; // Mark unhealthy after 5 errors
      await source.save();
      
      // Update log
      log.status = 'failed';
      log.completedAt = new Date();
      log.duration = Date.now() - log.startedAt;
      log.errors = [error.message];
      await log.save();
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process all active sources with concurrency control
   */
  async processAllSources() {
    try {
      const sources = await NewsSource.find({ isActive: true }).sort({ priority: 1 });
      
      if (sources.length === 0) {
        logger.warn('No active sources found');
        return { success: false, error: 'No active sources' };
      }
      
      logger.info(`Starting ingestion for ${sources.length} sources`);
      
      const results = [];
      const batches = [];
      
      // Create batches based on maxConcurrentFetches
      for (let i = 0; i < sources.length; i += this.config.maxConcurrentFetches) {
        batches.push(sources.slice(i, i + this.config.maxConcurrentFetches));
      }
      
      // Process batches sequentially, sources within batch concurrently
      for (const batch of batches) {
        const batchPromises = batch.map(source => this.processSource(source));
        const batchResults = await Promise.allSettled(batchPromises);
        
        results.push(...batchResults.map((result, index) => ({
          sourceId: batch[index].sourceId,
          sourceName: batch[index].name,
          ...(result.status === 'fulfilled' ? result.value : { success: false, error: result.reason.message })
        })));
        
        // Add delay between batches to avoid overwhelming servers
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const totalItemsSaved = results.reduce((sum, r) => sum + (r.itemsSaved || 0), 0);
      
      logger.info(`Ingestion completed: ${successCount}/${sources.length} sources successful, ${totalItemsSaved} total articles saved`);
      
      return {
        success: true,
        results,
        totalSources: sources.length,
        successfulSources: successCount,
        totalItemsSaved
      };
      
    } catch (error) {
      logger.error('Error in processAllSources:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new NewsFetcher();
