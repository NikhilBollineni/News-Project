const express = require('express');
const Article = require('../models/Article');
const RSSFeed = require('../models/RSSFeed');
const RSSScraper = require('../services/rssScraper');
const AIProcessor = require('../services/aiProcessor');

const router = express.Router();

// Initialize services
let rssScraper, aiProcessor;

const initializeServices = async () => {
  if (!rssScraper) {
    rssScraper = new RSSScraper();
  }
  if (!aiProcessor) {
    aiProcessor = new AIProcessor();
  }
};

// Manual refresh endpoint
router.post('/refresh-news', async (req, res) => {
  try {
    console.log('🔄 Manual news refresh triggered');
    
    await initializeServices();
    
    // Get active RSS feeds
    const feeds = await RSSFeed.find({ isActive: true });
    
    if (feeds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No active RSS feeds found',
        message: 'Please configure RSS feeds first'
      });
    }
    
    let totalNewArticles = 0;
    let totalProcessed = 0;
    const results = [];
    
    for (const feed of feeds) {
      try {
        console.log(`📡 Processing feed: ${feed.name}`);
        
        // Fetch RSS feed
        const articles = await rssScraper.fetchRSSFeed(feed.url);
        totalProcessed += articles.length;
        
        let feedNewArticles = 0;
        
        for (const articleData of articles) {
          try {
            // Check if article already exists
            const existingArticle = await Article.findOne({ url: articleData.url });
            
            if (existingArticle) {
              continue; // Skip duplicate
            }
            
            // Create new article
            const article = new Article({
              title: articleData.title,
              summary: articleData.summary || articleData.title,
              content: articleData.content,
              url: articleData.url,
              source: {
                name: feed.name,
                url: feed.website,
                rssFeed: feed.url
              },
              industry: feed.industry,
              category: 'other', // Will be updated by AI
              tags: articleData.tags || [],
              publishedAt: articleData.publishedAt || new Date(),
              scrapedAt: new Date()
            });
            
            // Save article
            await article.save();
            feedNewArticles++;
            totalNewArticles++;
            
            // Broadcast new article via WebSocket
            try {
              const websocketService = require('../services/websocketService');
              websocketService.broadcastNewArticle(article);
              console.log(`📡 Broadcasted new article: ${article.title}`);
            } catch (broadcastError) {
              console.error('❌ Error broadcasting article:', broadcastError.message);
            }
            
            // Process with AI
            try {
              const aiResult = await aiProcessor.processArticle(article);
              
              if (aiResult) {
                article.processedByAI = true;
                article.aiTitle = aiResult.title;
                article.aiSummary = aiResult.summary;
                article.aiCategory = aiResult.category;
                article.aiSentiment = aiResult.sentiment;
                article.aiTags = aiResult.tags;
                article.importance = aiResult.importance;
                
                await article.save();
                console.log(`✅ AI processed: ${article.title}`);
                
                // Broadcast AI processing completion
                try {
                  const websocketService = require('../services/websocketService');
                  websocketService.broadcastArticleUpdate(article);
                } catch (broadcastError) {
                  console.error('❌ Error broadcasting AI update:', broadcastError.message);
                }
              }
            } catch (aiError) {
              console.error(`❌ AI processing failed for article ${article._id}:`, aiError.message);
            }
            
          } catch (articleError) {
            console.error(`❌ Error processing article:`, articleError.message);
          }
        }
        
        // Update feed last scraped time
        feed.lastScraped = new Date();
        await feed.save();
        
        results.push({
          feedName: feed.name,
          feedUrl: feed.url,
          articlesProcessed: articles.length,
          newArticles: feedNewArticles,
          success: true
        });
        
        console.log(`✅ Feed ${feed.name}: ${feedNewArticles} new articles from ${articles.length} total`);
        
      } catch (feedError) {
        console.error(`❌ Error processing feed ${feed.name}:`, feedError.message);
        results.push({
          feedName: feed.name,
          feedUrl: feed.url,
          error: feedError.message,
          success: false
        });
      }
    }
    
    res.json({
      success: true,
      message: `News refresh completed. ${totalNewArticles} new articles added from ${totalProcessed} processed.`,
      newArticlesCount: totalNewArticles,
      totalProcessed,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Manual refresh error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh news',
      message: error.message
    });
  }
});

