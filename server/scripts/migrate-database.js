const mongoose = require('mongoose');
require('dotenv').config();

const NewsSource = require('../models/NewsSource');
const ProcessedArticle = require('../models/ProcessedArticle');
const IngestionLog = require('../models/IngestionLog');

/**
 * Database migration script for news ingestion pipeline
 */
async function migrateDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/news-ingestion');
    console.log('Connected to MongoDB');

    // Create indexes
    console.log('Creating indexes...');
    await createIndexes();
    
    // Seed initial sources from config
    console.log('Seeding initial sources...');
    await seedSources();
    
    console.log('Database migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

/**
 * Create database indexes for optimal performance
 */
async function createIndexes() {
  try {
    // NewsSource indexes
    await NewsSource.collection.createIndex({ isActive: 1, priority: 1 });
    await NewsSource.collection.createIndex({ lastFetched: 1 });
    await NewsSource.collection.createIndex({ type: 1, isActive: 1 });

    // ProcessedArticle indexes
    await ProcessedArticle.collection.createIndex({ industry: 1, category: 1, publishedAt: -1 });
    await ProcessedArticle.collection.createIndex({ confidence: 1, requiresReview: 1 });
    await ProcessedArticle.collection.createIndex({ gptStatus: 1, processedAt: 1 });
    await ProcessedArticle.collection.createIndex({ isDuplicate: 1, fetchedAt: -1 });
    await ProcessedArticle.collection.createIndex({ canonicalUrl: 1 }, { unique: true, sparse: true });
    await ProcessedArticle.collection.createIndex({ titleFingerprint: 1 }, { unique: true, sparse: true });
    await ProcessedArticle.collection.createIndex({ contentFingerprint: 1 }, { unique: true, sparse: true });

    // Text search index
    await ProcessedArticle.collection.createIndex({
      title: 'text',
      summary: 'text',
      cleanText: 'text'
    });

    // IngestionLog indexes
    await IngestionLog.collection.createIndex({ sourceId: 1, startedAt: -1 });
    await IngestionLog.collection.createIndex({ status: 1, startedAt: -1 });
    await IngestionLog.collection.createIndex({ runId: 1 });

    console.log('All indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error.message);
    throw error;
  }
}

/**
 * Seed initial news sources from config
 */
async function seedSources() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const configPath = path.join(__dirname, '../config/sources.json');
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    for (const sourceConfig of configData.sources) {
      const existingSource = await NewsSource.findOne({ sourceId: sourceConfig.id });
      
      if (!existingSource) {
        const newsSource = new NewsSource({
          sourceId: sourceConfig.id,
          name: sourceConfig.name,
          type: sourceConfig.type,
          url: sourceConfig.url,
          country: sourceConfig.country,
          language: sourceConfig.language,
          tags: sourceConfig.tags,
          isActive: sourceConfig.isActive,
          priority: sourceConfig.priority,
          refreshInterval: sourceConfig.refreshInterval,
          description: sourceConfig.description
        });
        
        await newsSource.save();
        console.log(`Created source: ${sourceConfig.name}`);
      } else {
        console.log(`Source already exists: ${sourceConfig.name}`);
      }
    }
    
    console.log('Sources seeding completed');
  } catch (error) {
    console.error('Error seeding sources:', error.message);
    throw error;
  }
}

/**
 * Clean up old data
 */
async function cleanupOldData() {
  try {
    console.log('Cleaning up old data...');
    
    // Remove duplicates older than 30 days
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const duplicateResult = await ProcessedArticle.deleteMany({
      isDuplicate: true,
      fetchedAt: { $lt: cutoffDate }
    });
    console.log(`Removed ${duplicateResult.deletedCount} old duplicate articles`);
    
    // Remove old ingestion logs (keep last 90 days)
    const logCutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const logResult = await IngestionLog.deleteMany({
      startedAt: { $lt: logCutoffDate }
    });
    console.log(`Removed ${logResult.deletedCount} old ingestion logs`);
    
    console.log('Cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error.message);
  }
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
  try {
    console.log('\n=== Database Statistics ===');
    
    const sourceCount = await NewsSource.countDocuments();
    const activeSourceCount = await NewsSource.countDocuments({ isActive: true });
    
    const articleCount = await ProcessedArticle.countDocuments();
    const processedCount = await ProcessedArticle.countDocuments({ gptStatus: 'processed' });
    const pendingCount = await ProcessedArticle.countDocuments({ gptStatus: 'pending' });
    const duplicateCount = await ProcessedArticle.countDocuments({ isDuplicate: true });
    
    const logCount = await IngestionLog.countDocuments();
    
    console.log(`News Sources: ${sourceCount} (${activeSourceCount} active)`);
    console.log(`Articles: ${articleCount} (${processedCount} processed, ${pendingCount} pending, ${duplicateCount} duplicates)`);
    console.log(`Ingestion Logs: ${logCount}`);
    
    // Industry breakdown
    const industryStats = await ProcessedArticle.aggregate([
      { $match: { gptStatus: 'processed' } },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\nIndustry Breakdown:');
    industryStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count}`);
    });
    
    // Category breakdown
    const categoryStats = await ProcessedArticle.aggregate([
      { $match: { gptStatus: 'processed' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\nCategory Breakdown:');
    categoryStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count}`);
    });
    
  } catch (error) {
    console.error('Error getting database stats:', error.message);
  }
}

// Run migration if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      migrateDatabase();
      break;
    case 'cleanup':
      mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/news-ingestion')
        .then(() => cleanupOldData())
        .then(() => mongoose.disconnect())
        .catch(console.error);
      break;
    case 'stats':
      mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/news-ingestion')
        .then(() => getDatabaseStats())
        .then(() => mongoose.disconnect())
        .catch(console.error);
      break;
    default:
      console.log('Usage: node migrate-database.js [migrate|cleanup|stats]');
      process.exit(1);
  }
}

module.exports = {
  migrateDatabase,
  createIndexes,
  seedSources,
  cleanupOldData,
  getDatabaseStats
};
