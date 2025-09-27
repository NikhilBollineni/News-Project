const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/database');
const AutomotivePublisher = require('../models/AutomotivePublisher');
const SystemStats = require('../models/SystemStats');
const { getActiveFeeds } = require('../data/globalAutomotiveFeeds');

// Database initialization script
const initializeDatabase = async () => {
  try {
    console.log('🚀 Initializing Automotive News Database...');
    
    // Connect to MongoDB Atlas
    await connectDB();
    
    // Initialize publishers from global feeds
    console.log('📝 Initializing publishers...');
    const feeds = getActiveFeeds();
    
    for (const feed of feeds) {
      try {
        const existingPublisher = await AutomotivePublisher.findOne({ name: feed.name });
        
        if (!existingPublisher) {
          const publisher = new AutomotivePublisher({
            name: feed.name,
            website: feed.website,
            rssFeed: feed.rssFeed,
            region: feed.region,
            language: feed.language,
            credibility: feed.credibility,
            automotiveFocus: feed.automotiveFocus,
            specialties: feed.specialties,
            isActive: feed.isActive
          });
          
          await publisher.save();
          console.log(`✅ Created publisher: ${feed.name}`);
        } else {
          console.log(`📄 Publisher already exists: ${feed.name}`);
        }
      } catch (error) {
        console.error(`❌ Error creating publisher ${feed.name}:`, error.message);
      }
    }
    
    // Initialize system stats for today
    console.log('📊 Initializing system stats...');
    let todayStats = await SystemStats.getDailyStats(new Date());
    
    if (!todayStats) {
      todayStats = new SystemStats({
        date: new Date(),
        feeds: {
          total: feeds.length,
          active: feeds.filter(f => f.isActive).length,
          failed: 0,
          successRate: 0
        },
        articles: {
          total: 0,
          processed: 0,
          failed: 0,
          pending: 0
        }
      });
      
      await todayStats.save();
      console.log('✅ Initialized system stats for today');
    } else {
      console.log('📄 System stats already exist for today');
    }
    
    // Create indexes (Mongoose will handle this automatically, but we can verify)
    console.log('🔍 Verifying database indexes...');
    
    // Test a simple query to ensure indexes are working
    const publisherCount = await AutomotivePublisher.countDocuments();
    const statsCount = await SystemStats.countDocuments();
    
    console.log(`📊 Database initialized successfully!`);
    console.log(`   Publishers: ${publisherCount}`);
    console.log(`   System Stats: ${statsCount}`);
    console.log(`   Active Feeds: ${feeds.filter(f => f.isActive).length}`);
    
    console.log('✅ Database initialization completed!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Database initialization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
