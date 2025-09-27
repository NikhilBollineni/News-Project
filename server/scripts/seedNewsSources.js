const mongoose = require('mongoose');
const NewsSource = require('../models/NewsSource');
require('dotenv').config();

// Automotive news sources
const newsSources = [
  {
    sourceId: 'reuters_autos',
    name: 'Reuters - Autos',
    type: 'RSS',
    url: 'https://feeds.reuters.com/reuters/autos',
    country: 'US',
    language: 'en',
    tags: ['automotive', 'business', 'news'],
    isActive: true,
    priority: 1,
    refreshInterval: 1800,
    description: 'Reuters automotive business news'
  },
  {
    sourceId: 'motor1',
    name: 'Motor1',
    type: 'RSS',
    url: 'https://www.motor1.com/rss/',
    country: 'US',
    language: 'en',
    tags: ['automotive', 'reviews', 'news'],
    isActive: true,
    priority: 2,
    refreshInterval: 1800,
    description: 'Motor1 automotive news and reviews'
  },
  {
    sourceId: 'insideevs',
    name: 'InsideEVs',
    type: 'RSS',
    url: 'https://insideevs.com/feed/',
    country: 'US',
    language: 'en',
    tags: ['automotive', 'electric', 'ev'],
    isActive: true,
    priority: 2,
    refreshInterval: 1800,
    description: 'InsideEVs electric vehicle news and reviews'
  },
  {
    sourceId: 'teslarati',
    name: 'Teslarati',
    type: 'RSS',
    url: 'https://www.teslarati.com/feed/',
    country: 'US',
    language: 'en',
    tags: ['automotive', 'tesla', 'electric'],
    isActive: true,
    priority: 3,
    refreshInterval: 1800,
    description: 'Teslarati Tesla and EV news'
  },
  {
    sourceId: 'electrek',
    name: 'Electrek',
    type: 'RSS',
    url: 'https://electrek.co/feed/',
    country: 'US',
    language: 'en',
    tags: ['automotive', 'electric', 'clean_energy'],
    isActive: true,
    priority: 3,
    refreshInterval: 1800,
    description: 'Electrek clean energy and EV news'
  },
  {
    sourceId: 'google_news_automotive',
    name: 'Google News - Automotive',
    type: 'RSS_SEARCH',
    url: 'https://news.google.com/rss/search?q=automotive&hl=en-US&gl=US&ceid=US:en',
    country: 'US',
    language: 'en',
    tags: ['automotive', 'news', 'google'],
    isActive: true,
    priority: 1,
    refreshInterval: 900,
    description: 'Google News RSS search for automotive industry news'
  }
];

async function seedNewsSources() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/automotive-news');
    console.log('Connected to MongoDB');

    // Clear existing sources
    await NewsSource.deleteMany({});
    console.log('Cleared existing news sources');

    // Insert new sources
    const insertedSources = await NewsSource.insertMany(newsSources);
    console.log(`Inserted ${insertedSources.length} news sources`);

    // Display sources by industry
    const sourcesByIndustry = await NewsSource.aggregate([
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\nNews Sources by tags:');
    sourcesByIndustry.forEach(group => {
      console.log(`- ${group._id.join(', ')}: ${group.count} sources`);
    });

    console.log('\nNews sources seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding news sources:', error);
    process.exit(1);
  }
}

seedNewsSources();
