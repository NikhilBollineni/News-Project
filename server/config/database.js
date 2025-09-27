const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Atlas connection configuration
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('⚠️ MONGODB_URI not configured');
  console.warn('📋 To set up MongoDB:');
  console.warn('   1. Install MongoDB: brew install mongodb-community');
  console.warn('   2. Start MongoDB: brew services start mongodb-community');
  console.warn('   3. Or use Docker: docker run -d -p 27017:27017 mongo:latest');
  console.warn('   4. Update .env with: MONGODB_URI=mongodb://localhost:27017/automotive-news');
  // Don't throw error, allow app to start
}

// Connection options optimized for performance and reliability
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000, // 45 seconds
  maxPoolSize: 10, // Maximum number of connections in the connection pool
  minPoolSize: 2, // Minimum number of connections in the connection pool
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  retryWrites: true,
  w: 'majority', // Write concern
  readPreference: 'primary', // Read from primary replica
  bufferCommands: false, // Disable mongoose buffering
};

let isConnected = false;
let connection = null;

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is configured
    if (!MONGODB_URI) {
      console.log('⚠️ MONGODB_URI not configured, skipping database connection');
      return null;
    }

    // Prevent multiple connections
    if (isConnected && mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB Atlas already connected');
      return mongoose.connection;
    }

    console.log('🔗 Connecting to MongoDB Atlas...');
    console.log(`📡 URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs
    
    connection = await mongoose.connect(MONGODB_URI, connectionOptions);

    isConnected = true;
    
    console.log(`✅ MongoDB Atlas Connected: ${connection.connection.host}`);
    console.log(`📊 Database: ${connection.connection.name}`);
    console.log(`🔧 Connection State: ${connection.connection.readyState}`);
    console.log(`⚡ Connection Pool: Max ${connectionOptions.maxPoolSize}, Min ${connectionOptions.minPoolSize}`);
    
    return connection;
  } catch (error) {
    console.error(`❌ MongoDB Atlas connection error: ${error.message}`);
    isConnected = false;
    
    // Log specific error types for debugging
    if (error.name === 'MongoServerSelectionError') {
      console.error('🔍 Server selection failed - check network connectivity and MongoDB Atlas cluster status');
    } else if (error.name === 'MongoParseError') {
      console.error('🔍 Connection string parse error - check MONGODB_URI format');
    } else if (error.name === 'MongoAuthenticationError') {
      console.error('🔍 Authentication failed - check username/password in connection string');
    }
    
    // Fallback to in-memory storage if Atlas fails
    console.log('🔄 Falling back to in-memory storage...');
    return null;
  }
};

// Graceful shutdown
const disconnectDB = async () => {
  try {
    if (connection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('🟡 MongoDB Atlas disconnected gracefully');
    }
    isConnected = false;
    connection = null;
  } catch (error) {
    console.error(`❌ Error disconnecting from MongoDB Atlas: ${error.message}`);
  }
};

const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    status: states[mongoose.connection.readyState] || 'unknown',
    host: mongoose.connection.host,
    name: mongoose.connection.name
  };
};

const healthCheck = async () => {
  try {
    // Check if mongoose is connected first
    if (mongoose.connection.readyState !== 1) {
      return { status: 'disconnected', message: 'Database not connected' };
    }

    // Simple ping to check database responsiveness
    await mongoose.connection.db.admin().ping();
    
    return {
      status: 'healthy',
      message: 'Database connection is healthy',
      ...getConnectionStatus()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Database health check failed: ${error.message}`,
      ...getConnectionStatus()
    };
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🟢 MongoDB Atlas connected');
  isConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 MongoDB Atlas connection error:', err);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 MongoDB Atlas disconnected');
  isConnected = false;
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = { 
  connectDB, 
  disconnectDB, 
  getConnectionStatus, 
  healthCheck,
  isConnected: () => isConnected
};
