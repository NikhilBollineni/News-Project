const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../utils/logger');

class ContentExtractor {
  constructor() {
    this.config = {
      timeout: 15000,
      maxContentLength: 50000,
      userAgent: process.env.USER_AGENT || 'NewsIngestionBot/1.0 (https://github.com/your-repo)',
      retryAttempts: 3,
      retryDelay: 2000
    };
    
    // Common selectors for article content
    this.contentSelectors = [
      'article',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.content',
      '.story-body',
      '.article-body',
      '.post-body',
      '.entry-body',
      'main',
      '.main-content',
      '.article-text',
      '.story-text',
      '[role="main"]'
    ];
    
    // Selectors to remove
    this.removeSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 'aside',
      '.advertisement', '.ads', '.ad', '.sidebar', '.social-share',
      '.comments', '.comment', '.related', '.recommended',
      '.newsletter', '.subscribe', '.cookie-banner',
      '.paywall', '.subscription', '.premium-content'
    ];
    
    // Paywall indicators
    this.paywallIndicators = [
      'subscribe', 'subscription', 'premium', 'paywall',
      'sign up', 'login required', 'members only',
      'free articles remaining', 'article limit reached'
    ];
  }

  /**
   * Extract content from URL with retry logic
   */
  async extractContent(url, retryCount = 0) {
    const startTime = Date.now();
    
    try {
      logger.info(`Extracting content from: ${url}`);
      
      const response = await axios.get(url, {
        timeout: this.config.timeout,
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 400
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('text/html')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }
      
      const extractedContent = this.parseHtml(response.data, url);
      
      // Track content extraction
      costOptimizationService.trackContentExtraction(true);
      
      logger.info(`Successfully extracted ${extractedContent.cleanText.length} characters from ${url} in ${responseTime}ms`);
      
      return {
        success: true,
        content: extractedContent,
        responseTime,
        status: extractedContent.isPaywalled ? 'paywalled' : 'full'
      };
      
    } catch (error) {
      logger.error(`Error extracting content from ${url}:`, error.message);
      
      if (retryCount < this.config.retryAttempts && this.shouldRetry(error)) {
        logger.info(`Retrying content extraction for ${url} (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        return this.extractContent(url, retryCount + 1);
      }
      
      // Track failed content extraction
      costOptimizationService.trackContentExtraction(false);
      
      return {
        success: false,
        error: error.message,
        status: 'failed'
      };
    }
  }

  /**
   * Check if error is retryable
   */
  shouldRetry(error) {
    if (error.response) {
      const status = error.response.status;
      return status >= 500 || status === 429; // Server errors or rate limiting
    }
    return error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT';
  }

  /**
   * Parse HTML and extract content
   */
  parseHtml(html, url) {
    const $ = cheerio.load(html);
    
    // Remove unwanted elements
    this.removeSelectors.forEach(selector => {
      $(selector).remove();
    });
    
    // Detect paywall
    const isPaywalled = this.detectPaywall($, html);
    
    // Extract title
    const title = this.extractTitle($);
    
    // Extract main content
    let cleanText = this.extractMainContent($);
    
    // If no main content found, try fallback methods
    if (!cleanText || cleanText.length < 100) {
      cleanText = this.extractFallbackContent($);
    }
    
    // Extract metadata
    const metadata = this.extractMetadata($, html);
    
    // Clean up text
    cleanText = this.cleanText(cleanText);
    
    // Determine content status
    let contentStatus = 'full';
    if (isPaywalled) {
      contentStatus = 'paywalled';
    } else if (!cleanText || cleanText.length < 200) {
      contentStatus = 'partial';
    }
    
    return {
      title: title,
      cleanText: cleanText,
      rawHtml: html.substring(0, 100000), // Keep first 100KB of HTML
      isPaywalled: isPaywalled,
      contentStatus: contentStatus,
      metadata: metadata,
      wordCount: cleanText ? cleanText.split(/\s+/).length : 0
    };
  }

  /**
   * Extract title from HTML
   */
  extractTitle($) {
    const titleSelectors = [
      'h1',
      '.article-title',
      '.post-title',
      '.entry-title',
      'title'
    ];
    
    for (const selector of titleSelectors) {
      const title = $(selector).first().text().trim();
      if (title && title.length > 10) {
        return title;
      }
    }
    
    return $('title').text().trim() || '';
  }

  /**
   * Extract main content using content selectors
   */
  extractMainContent($) {
    for (const selector of this.contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text().trim();
        if (text.length > 200) {
          return text;
        }
      }
    }
    
    return '';
  }

  /**
   * Fallback content extraction methods
   */
  extractFallbackContent($) {
    // Try to find the largest text block
    let maxText = '';
    let maxLength = 0;
    
    $('p, div, section, article').each((i, element) => {
      const text = $(element).text().trim();
      if (text.length > maxLength && text.length > 100) {
        maxText = text;
        maxLength = text.length;
      }
    });
    
    return maxText;
  }

  /**
   * Detect paywall
   */
  detectPaywall($, html) {
    const htmlLower = html.toLowerCase();
    const textLower = $('body').text().toLowerCase();
    
    // Check for paywall indicators in HTML or text
    for (const indicator of this.paywallIndicators) {
      if (htmlLower.includes(indicator) || textLower.includes(indicator)) {
        return true;
      }
    }
    
    // Check for common paywall classes
    const paywallClasses = [
      '.paywall', '.subscription', '.premium', '.members-only',
      '.article-limit', '.metered-content'
    ];
    
    for (const className of paywallClasses) {
      if ($(className).length > 0) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Extract metadata
   */
  extractMetadata($, html) {
    const metadata = {
      author: this.extractAuthor($),
      language: this.extractLanguage($, html),
      images: this.extractImages($),
      publishedAt: this.extractPublishedDate($)
    };
    
    return metadata;
  }

  /**
   * Extract author information
   */
  extractAuthor($) {
    const authorSelectors = [
      '.author', '.byline', '.article-author', '.post-author',
      '[rel="author"]', '[property="article:author"]'
    ];
    
    for (const selector of authorSelectors) {
      const author = $(selector).first().text().trim();
      if (author && author.length > 2) {
        return author.replace(/^by\s+/i, '').trim();
      }
    }
    
    // Try meta tags
    const metaAuthor = $('meta[name="author"]').attr('content') ||
                      $('meta[property="article:author"]').attr('content');
    
    return metaAuthor || '';
  }

  /**
   * Extract language
   */
  extractLanguage($, html) {
    // Check HTML lang attribute
    const htmlLang = $('html').attr('lang');
    if (htmlLang) {
      return htmlLang.substring(0, 2);
    }
    
    // Check meta tags
    const metaLang = $('meta[http-equiv="content-language"]').attr('content') ||
                     $('meta[name="language"]').attr('content');
    
    if (metaLang) {
      return metaLang.substring(0, 2);
    }
    
    return 'en'; // Default to English
  }

  /**
   * Extract images
   */
  extractImages($) {
    const images = [];
    
    $('img').each((i, element) => {
      const src = $(element).attr('src');
      const alt = $(element).attr('alt');
      
      if (src && src.startsWith('http')) {
        images.push({
          url: src,
          alt: alt || '',
          width: $(element).attr('width'),
          height: $(element).attr('height')
        });
      }
    });
    
    return images.slice(0, 10); // Limit to first 10 images
  }

  /**
   * Extract published date
   */
  extractPublishedDate($) {
    const dateSelectors = [
      'time[datetime]',
      '.published', '.date', '.article-date', '.post-date',
      '[property="article:published_time"]'
    ];
    
    for (const selector of dateSelectors) {
      const element = $(selector).first();
      
      // Try datetime attribute first
      const datetime = element.attr('datetime') || element.attr('content');
      if (datetime) {
        const date = new Date(datetime);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      // Try text content
      const text = element.text().trim();
      if (text) {
        const date = new Date(text);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    return null;
  }

  /**
   * Clean extracted text
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .replace(/[ \t]+$/gm, '') // Remove trailing spaces
      .trim()
      .substring(0, this.config.maxContentLength); // Limit length
  }

  /**
   * Batch extract content from multiple URLs
   */
  async batchExtractContent(urls, maxConcurrency = 5) {
    const results = [];
    const batches = [];
    
    // Create batches
    for (let i = 0; i < urls.length; i += maxConcurrency) {
      batches.push(urls.slice(i, i + maxConcurrency));
    }
    
    // Process batches
    for (const batch of batches) {
      const batchPromises = batch.map(url => this.extractContent(url));
      const batchResults = await Promise.allSettled(batchPromises);
      
      results.push(...batchResults.map((result, index) => ({
        url: batch[index],
        ...(result.status === 'fulfilled' ? result.value : { 
          success: false, 
          error: result.reason.message,
          status: 'failed'
        })
      })));
      
      // Add delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}

module.exports = new ContentExtractor();
