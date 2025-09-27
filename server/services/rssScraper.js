const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');

class RSSScraper {
  constructor() {
    this.parser = new Parser({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    this.maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
    this.requestTimeout = parseInt(process.env.REQUEST_TIMEOUT) || 30000;
    this.minArticleLength = parseInt(process.env.MIN_ARTICLE_LENGTH) || 250;
    
    console.log('📡 RSS Scraper initialized');
  }
  
  async fetchRSSFeed(feedUrl) {
    try {
      console.log(`📡 Fetching RSS feed: ${feedUrl}`);
      
      const feed = await this.parser.parseURL(feedUrl);
      console.log(`✅ RSS feed parsed successfully: ${feed.title}`);
      console.log(`📰 Found ${feed.items.length} items`);
      
      const articles = [];
      
      for (const item of feed.items) {
        try {
          const article = await this.processFeedItem(item, feedUrl);
          if (article) {
            articles.push(article);
          }
        } catch (itemError) {
          console.error(`❌ Error processing RSS item:`, itemError.message);
        }
      }
      
      console.log(`✅ Processed ${articles.length} articles from RSS feed`);
      return articles;
      
    } catch (error) {
      console.error(`❌ Error fetching RSS feed ${feedUrl}:`, error.message);
      throw error;
    }
  }
  
  async processFeedItem(item, feedUrl) {
    try {
      // Extract basic information
      const article = {
        title: this.cleanText(item.title || ''),
        summary: this.cleanText(item.contentSnippet || item.content || item.description || ''),
        url: item.link || '',
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        tags: this.extractTags(item),
        content: ''
      };
      
      // Validate article
      if (!article.title || !article.url) {
        console.warn(`⚠️ Skipping invalid article: missing title or URL`);
        return null;
      }
      
      // Try to fetch full content
      try {
        const fullContent = await this.fetchArticleContent(article.url);
        if (fullContent) {
          article.content = fullContent;
          article.summary = this.generateSummary(fullContent, article.summary);
        }
      } catch (contentError) {
        console.warn(`⚠️ Could not fetch full content for ${article.url}:`, contentError.message);
      }
      
      // Validate article length
      if (article.content && article.content.length < this.minArticleLength) {
        console.warn(`⚠️ Article too short (${article.content.length} chars), skipping`);
        return null;
      }
      
      return article;
      
    } catch (error) {
      console.error(`❌ Error processing feed item:`, error.message);
      return null;
    }
  }
  
  async fetchArticleContent(url) {
    try {
      const response = await axios.get(url, {
        timeout: this.requestTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Remove unwanted elements
      $('script, style, nav, header, footer, aside, .advertisement, .ad, .sidebar').remove();
      
      // Try to find main content
      let content = '';
      
      // Common content selectors
      const contentSelectors = [
        'article',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.content',
        '.main-content',
        'main',
        '.article-body',
        '.story-body',
        '.post-body'
      ];
      
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text().trim();
          if (content.length > 200) {
            break;
          }
        }
      }
      
      // Fallback to body if no specific content found
      if (!content || content.length < 200) {
        content = $('body').text().trim();
      }
      
      return this.cleanText(content);
      
    } catch (error) {
      console.warn(`⚠️ Error fetching content from ${url}:`, error.message);
      return null;
    }
  }
  
  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .replace(/\t+/g, ' ') // Replace tabs with spaces
      .trim();
  }
  
  extractTags(item) {
    const tags = [];
    
    // Extract from categories
    if (item.categories) {
      tags.push(...item.categories);
    }
    
    // Extract from content
    const content = item.contentSnippet || item.content || item.description || '';
    const automotiveKeywords = [
      'automotive', 'car', 'vehicle', 'auto', 'truck', 'suv', 'sedan',
      'tesla', 'ford', 'gm', 'general motors', 'toyota', 'honda', 'bmw',
      'mercedes', 'audi', 'volkswagen', 'nissan', 'hyundai', 'kia',
      'electric vehicle', 'ev', 'hybrid', 'autonomous', 'self-driving',
      'autopilot', 'battery', 'charging', 'infrastructure'
    ];
    
    const lowerContent = content.toLowerCase();
    for (const keyword of automotiveKeywords) {
      if (lowerContent.includes(keyword)) {
        tags.push(keyword);
      }
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }
  
  generateSummary(content, existingSummary) {
    if (existingSummary && existingSummary.length > 100) {
      return existingSummary;
    }
    
    if (!content) return existingSummary || '';
    
    // Take first 300 characters as summary
    const summary = content.substring(0, 300);
    
    // Try to end at a sentence boundary
    const lastPeriod = summary.lastIndexOf('.');
    if (lastPeriod > 100) {
      return summary.substring(0, lastPeriod + 1);
    }
    
    return summary + '...';
  }
  
  async testFeed(feedUrl) {
    try {
      console.log(`🧪 Testing RSS feed: ${feedUrl}`);
      
      const feed = await this.parser.parseURL(feedUrl);
      
      return {
        success: true,
        title: feed.title,
        description: feed.description,
        itemCount: feed.items.length,
        lastBuildDate: feed.lastBuildDate,
        link: feed.link,
        language: feed.language
      };
      
    } catch (error) {
      console.error(`❌ RSS feed test failed:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  async healthCheck() {
    try {
      // Test with a simple RSS feed
      const testUrl = 'https://feeds.bbci.co.uk/news/rss.xml';
      const feed = await this.parser.parseURL(testUrl);
      
      return {
        status: 'healthy',
        message: 'RSS scraper is working',
        testFeed: feed.title
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `RSS scraper test failed: ${error.message}`
      };
    }
  }
}

module.exports = RSSScraper;