// Get ingestion status
router.get('/status', async (req, res) => {
  try {
    const feeds = await RSSFeed.find({ isActive: true });
    const totalArticles = await Article.countDocuments();
    const recentArticles = await Article.find()
      .sort({ scrapedAt: -1 })
      .limit(5)
      .select('title scrapedAt source');
    
    const lastScraped = await Article.findOne()
      .sort({ scrapedAt: -1 })
      .select('scrapedAt');
    
    res.json({
      status: 'active',
      totalFeeds: feeds.length,
      totalArticles,
      lastScraped: lastScraped?.scrapedAt,
      recentArticles,
      feeds: feeds.map(feed => ({
        name: feed.name,
        url: feed.url,
        lastScraped: feed.lastScraped,
        isActive: feed.isActive
      }))
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get ingestion status',
      message: error.message
    });
  }
});

// Test RSS feed
router.post('/test-feed', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    await initializeServices();
    
    const result = await rssScraper.testFeed(url);
    
    res.json(result);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to test RSS feed',
      message: error.message
    });
  }
});

// Add new RSS feed
router.post('/add-feed', async (req, res) => {
  try {
    const { name, url, website, industry = 'automotive' } = req.body;
    
    if (!name || !url || !website) {
      return res.status(400).json({
        success: false,
        error: 'Name, URL, and website are required'
      });
    }
    
    // Check if feed already exists
    const existingFeed = await RSSFeed.findOne({ url });
    if (existingFeed) {
      return res.status(400).json({
        success: false,
        error: 'RSS feed already exists'
      });
    }
    
    // Test the feed first
    await initializeServices();
    const testResult = await rssScraper.testFeed(url);
    
    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid RSS feed',
        details: testResult.error
      });
    }
    
    // Create new feed
    const feed = new RSSFeed({
      name,
      url,
      website,
      industry,
      isActive: true,
      lastScraped: null
    });
    
    await feed.save();
    
    res.json({
      success: true,
      message: 'RSS feed added successfully',
      feed: {
        id: feed._id,
        name: feed.name,
        url: feed.url,
        website: feed.website,
        industry: feed.industry,
        isActive: feed.isActive
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add RSS feed',
      message: error.message
    });
  }
});

// Update RSS feed
router.put('/feed/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const feed = await RSSFeed.findById(id);
    if (!feed) {
      return res.status(404).json({
        success: false,
        error: 'RSS feed not found'
      });
    }
    
    // Update feed
    Object.assign(feed, updates);
    await feed.save();
    
    res.json({
      success: true,
      message: 'RSS feed updated successfully',
      feed: {
        id: feed._id,
        name: feed.name,
        url: feed.url,
        website: feed.website,
        industry: feed.industry,
        isActive: feed.isActive
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update RSS feed',
      message: error.message
    });
  }
});

// Delete RSS feed
router.delete('/feed/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const feed = await RSSFeed.findById(id);
    if (!feed) {
      return res.status(404).json({
        success: false,
        error: 'RSS feed not found'
      });
    }
    
    await RSSFeed.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'RSS feed deleted successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete RSS feed',
      message: error.message
    });
  }
});

// Get all RSS feeds
router.get('/feeds', async (req, res) => {
  try {
    const feeds = await RSSFeed.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      feeds: feeds.map(feed => ({
        id: feed._id,
        name: feed.name,
        url: feed.url,
        website: feed.website,
        industry: feed.industry,
        isActive: feed.isActive,
        lastScraped: feed.lastScraped,
        createdAt: feed.createdAt
      }))
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get RSS feeds',
      message: error.message
    });
  }
});

// Process single article with AI
router.post('/process-article/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }
    
    await initializeServices();
    
    const aiResult = await aiProcessor.processArticle(article);
    
    if (aiResult) {
      article.processedByAI = true;
      article.aiTitle = aiResult.title;
      article.aiSummary = aiResult.summary;
      article.aiCategory = aiResult.category;
      article.aiSentiment = aiResult.sentiment;
      article.aiTags = aiResult.tags;
      article.importance = aiResult.importance;
      
      await article.save();
      
      res.json({
        success: true,
        message: 'Article processed with AI successfully',
        article: {
          id: article._id,
          title: article.title,
          aiTitle: article.aiTitle,
          aiSummary: article.aiSummary,
          aiCategory: article.aiCategory,
          aiSentiment: article.aiSentiment,
          aiTags: article.aiTags,
          importance: article.importance
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'AI processing failed'
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process article with AI',
      message: error.message
    });
  }
});

module.exports = router;