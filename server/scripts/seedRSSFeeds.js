const mongoose = require('mongoose');
const RSSFeed = require('../models/RSSFeed');
require('dotenv').config();

// Working automotive RSS feeds (verified)
const automotiveFeeds = [
  {
    name: 'Reuters Automotive',
    url: 'https://feeds.reuters.com/reuters/autos',
    website: 'https://www.reuters.com/business/autos-transportation/',
    industry: 'automotive',
    isActive: true,
    scrapeFrequency: 'hourly'
  },
  {
    name: 'BBC Business - Cars',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    website: 'https://www.bbc.com/news/business',
    industry: 'automotive',
    isActive: true,
    scrapeFrequency: 'hourly'
  },
  {
    name: 'CNN Business - Automotive',
    url: 'https://rss.cnn.com/rss/money_latest.rss',
    website: 'https://www.cnn.com/business/autos',
    industry: 'automotive',
    isActive: true,
    scrapeFrequency: 'hourly'
  },
  {
    name: 'Bloomberg Automotive',
    url: 'https://feeds.bloomberg.com/markets/news.rss',
    website: 'https://www.bloomberg.com/industries/automotive',
    industry: 'automotive',
    isActive: true,
    scrapeFrequency: 'hourly'
  },
  {
    name: 'TechCrunch - Transportation',
    url: 'https://techcrunch.com/category/transportation/feed/',
    website: 'https://techcrunch.com/category/transportation/',
    industry: 'automotive',
    isActive: true,
    scrapeFrequency: 'hourly'
  },
  {
    name: 'The Verge - Transportation',
    url: 'https://www.theverge.com/transportation/rss/index.xml',
    website: 'https://www.theverge.com/transportation',
    industry: 'automotive',
    isActive: true,
    scrapeFrequency: 'hourly'
  },
  {
    name: 'Engadget - Transportation',
    url: 'https://www.engadget.com/rss.xml',
    website: 'https://www.engadget.com/transportation/',
    industry: 'automotive',
    isActive: true,
    scrapeFrequency: 'hourly'
  },
  {
    name: 'Ars Technica - Cars',
    url: 'https://feeds.arstechnica.com/arstechnica/index/',
    website: 'https://arstechnica.com/cars/',
    industry: 'automotive',
    isActive: true,
    scrapeFrequency: 'hourly'
  },
  {
    name: 'Wired - Transportation',
    url: 'https://www.wired.com/feed/rss',
    website: 'https://www.wired.com/category/transportation/',
    industry: 'automotive',
    isActive: true,
    scrapeFrequency: 'hourly'
  },
  {
    name: 'Mashable - Transportation',
    url: 'https://mashable.com/feeds/rss/all',
    website: 'https://mashable.com/transportation/',
    industry: 'automotive',
    isActive: true,
    scrapeFrequency: 'hourly'
  }
];

async function seedRSSFeeds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://nikhilbollineni30_db_user:UFpGMGVv53gi3qpi@cluster0-azure.2bfte3e.mongodb.net/automotive-news?retryWrites=true&w=majority&appName=Clustero-Azure', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Clear existing RSS feeds
    await RSSFeed.deleteMany({});
    console.log('Cleared existing RSS feeds');
    
    // Insert RSS feeds
    const insertedFeeds = await RSSFeed.insertMany(automotiveFeeds);
    console.log(`Inserted ${insertedFeeds.length} RSS feeds`);
    
    // Display summary
    console.log('\nRSS Feeds by industry:');
    const feedsByIndustry = await RSSFeed.aggregate([
      { $group: { _id: '$industry', count: { $sum: 1 } } }
    ]);
    
    feedsByIndustry.forEach(feed => {
      console.log(`- ${feed._id}: ${feed.count} feeds`);
    });
    
    console.log('\nRSS feeds seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding RSS feeds:', error);
    process.exit(1);
  }
}

seedRSSFeeds();