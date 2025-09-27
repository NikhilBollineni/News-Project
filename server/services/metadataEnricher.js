const natural = require('natural');
const logger = require('../utils/logger');

class MetadataEnricher {
  constructor() {
    this.stemmer = natural.PorterStemmer;
    this.tokenizer = new natural.WordTokenizer();
    
    // Company name patterns and ticker symbols
    this.companyPatterns = [
      // Automotive companies
      /\b(Tesla|TSLA|Ford|F|GM|General Motors|Toyota|TM|Honda|HMC|BMW|Mercedes|Audi|Volkswagen|VW|Nissan|Hyundai|Kia|Subaru|Mazda|Volvo|Porsche|Ferrari|Lamborghini|Bentley|Rolls-Royce|McLaren|Aston Martin)\b/gi,
      // EV companies
      /\b(Rivian|RIVN|Lucid|LCID|Fisker|FSR|NIO|XPEV|XPeng|Li Auto|BYD|Polestar|Lordstown|RIDE)\b/gi,
      // Tech companies
      /\b(Apple|AAPL|Google|GOOGL|Microsoft|MSFT|Amazon|AMZN|Meta|META|Netflix|NFLX|Tesla|TSLA)\b/gi
    ];
    
    // Financial terms
    this.financialTerms = [
      'revenue', 'earnings', 'profit', 'loss', 'quarterly', 'annual', 'sales', 'growth',
      'investment', 'funding', 'ipo', 'acquisition', 'merger', 'partnership', 'deal',
      'stock', 'share', 'dividend', 'market cap', 'valuation', 'spac'
    ];
    
    // Technology terms
    this.techTerms = [
      'autonomous', 'self-driving', 'ai', 'artificial intelligence', 'machine learning',
      'battery', 'charging', 'electric', 'ev', 'hybrid', 'fuel cell', 'hydrogen',
      'lidar', 'radar', 'camera', 'sensor', 'software', 'ota', 'over-the-air'
    ];
  }

