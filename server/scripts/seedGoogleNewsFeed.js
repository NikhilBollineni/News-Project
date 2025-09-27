const mongoose = require('mongoose');
const RSSFeed = require('../models/RSSFeed');
const { connectDB } = require('../config/database');
require('dotenv').config();

async function seedGoogleNewsFeed() {
  try {
    console.log('🌱 Seeding Google News RSS feed...');
    
    // Connect to database
    await connectDB();
    
    // Check if Google News feed already exists
    const existingFeed = await RSSFeed.findOne({ 
      url: 'https://news.google.com/rss/search?hl=en-US&gl=US&ceid=US:en&q=automotive' 
    });
    
    if (existingFeed) {
      console.log('✅ Google News feed already exists');
      return;
    }
    
    // Create Google News RSS feed
    const googleNewsFeed = new RSSFeed({
      name: 'Google News - Automotive',
      url: 'https://news.google.com/rss/search?hl=en-US&gl=US&ceid=US:en&q=automotive',
      website: 'https://news.google.com',
      industry: 'automotive',
      isActive: true,
      scrapeFrequency: 'every-15-min',
      successRate: 100,
      metadata: {
        description: 'Google News RSS feed for automotive industry news',
        language: 'en',
        category: 'automotive'
      }
    });
    
    await googleNewsFeed.save();
    
    console.log('✅ Google News RSS feed seeded successfully');
    console.log(`📡 Feed ID: ${googleNewsFeed._id}`);
    console.log(`🔗 URL: ${googleNewsFeed.url}`);
    console.log(`🏭 Industry: ${googleNewsFeed.industry}`);
    console.log(`⏰ Scrape Frequency: ${googleNewsFeed.scrapeFrequency}`);
    
  } catch (error) {
    console.error('❌ Error seeding Google News feed:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await seedGoogleNewsFeed();
    console.log('🎉 Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedGoogleNewsFeed };
