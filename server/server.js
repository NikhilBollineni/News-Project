const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Import routes
const articleRoutes = require('./routes/articles');
const feedRoutes = require('./routes/feeds');
const newsIngestionRoutes = require('./routes/newsIngestion');

// Import services
const rssScraper = require('./services/rssScraper');
const aiProcessor = require('./services/aiProcessor');
const scheduler = require('./services/scheduler');
const newsIngestionScheduler = require('./services/newsIngestionScheduler');
const monitoringService = require('./services/monitoringService');
const logger = require('./utils/logger');
const websocketService = require('./services/websocketService');
const cacheService = require('./services/cacheService');

const app = express();
const PORT = process.env.PORT || 5001;

// Production middleware for 100+ concurrent users
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:1001',
    'http://localhost:1000'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting for production
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Compression for better performance
const compression = require('compression');
app.use(compression());

// Security headers
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginEmbedderPolicy: false
}));

// Connect to MongoDB with production optimizations
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/industry-news', {
  maxPoolSize: 100, // Maintain up to 100 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  console.log('✅ Connected to MongoDB with production settings');
  console.log(`📊 Max pool size: 100 connections`);
  console.log(`⏱️ Connection timeout: 5s`);
  
  // Start the RSS scraping scheduler
  scheduler.start();
  
  // Initialize cache service (optional)
  cacheService.connect().catch(error => {
    console.log('⚠️ Redis cache service not available - running without cache');
  }).then(connected => {
    if (connected) {
      console.log('✅ Redis cache service connected');
    } else {
      console.log('⚠️ Running without Redis caching');
    }
  });
})
.catch(err => {
  console.log('⚠️ MongoDB not available, running in demo mode');
  console.log('💡 To enable full features: Start MongoDB or update MONGODB_URI in .env');
});

// Routes
app.use('/api/articles', articleRoutes);
app.use('/api/feeds', feedRoutes);
app.use('/api/news-ingestion', newsIngestionRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const cacheHealth = await cacheService.healthCheck();
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    scheduler: scheduler.getStatus(),
    websocket: wsService ? { connectedClients: wsService.getConnectedClientsCount() } : { connectedClients: 0 },
    cache: cacheHealth
  });
});

// WebSocket stats endpoint
app.get('/api/websocket/stats', (req, res) => {
  res.json({
    websocket: wsService ? { connectedClients: wsService.getConnectedClientsCount() } : { connectedClients: 0 },
    timestamp: new Date().toISOString()
  });
});

// Cache management endpoints
app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = await cacheService.getCacheStats();
    res.json({
      cache: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/cache/invalidate', async (req, res) => {
  try {
    const { pattern } = req.body;
    
    if (pattern === 'all') {
      await cacheService.invalidateAllCache();
    } else if (pattern === 'industry') {
      const { industry } = req.body;
      await cacheService.invalidateIndustryCache(industry);
    }
    
    res.json({
      message: `Cache invalidated for pattern: ${pattern}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Note: RSS scraping is now handled by the scheduler service
// which runs every 30 minutes with better error handling

// Manual trigger endpoints for testing
app.post('/api/admin/scrape-feeds', async (req, res) => {
  try {
    await rssScraper.processAllFeeds();
    res.json({ message: 'RSS scraping completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/process-articles', async (req, res) => {
  try {
    await aiProcessor.processUnprocessedArticles();
    res.json({ message: 'AI processing completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Production error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Production Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({ 
      success: false,
      message: err.message,
      stack: err.stack 
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log('🛑 Graceful shutdown initiated');
  try {
    await mongoose.connection.close();
    console.log('📦 MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Create HTTP server for WebSocket support
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:1001',
      'http://localhost:1000'
    ],
    methods: ['GET', 'POST']
  }
});

// Initialize WebSocket service
const wsService = new websocketService(io);

// Initialize news ingestion scheduler
setTimeout(() => {
  try {
    newsIngestionScheduler.start();
    console.log('📅 News ingestion scheduler started');
  } catch (error) {
    console.error('❌ Failed to start news ingestion scheduler:', error);
  }
}, 5000); // Wait 5 seconds for database connection

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 WebSocket support enabled`);
});

module.exports = { app, wsService };
