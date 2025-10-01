const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const AutomotiveArticle = require('../models/AutomotiveArticle');
const AutomotivePublisher = require('../models/AutomotivePublisher');
const { globalAutomotiveFeeds, getActiveFeeds } = require('../data/globalAutomotiveFeeds');

class AutomotiveRSSScraper {
  constructor() {
    this.parser = new Parser({
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Automotive News Aggregator Bot 2.0; +https://automotive-news-hub.com/bot)'
      }
    });
    this.rateLimiter = new Map(); // Simple rate limiting
  }

  // Rate limiting helper
  async checkRateLimit(feedUrl) {
    const now = Date.now();
    const lastFetch = this.rateLimiter.get(feedUrl);
    
    if (lastFetch && (now - lastFetch) < 30000) { // 30 seconds between requests
      const waitTime = 30000 - (now - lastFetch);
      console.log(`Rate limiting: waiting ${waitTime}ms for ${feedUrl}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.rateLimiter.set(feedUrl, now);
  }

  async scrapeAutomotiveFeed(feedUrl, publisher) {
    try {
      await this.checkRateLimit(feedUrl);
      console.log(`📡 Fetching from ${publisher.name}...`);
      
      const feed = await this.parser.parseURL(feedUrl);
      
      const articles = [];
      
      for (const item of feed.items.slice(0, 15)) { // Limit to latest 15 items
        try {
          // Check if article already exists (commented out for in-memory storage)
          // const existingArticle = await AutomotiveArticle.findOne({ originalUrl: item.link });
          // if (existingArticle) {
          //   console.log(`Article already exists: ${item.title}`);
          //   continue;
          // }

          // Scrape full content
          const content = await this.scrapeAutomotiveContent(item.link);
          
          // Basic automotive relevance check
          if (!this.isAutomotiveRelevant(item.title, content)) {
            console.log(`Article not automotive relevant: ${item.title}`);
            continue;
          }

          const articleData = {
            originalTitle: item.title || 'Untitled',
            originalUrl: item.link,
            originalContent: content,
            originalSummary: item.contentSnippet || item.content || '',
            publisher: {
              name: publisher.name,
              website: publisher.website,
              rssFeed: feedUrl,
              logo: publisher.logo,
              credibility: publisher.credibility,
              automotiveFocus: publisher.automotiveFocus
            },
            publishedAt: new Date(item.pubDate || Date.now()),
            scrapedAt: new Date(),
            processedByAI: false,
            copyright: {
              holder: publisher.name,
              attribution: publisher.name,
              fairUse: true,
              disclaimer: 'Automotive industry summary, read full article at source'
            }
          };

          articles.push(articleData);
        } catch (itemError) {
          console.error(`Error processing automotive item: ${itemError.message}`);
          continue;
        }
      }

      return articles;
    } catch (error) {
      console.error(`Error scraping automotive feed ${feedUrl}:`, error.message);
      throw error;
    }
  }

  async scrapeAutomotiveContent(url) {
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Automotive News Bot)'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Remove non-content elements
      $('script, style, nav, header, footer, aside, .advertisement, .ads, .social-share, .comments').remove();
      
      // Try to find main content
      let content = '';
      
      // Common selectors for automotive article content
      const contentSelectors = [
        'article .content',
        'article .post-content',
        'article .entry-content',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.content',
        'main',
        '.main-content',
        '.article-body',
        '.post-body'
      ];

      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text().trim();
          break;
        }
      }

      // Fallback to body if no specific content found
      if (!content) {
        content = $('body').text().trim();
      }

      // Clean up content
      content = content
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .trim()
        .substring(0, 8000); // Limit content length

      return content;
    } catch (error) {
      console.error(`Error scraping automotive content from ${url}:`, error.message);
      return '';
    }
  }

  isAutomotiveRelevant(title, content) {
    const automotiveKeywords = [
      // Brands
      'tesla', 'ford', 'gm', 'toyota', 'honda', 'bmw', 'mercedes', 'audi', 'volkswagen',
      'nissan', 'hyundai', 'kia', 'subaru', 'mazda', 'lexus', 'infiniti', 'acura',
      'cadillac', 'lincoln', 'buick', 'chevrolet', 'gmc', 'ram', 'jeep', 'dodge',
      'chrysler', 'porsche', 'ferrari', 'lamborghini', 'bentley', 'rolls-royce',
      'aston martin', 'mclaren', 'jaguar', 'land rover', 'volvo', 'genesis',
      'rivian', 'lucid', 'polestar', 'fisker', 'byd', 'nio', 'xpeng', 'li auto',
      
      // Technologies
      'electric vehicle', 'ev', 'hybrid', 'autonomous', 'self-driving', 'autopilot',
      'battery', 'charging', 'range', 'mpg', 'fuel economy', 'emissions',
      'hydrogen', 'fuel cell', 'plug-in', 'mild hybrid',
      
      // Vehicle Types
      'sedan', 'suv', 'truck', 'motorcycle', 'commercial vehicle', 'luxury car',
      'sports car', 'hatchback', 'coupe', 'convertible', 'pickup',
      
      // Industry Terms
      'automotive', 'car', 'vehicle', 'automobile', 'auto industry', 'car industry',
      'manufacturing', 'production', 'assembly', 'dealer', 'dealership',
      'sales', 'market', 'demand', 'supply chain', 'parts', 'components',
      'safety', 'crash test', 'recall', 'warranty', 'insurance',
      
      // Business Terms
      'merger', 'acquisition', 'partnership', 'investment', 'funding', 'ipo',
      'earnings', 'revenue', 'profit', 'loss', 'quarterly', 'annual'
    ];

    const text = (title + ' ' + content).toLowerCase();
    const keywordCount = automotiveKeywords.filter(keyword => text.includes(keyword)).length;
    
    // Consider relevant if it contains at least 2 automotive keywords
    return keywordCount >= 2;
  }

  async processAllAutomotiveFeeds() {
    try {
      const publishers = await AutomotivePublisher.find({ isActive: true });

      for (const publisher of publishers) {
        try {
          console.log(`Processing automotive publisher: ${publisher.name}`);
          const articles = await this.scrapeAutomotiveFeed(publisher.rssFeed, publisher);
          
          // Save articles to database
          for (const articleData of articles) {
            try {
              const article = new AutomotiveArticle(articleData);
              await article.save();
              console.log(`Saved automotive article: ${article.originalTitle}`);
            } catch (saveError) {
              console.error(`Error saving automotive article: ${saveError.message}`);
            }
          }

          // Update publisher last scraped time and success rate
          publisher.lastScraped = new Date();
          publisher.stats.totalArticles += articles.length;
          await publisher.save();

          // Add delay between publishers to be respectful
          await new Promise(resolve => setTimeout(resolve, 3000));

        } catch (error) {
          console.error(`Error processing automotive publisher ${publisher.name}:`, error.message);
          
          // Update error stats
          publisher.stats.errorCount += 1;
          publisher.stats.lastError = new Date();
          await publisher.save();
        }
      }
    } catch (error) {
      console.error('Error processing automotive feeds:', error.message);
    }
  }

  async scrapeSpecificAutomotiveFeed(publisherName) {
    try {
      // Publisher lookup commented out for in-memory storage
      // const publisher = await AutomotivePublisher.findOne({ 
      //   name: publisherName, 
      //   isActive: true 
      // });
      const publisher = null;

      if (!publisher) {
        throw new Error(`Automotive publisher not found: ${publisherName}`);
      }

      const articles = await this.scrapeAutomotiveFeed(publisher.rssFeed, publisher);
      
      // Save articles
      for (const articleData of articles) {
        try {
          const article = new AutomotiveArticle(articleData);
          await article.save();
          console.log(`Saved automotive article: ${article.originalTitle}`);
        } catch (saveError) {
          console.error(`Error saving automotive article: ${saveError.message}`);
        }
      }

      return articles;
    } catch (error) {
      console.error(`Error scraping specific automotive feed: ${error.message}`);
      throw error;
    }
  }

  // New method to fetch from global automotive feeds
  async fetchFromGlobalFeeds(openai) {
    console.log('🌍 Fetching from global automotive RSS feeds...');
    const activeFeeds = getActiveFeeds();
    let totalArticles = 0;
    const results = [];

    for (const feed of activeFeeds) {
      try {
        console.log(`📡 Fetching from ${feed.name} (${feed.region})...`);
        const articles = await this.scrapeAutomotiveFeed(feed.rssFeed, feed);
        
        if (articles.length > 0) {
          // Process articles with AI
          for (const articleData of articles) {
            try {
              const processedArticle = await this.processArticleWithAI(articleData, openai);
              if (processedArticle) {
                results.push(processedArticle);
                totalArticles++;
                console.log(`✅ Processed: ${processedArticle.aiTitle || processedArticle.originalTitle}`);
              }
            } catch (aiError) {
              console.error(`Error processing article with AI: ${aiError.message}`);
              // Still add the article without AI processing
              results.push(articleData);
              totalArticles++;
            }
          }
        }

        // Update feed stats
        feed.stats.totalArticles += articles.length;
        feed.lastChecked = new Date();

        // Add delay between feeds
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error fetching feed ${feed.name}: ${error.message}`);
        feed.stats.errorCount += 1;
        feed.stats.lastError = new Date();
      }
    }

    console.log(`🎉 Fetched ${totalArticles} new automotive articles`);
    return { articles: results, totalCount: totalArticles };
  }

  // Helper method to process article with AI (from real-automotive-server.js)
  async processArticleWithAI(articleData, openai) {
    try {
      const prompt = `You are an expert automotive industry analyst. Analyze this automotive news article and provide comprehensive insights.

Article Title: ${articleData.originalTitle}
Article Content: ${articleData.originalContent ? articleData.originalContent.substring(0, 3000) : articleData.originalSummary}

IMPORTANT: Respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, or additional text.

Required JSON structure:
{
  "title": "Create an engaging, automotive industry-focused title (max 80 characters)",
  "summary": "Create a comprehensive, detailed summary highlighting key automotive industry insights, market implications, and strategic analysis (300-500 words)",
  "category": "Classify into one of these automotive categories: product-launches, ev-technology, manufacturing, m-and-a, financials, regulatory, market-trends, competitor-moves, supply-chain",
  "tags": ["Extract 3-5 relevant automotive tags (brands, technologies, markets)"],
  "sentiment": "Analyze sentiment for automotive industry impact: positive, negative, or neutral",
  "importance": "Rate importance 1-5 for automotive industry professionals (5 being most critical)",
  "automotive": {
    "vehicleType": "Identify vehicle type: sedan, suv, truck, motorcycle, commercial, luxury, sports, hatchback, coupe, convertible",
    "brand": "Identify automotive brand: Tesla, Ford, GM, Toyota, Honda, BMW, Mercedes-Benz, Audi, Volkswagen, Nissan, Hyundai, Kia, Subaru, Mazda, Lexus, Infiniti, Acura, Cadillac, Lincoln, Buick, Chevrolet, GMC, Ram, Jeep, Dodge, Chrysler, Porsche, Ferrari, Lamborghini, Bentley, Rolls-Royce, Aston Martin, McLaren, Jaguar, Land Rover, Volvo, Genesis, Rivian, Lucid, Polestar, Fisker, BYD, NIO, XPeng, Li Auto, Unknown",
    "market": "Identify market segment: luxury, mass-market, commercial, performance, economy",
    "technology": ["Identify technologies: EV, hybrid, autonomous, ICE, hydrogen, plug-in-hybrid, mild-hybrid"],
    "region": "Identify region: north-america, europe, asia, china, india, south-america, global",
    "priceRange": "Identify price range: budget, mid-range, luxury, ultra-luxury"
  }
}

Focus on automotive industry relevance, brand recognition, technology trends, and market impact.`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert automotive industry analyst specializing in news categorization, brand recognition, and technology trends. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      let aiResponse;
      const responseContent = response.choices[0].message.content;
      
      // Clean up the response to ensure it's valid JSON
      let cleanedContent = responseContent.trim();
      
      // Remove markdown code blocks if present
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any trailing text after the JSON
      const jsonEndIndex = cleanedContent.lastIndexOf('}');
      if (jsonEndIndex !== -1) {
        cleanedContent = cleanedContent.substring(0, jsonEndIndex + 1);
      }
      
      try {
        aiResponse = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('JSON parse error, trying to fix:', parseError.message);
        
        // Fallback: try to extract JSON from the response
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            aiResponse = JSON.parse(jsonMatch[0]);
          } catch (fallbackError) {
            throw new Error(`Failed to parse AI response as JSON: ${fallbackError.message}`);
          }
        } else {
          throw new Error('No valid JSON found in AI response');
        }
      }

      // Enhance article data with AI processing results
      return {
        ...articleData,
        aiTitle: aiResponse.title,
        aiSummary: aiResponse.summary,
        aiCategory: aiResponse.category,
        aiTags: aiResponse.tags,
        aiSentiment: aiResponse.sentiment,
        aiImportance: aiResponse.importance,
        automotive: aiResponse.automotive,
        processedByAI: true,
        processedAt: new Date()
      };

    } catch (error) {
      console.error(`Error processing article with AI: ${error.message}`);
      return null;
    }
  }
}

module.exports = new AutomotiveRSSScraper();
