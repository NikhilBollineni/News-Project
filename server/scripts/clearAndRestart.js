/**
 * 🗑️ CLEAR ALL ARTICLES AND RESTART WITH GOOGLE NEWS ONLY
 * Clear existing articles and restart with only Google News automotive feed
 */

const mongoose = require('mongoose');
const Article = require('../models/Article');
const RSSFeed = require('../models/RSSFeed');
require('dotenv').config();

async function clearAndRestart() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/news_app');
    console.log('✅ Connected to MongoDB');

    // Clear all existing articles
    console.log('🗑️ Clearing all existing articles...');
    const deletedArticles = await Article.deleteMany({});
    console.log(`✅ Deleted ${deletedArticles.deletedCount} existing articles`);

    // Ensure only Google News automotive feed exists
    console.log('🔧 Ensuring only Google News automotive feed exists...');
    await RSSFeed.deleteMany({});
    
    const googleNewsFeed = new RSSFeed({
      name: "Google News - Automotive",
      url: "https://news.google.com/rss/search?hl=en-US&gl=US&ceid=US:en&q=automotive",
      website: "https://news.google.com",
      industry: "automotive",
      scrapeFrequency: "hourly",
      isActive: true,
      description: "Google News search for automotive industry news",
      priority: 1
    });
    
    await googleNewsFeed.save();
    console.log('✅ Google News automotive feed configured');

    console.log('\n🎉 System cleared and restarted with Google News automotive only!');
    console.log('📊 Configuration:');
    console.log('  - Single feed: Google News - Automotive');
    console.log('  - URL: https://news.google.com/rss/search?hl=en-US&gl=US&ceid=US:en&q=automotive');
    console.log('  - All old articles cleared');
    console.log('\n🔍 Next ingestion will collect only automotive news from Google News!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing and restarting:', error);
    process.exit(1);
  }
}

clearAndRestart();
