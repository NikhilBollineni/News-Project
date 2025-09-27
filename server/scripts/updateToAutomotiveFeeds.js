/**
 * 🚗 UPDATE TO AUTOMOTIVE-SPECIFIC FEEDS
 * Replace general news sources with automotive-focused feeds
 */

const mongoose = require('mongoose');
const RSSFeed = require('../models/RSSFeed');
require('dotenv').config();

// Automotive-specific feeds
const automotiveFeeds = [
  {
    name: "Tesla News",
    url: "https://www.teslarati.com/feed/",
    website: "https://www.teslarati.com",
    industry: "automotive",
    scrapeFrequency: "hourly",
    isActive: true,
    description: "Tesla and electric vehicle news"
  },
  {
    name: "InsideEVs",
    url: "https://insideevs.com/feed/",
    website: "https://insideevs.com",
    industry: "automotive",
    scrapeFrequency: "hourly",
    isActive: true,
    description: "Electric vehicle news and reviews"
  },
  {
    name: "Electrek",
    url: "https://electrek.co/feed/",
    website: "https://electrek.co",
    industry: "automotive",
    scrapeFrequency: "hourly",
    isActive: true,
    description: "Clean energy and EV news"
  },
  {
    name: "Motor1",
    url: "https://www.motor1.com/rss/",
    website: "https://www.motor1.com",
    industry: "automotive",
    scrapeFrequency: "hourly",
    isActive: true,
    description: "Automotive news and reviews"
  },
  {
    name: "Car and Driver",
    url: "https://www.caranddriver.com/rss/all.xml/",
    website: "https://www.caranddriver.com",
    industry: "automotive",
    scrapeFrequency: "hourly",
    isActive: true,
    description: "Automotive news and reviews"
  },
  {
    name: "Autoblog",
    url: "https://www.autoblog.com/rss.xml",
    website: "https://www.autoblog.com",
    industry: "automotive",
    scrapeFrequency: "hourly",
    isActive: true,
    description: "Automotive news and reviews"
  },
  {
    name: "Automotive News",
    url: "https://www.autonews.com/rss.xml",
    website: "https://www.autonews.com",
    industry: "automotive",
    scrapeFrequency: "hourly",
    isActive: true,
    description: "Automotive industry news"
  },
  {
    name: "Reuters Automotive",
    url: "https://feeds.reuters.com/reuters/autos",
    website: "https://www.reuters.com/business/autos-transportation/",
    industry: "automotive",
    scrapeFrequency: "hourly",
    isActive: true,
    description: "Automotive business news"
  },
  {
    name: "TechCrunch Transportation",
    url: "https://techcrunch.com/category/transportation/feed/",
    website: "https://techcrunch.com/category/transportation/",
    industry: "automotive",
    scrapeFrequency: "hourly",
    isActive: true,
    description: "Transportation technology news"
  },
  {
    name: "The Verge Transportation",
    url: "https://www.theverge.com/transportation/rss/index.xml",
    website: "https://www.theverge.com/transportation",
    industry: "automotive",
    scrapeFrequency: "hourly",
    isActive: true,
    description: "Transportation technology news"
  }
];

async function updateFeeds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/news_app');
    console.log('✅ Connected to MongoDB');

    // Clear existing feeds
    console.log('🗑️ Clearing existing feeds...');
    await RSSFeed.deleteMany({ industry: 'automotive' });
    console.log('✅ Existing automotive feeds cleared');

    // Add new automotive feeds
    console.log('🚗 Adding automotive-specific feeds...');
    for (const feedData of automotiveFeeds) {
      const feed = new RSSFeed(feedData);
      await feed.save();
      console.log(`✅ Added: ${feedData.name}`);
    }

    console.log('\n🎉 Successfully updated to automotive-specific feeds!');
    console.log('📊 New feeds:');
    automotiveFeeds.forEach(feed => {
      console.log(`  - ${feed.name}: ${feed.url}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating feeds:', error);
    process.exit(1);
  }
}

updateFeeds();