  /**
   * Extract entities from text using regex patterns and NLP
   */
  extractEntities(text) {
    if (!text) return [];
    
    const entities = new Set();
    
    // Extract company names
    this.companyPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => entities.add(match.trim()));
      }
    });
    
    // Extract potential company names (capitalized words)
    const tokens = this.tokenizer.tokenize(text);
    let i = 0;
    while (i < tokens.length - 1) {
      const token = tokens[i];
      const nextToken = tokens[i + 1];
      
      // Look for capitalized words that might be company names
      if (this.isCapitalized(token) && this.isCapitalized(nextToken)) {
        const companyName = `${token} ${nextToken}`;
        entities.add(companyName);
        i += 2;
      } else {
        i++;
      }
    }
    
    // Extract numbers and percentages
    const numberMatches = text.match(/\$[\d,]+(?:\.\d{2})?|\d+(?:\.\d+)?%|\d+(?:,\d{3})*(?:\.\d+)?/g);
    if (numberMatches) {
      numberMatches.forEach(match => entities.add(match));
    }
    
    return Array.from(entities);
  }

  /**
   * Check if a token is capitalized
   */
  isCapitalized(token) {
    return /^[A-Z][a-z]+$/.test(token);
  }

  /**
   * Extract key topics and themes
   */
  extractTopics(text) {
    if (!text) return [];
    
    const topics = new Set();
    const textLower = text.toLowerCase();
    
    // Check for financial topics
    this.financialTerms.forEach(term => {
      if (textLower.includes(term)) {
        topics.add(term);
      }
    });
    
    // Check for technology topics
    this.techTerms.forEach(term => {
      if (textLower.includes(term)) {
        topics.add(term);
      }
    });
    
    return Array.from(topics);
  }

  /**
   * Estimate reading time
   */
  estimateReadingTime(text) {
    if (!text) return 0;
    
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = text.split(/\s+/).length;
    
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Extract sentiment indicators
   */
  extractSentimentIndicators(text) {
    if (!text) return { positive: 0, negative: 0, neutral: 0 };
    
    const positiveWords = [
      'growth', 'increase', 'rise', 'up', 'gain', 'profit', 'success', 'breakthrough',
      'innovation', 'launch', 'expansion', 'partnership', 'collaboration', 'achievement'
    ];
    
    const negativeWords = [
      'decline', 'decrease', 'fall', 'down', 'loss', 'failure', 'problem', 'issue',
      'concern', 'challenge', 'risk', 'threat', 'crisis', 'bankruptcy', 'recall'
    ];
    
    const textLower = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      const matches = textLower.match(new RegExp(`\\b${word}\\b`, 'g'));
      if (matches) positiveCount += matches.length;
    });
    
    negativeWords.forEach(word => {
      const matches = textLower.match(new RegExp(`\\b${word}\\b`, 'g'));
      if (matches) negativeCount += matches.length;
    });
    
    const total = positiveCount + negativeCount;
    
    if (total === 0) {
      return { positive: 0, negative: 0, neutral: 1 };
    }
    
    return {
      positive: positiveCount / total,
      negative: negativeCount / total,
      neutral: Math.max(0, 1 - (positiveCount + negativeCount) / total)
    };
  }

  /**
   * Extract geographic locations
   */
  extractLocations(text) {
    if (!text) return [];
    
    const locations = new Set();
    
    // Common geographic patterns
    const locationPatterns = [
      /\b(United States|USA|US|America|China|Japan|Germany|UK|United Kingdom|Canada|France|Italy|Spain|Netherlands|Sweden|Norway|Denmark|Finland|Australia|Brazil|India|South Korea|Mexico)\b/gi,
      /\b(California|Texas|New York|Florida|Michigan|Ohio|Tennessee|Alabama|Kentucky|South Carolina|North Carolina|Georgia|Virginia|Pennsylvania|Illinois|Indiana|Wisconsin|Minnesota|Iowa|Missouri|Kansas|Oklahoma|Arkansas|Louisiana|Mississippi|Alabama|Tennessee|Kentucky|West Virginia|Maryland|Delaware|New Jersey|Connecticut|Rhode Island|Massachusetts|Vermont|New Hampshire|Maine|Montana|North Dakota|South Dakota|Nebraska|Wyoming|Colorado|New Mexico|Arizona|Utah|Nevada|Idaho|Washington|Oregon|Alaska|Hawaii)\b/gi
    ];
    
    locationPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => locations.add(match.trim()));
      }
    });
    
    return Array.from(locations);
  }

  /**
   * Extract dates and time references
   */
  extractDates(text) {
    if (!text) return [];
    
    const dates = new Set();
    
    // Date patterns
    const datePatterns = [
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b/gi,
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g,
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b/gi
    ];
    
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => dates.add(match.trim()));
      }
    });
    
    return Array.from(dates);
  }

  /**
   * Extract product names and models
   */
  extractProducts(text) {
    if (!text) return [];
    
    const products = new Set();
    
    // Common automotive product patterns
    const productPatterns = [
      /\b(Model\s+S|Model\s+3|Model\s+X|Model\s+Y|Cybertruck|Semi|Roadster)\b/gi, // Tesla
      /\b(F-150|Mustang|Explorer|Escape|Bronco|Maverick|Ranger|Transit)\b/gi, // Ford
      /\b(Camry|Corolla|RAV4|Prius|Highlander|Tacoma|Tundra|Sienna)\b/gi, // Toyota
      /\b(Civic|Accord|CR-V|Pilot|HR-V|Passport|Ridgeline|Odyssey)\b/gi, // Honda
      /\b(Silverado|Equinox|Malibu|Traverse|Tahoe|Suburban|Colorado|Corvette)\b/gi // GM
    ];
    
    productPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => products.add(match.trim()));
      }
    });
    
    return Array.from(products);
  }

  /**
   * Enrich article metadata
   */
  async enrichMetadata(article) {
    try {
      const text = `${article.title} ${article.cleanText || article.snippet}`;
      
      const enrichedData = {
        extractedEntities: this.extractEntities(text),
        topics: this.extractTopics(text),
        readingTime: this.estimateReadingTime(text),
        sentimentIndicators: this.extractSentimentIndicators(text),
        locations: this.extractLocations(text),
        dates: this.extractDates(text),
        products: this.extractProducts(text),
        wordCount: text.split(/\s+/).length
      };
      
      // Determine language
      enrichedData.language = this.detectLanguage(text);
      
      // Extract images from content if available
      if (article.images && article.images.length > 0) {
        enrichedData.images = article.images.slice(0, 5); // Limit to 5 images
      }
      
      logger.info(`Enriched metadata for article: ${article.title}`);
      
      return enrichedData;
      
    } catch (error) {
      logger.error('Error enriching metadata:', error.message);
      return {
        extractedEntities: [],
        topics: [],
        readingTime: 0,
        sentimentIndicators: { positive: 0, negative: 0, neutral: 1 },
        locations: [],
        dates: [],
        products: [],
        wordCount: 0,
        language: 'en'
      };
    }
  }

  /**
   * Simple language detection
   */
  detectLanguage(text) {
    if (!text) return 'en';
    
    const textLower = text.toLowerCase();
    
    // Simple keyword-based detection
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le'];
    const frenchWords = ['le', 'la', 'de', 'et', 'à', 'un', 'il', 'que', 'ne', 'se', 'ce', 'pas'];
    
    let englishCount = 0;
    let spanishCount = 0;
    let frenchCount = 0;
    
    englishWords.forEach(word => {
      const matches = textLower.match(new RegExp(`\\b${word}\\b`, 'g'));
      if (matches) englishCount += matches.length;
    });
    
    spanishWords.forEach(word => {
      const matches = textLower.match(new RegExp(`\\b${word}\\b`, 'g'));
      if (matches) spanishCount += matches.length;
    });
    
    frenchWords.forEach(word => {
      const matches = textLower.match(new RegExp(`\\b${word}\\b`, 'g'));
      if (matches) frenchCount += matches.length;
    });
    
    const maxCount = Math.max(englishCount, spanishCount, frenchCount);
    
    if (maxCount === englishCount) return 'en';
    if (maxCount === spanishCount) return 'es';
    if (maxCount === frenchCount) return 'fr';
    
    return 'en'; // Default to English
  }

  /**
   * Batch enrich multiple articles
   */
  async batchEnrichMetadata(articles) {
    const enrichedArticles = [];
    
    for (const article of articles) {
      try {
        const enrichedData = await this.enrichMetadata(article);
        enrichedArticles.push({
          ...article,
          ...enrichedData
        });
      } catch (error) {
        logger.error(`Error enriching article ${article._id}:`, error.message);
        enrichedArticles.push(article); // Keep original if enrichment fails
      }
    }
    
    return enrichedArticles;
  }
}

module.exports = new MetadataEnricher();
