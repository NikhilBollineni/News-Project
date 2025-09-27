const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:1001'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:1001'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection (using the existing config)
const MONGODB_URI = process.env.MONGODB_URL || 'mongodb+srv://nikhilbollineni30_db_user:UFpGMGVv53gi3qpi@cluster0-azure.2bfte3e.mongodb.net/automotive-news?retryWrites=true&w=majority&appName=Clustero-Azure';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  retryWrites: true,
  w: 'majority',
  readPreference: 'primary',
  bufferCommands: false,
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
})
.catch(err => {
  console.log('⚠️ MongoDB not available, running in demo mode');
  console.log('💡 Error:', err.message);
});

// Simple Article model
const articleSchema = new mongoose.Schema({
  title: String,
  summary: String,
  content: String,
  url: String,
  source: {
    name: String,
    url: String
  },
  industry: { type: String, default: 'automotive' },
  category: { type: String, default: 'general' },
  tags: [String],
  publishedAt: { type: Date, default: Date.now },
  scrapedAt: { type: Date, default: Date.now },
  processedByAI: { type: Boolean, default: false },
  aiTitle: String,
  aiSummary: String,
  aiCategory: String,
  aiSentiment: String,
  aiTags: [String],
  importance: { type: Number, default: 5 }
});

const Article = mongoose.model('Article', articleSchema);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    let dbStatus = 'disconnected';
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.admin().ping();
      dbStatus = 'connected';
    }
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      websocket: { connectedClients: 0 },
      cache: { status: 'disabled' }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Get articles endpoint
app.get('/api/articles', async (req, res) => {
  try {
    const { page = 1, limit = 50, category, search, industry = 'automotive' } = req.query;
    
    // Build query
    const query = { industry };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { aiSummary: { $regex: search, $options: 'i' } }
      ];
    }

    // If no database connection, return mock data
    if (mongoose.connection.readyState !== 1) {
      const mockArticles = [
        {
          _id: 'mock1',
          title: 'Tesla Announces New Electric Vehicle Model',
          summary: 'Tesla reveals its latest electric vehicle with advanced autonomous driving capabilities.',
          category: 'product-launches',
          industry: 'automotive',
          source: { name: 'TechCrunch', url: 'https://techcrunch.com' },
          publishedAt: new Date().toISOString(),
          url: 'https://techcrunch.com/tesla-new-model',
          importance: 8,
          tags: ['tesla', 'electric-vehicles', 'autonomous-driving']
        },
        {
          _id: 'mock2',
          title: 'BMW Invests $2B in Electric Vehicle Production',
          summary: 'BMW announces major investment in expanding its electric vehicle manufacturing capabilities.',
          category: 'manufacturing',
          industry: 'automotive',
          source: { name: 'Automotive News', url: 'https://autonews.com' },
          publishedAt: new Date(Date.now() - 3600000).toISOString(),
          url: 'https://autonews.com/bmw-investment',
          importance: 7,
          tags: ['bmw', 'investment', 'manufacturing']
        }
      ];
      
      return res.json({
        success: true,
        articles: mockArticles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: mockArticles.length,
          pages: 1
        }
      });
    }

    // Get articles from database
    const skip = (page - 1) * limit;
    const articles = await Article.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Article.countDocuments(query);
    
    res.json({
      success: true,
      articles: articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get article stats
app.get('/api/articles/stats', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({
        totalArticles: 2,
        articlesByBrand: { 'Tesla': 1, 'BMW': 1 },
        articlesByCategory: { 'product-launches': 1, 'manufacturing': 1 },
        lastFetchTime: new Date().toISOString()
      });
    }

    const totalArticles = await Article.countDocuments({ industry: 'automotive' });
    const categoryStats = await Article.aggregate([
      { $match: { industry: 'automotive' } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const articlesByCategory = {};
    categoryStats.forEach(stat => {
      articlesByCategory[stat._id] = stat.count;
    });

    res.json({
      totalArticles,
      articlesByBrand: { 'Tesla': 1, 'BMW': 1 },
      articlesByCategory,
      lastFetchTime: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manual refresh endpoint (mock)
app.post('/api/admin/scrape-feeds', async (req, res) => {
  try {
    console.log('🔄 Manual news refresh triggered (mock)');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    res.json({
      success: true,
      message: 'News refresh completed (mock mode)',
      newArticlesCount: 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Manual refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh news',
      message: error.message
    });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
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

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📰 Articles API: http://localhost:${PORT}/api/articles`);
  console.log(`🔄 Refresh API: http://localhost:${PORT}/api/admin/scrape-feeds`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🟡 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🟡 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
