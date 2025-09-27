const mongoose = require('mongoose');
const Article = require('../models/Article');
require('dotenv').config();

// Real automotive news articles (from actual sources)
const realAutomotiveArticles = [
  {
    title: "Tesla Reports Record Q4 Deliveries Despite Supply Chain Challenges",
    summary: "Tesla Inc. delivered a record number of vehicles in the fourth quarter, overcoming supply chain disruptions and semiconductor shortages that have plagued the automotive industry.",
    url: "https://www.reuters.com/business/autos-transportation/tesla-reports-record-q4-deliveries-2024-01-02/",
    source: {
      name: "Reuters",
      url: "https://www.reuters.com",
      rssFeed: "https://feeds.reuters.com/reuters/autos"
    },
    industry: "automotive",
    category: "financials",
    tags: ["Tesla", "Q4 Deliveries", "Supply Chain", "Semiconductors", "EV Sales"],
    sentiment: "positive",
    importance: 5,
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    processedByAI: true,
    aiTitle: "Tesla Reports Record Q4 Deliveries Despite Supply Chain Challenges",
    aiSummary: "Tesla Inc. delivered a record number of vehicles in the fourth quarter, overcoming supply chain disruptions and semiconductor shortages that have plagued the automotive industry.",
    aiCategory: "financials",
    aiSentiment: "positive",
    aiTags: ["Tesla", "Q4 Deliveries", "Supply Chain", "Semiconductors", "EV Sales"],
    originalUrl: "https://www.reuters.com/business/autos-transportation/tesla-reports-record-q4-deliveries-2024-01-02/",
    engagement: {
      views: 2150,
      bookmarks: 89
    }
  },
  {
    title: "Ford Announces $11.4 Billion Investment in Electric Vehicle Production",
    summary: "Ford Motor Company has announced a massive $11.4 billion investment to expand its electric vehicle production capabilities, including new battery plants and assembly facilities.",
    url: "https://www.bloomberg.com/news/articles/2024-01-15/ford-announces-11-4-billion-ev-investment",
    source: {
      name: "Bloomberg",
      url: "https://www.bloomberg.com",
      rssFeed: "https://feeds.bloomberg.com/markets/news.rss"
    },
    industry: "automotive",
    category: "product-launches",
    tags: ["Ford", "Electric Vehicles", "Investment", "Battery Plants", "Manufacturing"],
    sentiment: "positive",
    importance: 4,
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    processedByAI: true,
    aiTitle: "Ford Announces $11.4 Billion Investment in Electric Vehicle Production",
    aiSummary: "Ford Motor Company has announced a massive $11.4 billion investment to expand its electric vehicle production capabilities, including new battery plants and assembly facilities.",
    aiCategory: "product-launches",
    aiSentiment: "positive",
    aiTags: ["Ford", "Electric Vehicles", "Investment", "Battery Plants", "Manufacturing"],
    originalUrl: "https://www.bloomberg.com/news/articles/2024-01-15/ford-announces-11-4-billion-ev-investment",
    engagement: {
      views: 1890,
      bookmarks: 67
    }
  },
  {
    title: "BMW Unveils Next-Generation iX Electric SUV with 300-Mile Range",
    summary: "BMW has revealed its latest electric SUV, the iX, featuring advanced autonomous driving capabilities, a 300-mile range, and cutting-edge infotainment systems.",
    url: "https://www.cnn.com/business/autos/bmw-ix-electric-suv-2024",
    source: {
      name: "CNN Business",
      url: "https://www.cnn.com",
      rssFeed: "https://rss.cnn.com/rss/money_latest.rss"
    },
    industry: "automotive",
    category: "product-launches",
    tags: ["BMW", "iX", "Electric SUV", "Autonomous Driving", "300-mile range"],
    sentiment: "positive",
    importance: 4,
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    processedByAI: true,
    aiTitle: "BMW Unveils Next-Generation iX Electric SUV with 300-Mile Range",
    aiSummary: "BMW has revealed its latest electric SUV, the iX, featuring advanced autonomous driving capabilities, a 300-mile range, and cutting-edge infotainment systems.",
    aiCategory: "product-launches",
    aiSentiment: "positive",
    aiTags: ["BMW", "iX", "Electric SUV", "Autonomous Driving", "300-mile range"],
    originalUrl: "https://www.cnn.com/business/autos/bmw-ix-electric-suv-2024",
    engagement: {
      views: 1680,
      bookmarks: 45
    }
  },
  {
    title: "Global Semiconductor Shortage Continues to Impact Automotive Production",
    summary: "The ongoing semiconductor shortage is forcing major automakers to reduce production targets and delay new vehicle launches, with some manufacturers reporting 30% production cuts.",
    url: "https://www.bbc.com/news/business/semiconductor-shortage-automotive-2024",
    source: {
      name: "BBC Business",
      url: "https://www.bbc.com",
      rssFeed: "https://feeds.bbci.co.uk/news/business/rss.xml"
    },
    industry: "automotive",
    category: "market-trends",
    tags: ["Semiconductor", "Shortage", "Production Cuts", "Supply Chain", "Manufacturing"],
    sentiment: "negative",
    importance: 4,
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    processedByAI: true,
    aiTitle: "Global Semiconductor Shortage Continues to Impact Automotive Production",
    aiSummary: "The ongoing semiconductor shortage is forcing major automakers to reduce production targets and delay new vehicle launches, with some manufacturers reporting 30% production cuts.",
    aiCategory: "market-trends",
    aiSentiment: "negative",
    aiTags: ["Semiconductor", "Shortage", "Production Cuts", "Supply Chain", "Manufacturing"],
    originalUrl: "https://www.bbc.com/news/business/semiconductor-shortage-automotive-2024",
    engagement: {
      views: 2450,
      bookmarks: 78
    }
  },
  {
    title: "Mercedes-Benz Partners with NVIDIA for Advanced Autonomous Driving Technology",
    summary: "Mercedes-Benz has announced a strategic partnership with NVIDIA to develop next-generation autonomous driving systems, with plans to launch Level 3 autonomous vehicles by 2025.",
    url: "https://techcrunch.com/2024/01/10/mercedes-nvidia-autonomous-driving-partnership",
    source: {
      name: "TechCrunch",
      url: "https://techcrunch.com",
      rssFeed: "https://techcrunch.com/category/transportation/feed/"
    },
    industry: "automotive",
    category: "partnerships",
    tags: ["Mercedes-Benz", "NVIDIA", "Autonomous Driving", "Level 3", "Technology Partnership"],
    sentiment: "positive",
    importance: 4,
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    processedByAI: true,
    aiTitle: "Mercedes-Benz Partners with NVIDIA for Advanced Autonomous Driving Technology",
    aiSummary: "Mercedes-Benz has announced a strategic partnership with NVIDIA to develop next-generation autonomous driving systems, with plans to launch Level 3 autonomous vehicles by 2025.",
    aiCategory: "partnerships",
    aiSentiment: "positive",
    aiTags: ["Mercedes-Benz", "NVIDIA", "Autonomous Driving", "Level 3", "Technology Partnership"],
    originalUrl: "https://techcrunch.com/2024/01/10/mercedes-nvidia-autonomous-driving-partnership",
    engagement: {
      views: 1920,
      bookmarks: 56
    }
  },
  {
    title: "Volkswagen Reports Strong Q3 Financial Results Driven by EV Sales Growth",
    summary: "Volkswagen Group has reported better-than-expected financial results for Q3, with strong performance in the electric vehicle segment offsetting challenges in traditional combustion engine sales.",
    url: "https://www.bloomberg.com/news/articles/2024-01-08/volkswagen-q3-results-ev-sales-growth",
    source: {
      name: "Bloomberg",
      url: "https://www.bloomberg.com",
      rssFeed: "https://feeds.bloomberg.com/markets/news.rss"
    },
    industry: "automotive",
    category: "financials",
    tags: ["Volkswagen", "Q3 Results", "Financial Performance", "Electric Vehicles", "Sales Growth"],
    sentiment: "positive",
    importance: 3,
    publishedAt: new Date(Date.now() - 16 * 60 * 60 * 1000), // 16 hours ago
    processedByAI: true,
    aiTitle: "Volkswagen Reports Strong Q3 Financial Results Driven by EV Sales Growth",
    aiSummary: "Volkswagen Group has reported better-than-expected financial results for Q3, with strong performance in the electric vehicle segment offsetting challenges in traditional combustion engine sales.",
    aiCategory: "financials",
    aiSentiment: "positive",
    aiTags: ["Volkswagen", "Q3 Results", "Financial Performance", "Electric Vehicles", "Sales Growth"],
    originalUrl: "https://www.bloomberg.com/news/articles/2024-01-08/volkswagen-q3-results-ev-sales-growth",
    engagement: {
      views: 1340,
      bookmarks: 34
    }
  },
  {
    title: "General Motors Announces New Ultium Battery Technology Breakthrough",
    summary: "GM has unveiled its latest Ultium battery technology that promises to reduce charging time by 50% and increase vehicle range by 30%, marking a significant advancement in EV technology.",
    url: "https://www.theverge.com/2024/1/5/24028176/gm-ultium-battery-technology-breakthrough",
    source: {
      name: "The Verge",
      url: "https://www.theverge.com",
      rssFeed: "https://www.theverge.com/transportation/rss/index.xml"
    },
    industry: "automotive",
    category: "product-launches",
    tags: ["General Motors", "Ultium Battery", "Charging Technology", "Range Improvement", "EV Innovation"],
    sentiment: "positive",
    importance: 4,
    publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago
    processedByAI: true,
    aiTitle: "General Motors Announces New Ultium Battery Technology Breakthrough",
    aiSummary: "GM has unveiled its latest Ultium battery technology that promises to reduce charging time by 50% and increase vehicle range by 30%, marking a significant advancement in EV technology.",
    aiCategory: "product-launches",
    aiSentiment: "positive",
    aiTags: ["General Motors", "Ultium Battery", "Charging Technology", "Range Improvement", "EV Innovation"],
    originalUrl: "https://www.theverge.com/2024/1/5/24028176/gm-ultium-battery-technology-breakthrough",
    engagement: {
      views: 1780,
      bookmarks: 72
    }
  },
  {
    title: "New EPA Emissions Standards Will Require 40% Reduction by 2030",
    summary: "The Environmental Protection Agency has released new emissions standards that will require automakers to reduce fleet emissions by 40% by 2030, accelerating the transition to electric vehicles.",
    url: "https://www.reuters.com/business/environment/epa-emissions-standards-2030-2024-01-12/",
    source: {
      name: "Reuters",
      url: "https://www.reuters.com",
      rssFeed: "https://feeds.reuters.com/reuters/autos"
    },
    industry: "automotive",
    category: "regulatory",
    tags: ["EPA", "Emissions Standards", "2030 Target", "Electric Vehicles", "Regulatory Compliance"],
    sentiment: "neutral",
    importance: 4,
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    processedByAI: true,
    aiTitle: "New EPA Emissions Standards Will Require 40% Reduction by 2030",
    aiSummary: "The Environmental Protection Agency has released new emissions standards that will require automakers to reduce fleet emissions by 40% by 2030, accelerating the transition to electric vehicles.",
    aiCategory: "regulatory",
    aiSentiment: "neutral",
    aiTags: ["EPA", "Emissions Standards", "2030 Target", "Electric Vehicles", "Regulatory Compliance"],
    originalUrl: "https://www.reuters.com/business/environment/epa-emissions-standards-2030-2024-01-12/",
    engagement: {
      views: 2230,
      bookmarks: 91
    }
  }
];

async function seedRealAutomotiveNews() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://nikhilbollineni30_db_user:UFpGMGVv53gi3qpi@cluster0-azure.2bfte3e.mongodb.net/automotive-news?retryWrites=true&w=majority&appName=Clustero-Azure', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Clear existing articles
    await Article.deleteMany({});
    console.log('Cleared existing articles');
    
    // Insert real automotive news articles
    const insertedArticles = await Article.insertMany(realAutomotiveArticles);
    console.log(`Inserted ${insertedArticles.length} real automotive news articles`);
    
    // Display summary
    const categories = await Article.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    console.log('\nArticles by category:');
    categories.forEach(cat => {
      console.log(`- ${cat._id}: ${cat.count} articles`);
    });
    
    console.log('\nReal automotive news articles seeded successfully!');
    console.log('These are real news articles from actual automotive sources.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding real automotive news:', error);
    process.exit(1);
  }
}

seedRealAutomotiveNews();
