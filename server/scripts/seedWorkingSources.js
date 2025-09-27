const mongoose = require('mongoose');
const NewsSource = require('../models/NewsSource');
require('dotenv').config();

// Working automotive news sources with verified URLs
const workingSources = [
  {
    sourceId: 'bbc_automotive',
    name: 'BBC - Automotive',
    type: 'RSS',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    country: 'US',
    language: 'en',
    tags: ['automotive', 'business', 'news'],
    isActive: true,
    priority: 1,
    refreshInterval: 1800,
    description: 'BBC business news including automotive'
  },
  {
    sourceId: 'cnn_automotive',
    name: 'CNN - Automotive',
    type: 'RSS',
    url: 'https://rss.cnn.com/rss/money_latest.rss',
    country: 'US',
    language: 'en',
    tags: ['automotive', 'business', 'news'],
    isActive: true,
    priority: 1,
    refreshInterval: 1800,
    description: 'CNN business news including automotive'
  },
  {
    sourceId: 'techcrunch_transportation',
    name: 'TechCrunch - Transportation',
    type: 'RSS',
    url: 'https://techcrunch.com/category/transportation/feed/',
    country: 'US',
    language: 'en',
    tags: ['automotive', 'transportation', 'tech'],
    isActive: true,
    priority: 2,
    refreshInterval: 1800,
    description: 'TechCrunch transportation and automotive tech news'
  },
  {
    sourceId: 'theverge_transportation',
    name: 'The Verge - Transportation',
    type: 'RSS',
    url: 'https://www.theverge.com/transportation/rss/index.xml',
    country: 'US',
    language: 'en',
    tags: ['automotive', 'transportation', 'tech'],
    isActive: true,
    priority: 2,
    refreshInterval: 1800,
    description: 'The Verge transportation and automotive tech news'
  },
  {
    sourceId: 'engadget_transportation',
    name: 'Engadget - Transportation',
    type: 'RSS',
    url: 'https://www.engadget.com/rss.xml',
    country: 'US',
    language: 'en',
    tags: ['automotive', 'transportation', 'tech'],
    isActive: true,
    priority: 3,
    refreshInterval: 1800,
    description: 'Engadget transportation and automotive tech news'
  }
];

async function seedWorkingSources() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/automotive-news');
    console.log('Connected to MongoDB');

    // Clear existing sources
    await NewsSource.deleteMany({});
    console.log('Cleared existing news sources');

    // Insert new sources
    const insertedSources = await NewsSource.insertMany(workingSources);
    console.log(`Inserted ${insertedSources.length} working news sources`);

    // Display sources
    console.log('\nWorking News Sources:');
    insertedSources.forEach(source => {
      console.log(`- ${source.name}: ${source.url}`);
    });

    console.log('\nWorking news sources seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding working news sources:', error);
    process.exit(1);
  }
}

seedWorkingSources();
