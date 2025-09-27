const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import database connection
const { connectDB, healthCheck } = require('./config/database');

// Import models
const Article = require('./models/Article');
const RSSFeed = require('./models/RSSFeed');

// Import services
const RSSScraper = require('./services/rssScraper');
const AIProcessor = require('./services/aiProcessor');
const WebSocketService = require('./services/websocketService');

// Import routes
const articlesRoutes = require('./routes/articles');
const feedsRoutes = require('./routes/feeds');
const newsIngestionRoutes = require('./routes/newsIngestion');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:1001',
      'http://localhost:1000',
      'http://localhost:3000'
    ],
    credentials: true
  }
});

const PORT = process.env.PORT || 1000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.RATE_LIMIT_PER_MINUTE || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:1001',
    'http://localhost:1000',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbHealth,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API Routes
app.use('/api/articles', articlesRoutes);
app.use('/api/feeds', feedsRoutes);
app.use('/api/admin', newsIngestionRoutes);

// Initialize WebSocket service
const wsService = new WebSocketService(io);

// Initialize services
let rssScraper, aiProcessor;

const initializeServices = async () => {
  try {
    rssScraper = new RSSScraper();
    aiProcessor = new AIProcessor();
    
    console.log('✅ Services initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing services:', error.message);
  }
};

// RSS Polling Service
const startRSSPolling = async () => {
  const pollInterval = (process.env.POLL_INTERVAL_SECONDS || 120) * 1000;
  
  const pollRSS = async () => {
    try {
      console.log('🔄 Starting RSS polling...');
      
      // Get active RSS feeds
      const feeds = await RSSFeed.find({ isActive: true });
      
      for (const feed of feeds) {
        try {
          console.log(`📡 Processing feed: ${feed.name}`);
          
          // Fetch and parse RSS feed
          const articles = await rssScraper.fetchRSSFeed(feed.url);
          
          let newArticlesCount = 0;
          
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
              newArticlesCount++;
              
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
                }
              } catch (aiError) {
                console.error(`❌ AI processing failed for article ${article._id}:`, aiError.message);
              }
              
              // Broadcast new article via WebSocket
              wsService.broadcastNewArticle(article);
              
            } catch (articleError) {
              console.error(`❌ Error processing article:`, articleError.message);
            }
          }
          
          // Update feed last scraped time
          feed.lastScraped = new Date();
          await feed.save();
          
          console.log(`✅ Feed ${feed.name}: ${newArticlesCount} new articles processed`);
          
        } catch (feedError) {
          console.error(`❌ Error processing feed ${feed.name}:`, feedError.message);
        }
      }
      
      console.log('✅ RSS polling completed');
      
    } catch (error) {
      console.error('❌ RSS polling error:', error.message);
    }
  };
  
  // Initial poll
  await pollRSS();
  
  // Set up interval
  setInterval(pollRSS, pollInterval);
  console.log(`🔄 RSS polling scheduled every ${pollInterval / 1000} seconds`);
};

// Manual refresh endpoint
app.post('/api/admin/refresh-news', async (req, res) => {
  try {
    console.log('🔄 Manual news refresh triggered');
    
    // Trigger immediate RSS polling
    const feeds = await RSSFeed.find({ isActive: true });
    let totalNewArticles = 0;
    
    for (const feed of feeds) {
      try {
        const articles = await rssScraper.fetchRSSFeed(feed.url);
        
        for (const articleData of articles) {
          const existingArticle = await Article.findOne({ url: articleData.url });
          
          if (!existingArticle) {
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
              category: 'other',
              tags: articleData.tags || [],
              publishedAt: articleData.publishedAt || new Date(),
              scrapedAt: new Date()
            });
            
            await article.save();
            totalNewArticles++;
            
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
              }
            } catch (aiError) {
              console.error(`❌ AI processing failed:`, aiError.message);
            }
            
            wsService.broadcastNewArticle(article);
          }
        }
        
        feed.lastScraped = new Date();
        await feed.save();
        
      } catch (feedError) {
        console.error(`❌ Error processing feed ${feed.name}:`, feedError.message);
      }
    }
    
    res.json({
      success: true,
      message: `News refresh completed. ${totalNewArticles} new articles added.`,
      newArticlesCount: totalNewArticles,
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

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Initialize application
const initializeApp = async () => {
  try {
    console.log('🚀 Starting Automotive News Aggregation Server...');
    
    // Connect to database
    await connectDB();
    
    // Initialize services
    await initializeServices();
    
    // Start RSS polling
    await startRSSPolling();
    
    // Start server
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📰 Articles API: http://localhost:${PORT}/api/articles`);
      console.log(`🔄 Refresh API: http://localhost:${PORT}/api/admin/refresh-news`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize application:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🟡 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🟡 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
initializeApp();

module.exports = { app, server, io };
