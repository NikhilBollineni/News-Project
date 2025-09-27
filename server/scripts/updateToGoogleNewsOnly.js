/**
 * 🚗 UPDATE TO GOOGLE NEWS AUTOMOTIVE ONLY
 * Use only the Google News automotive RSS feed for pure automotive news
 */

const mongoose = require('mongoose');
const RSSFeed = require('../models/RSSFeed');
require('dotenv').config();

// Single Google News automotive feed
const googleNewsAutomotiveFeed = {
  name: "Google News - Automotive",
  url: "https://news.google.com/rss/search?hl=en-US&gl=US&ceid=US:en&q=automotive",
  website: "https://news.google.com",
  industry: "automotive",
  scrapeFrequency: "hourly",
  isActive: true,
  description: "Google News search for automotive industry news",
  priority: 1
};

async function updateToGoogleNewsOnly() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/news_app');
    console.log('✅ Connected to MongoDB');

    // Clear ALL existing feeds
    console.log('🗑️ Clearing all existing feeds...');
    await RSSFeed.deleteMany({});
    console.log('✅ All existing feeds cleared');

    // Add only the Google News automotive feed
    console.log('🚗 Adding Google News automotive feed...');
    const feed = new RSSFeed(googleNewsAutomotiveFeed);
    await feed.save();
    console.log(`✅ Added: ${googleNewsAutomotiveFeed.name}`);

    console.log('\n🎉 Successfully updated to Google News automotive only!');
    console.log('📊 Single feed configured:');
    console.log(`  - ${googleNewsAutomotiveFeed.name}: ${googleNewsAutomotiveFeed.url}`);
    console.log('\n🔍 This will provide pure automotive news from Google News search results.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating feeds:', error);
    process.exit(1);
  }
}

updateToGoogleNewsOnly();
