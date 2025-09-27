const mongoose = require('mongoose');
const AutomotivePublisher = require('../models/AutomotivePublisher');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Automotive RSS feeds with detailed information
const automotiveFeeds = [
  {
    name: 'AutoNews',
    website: 'https://www.autonews.com',
    rssFeed: 'https://feeds.feedburner.com/autonews',
    logo: 'https://www.autonews.com/favicon.ico',
    description: 'Leading source for automotive industry news and analysis',
    automotiveFocus: 10,
    specialties: ['manufacturing', 'regulatory', 'financial', 'market-analysis'],
    credibility: 10,
    updateFrequency: 'hourly',
    contact: {
      email: 'info@autonews.com',
      mediaContact: 'media@autonews.com'
    },
    legal: {
      attribution: 'AutoNews',
      fairUsePolicy: 'Standard fair use with attribution'
    }
  },
  {
    name: 'Car and Driver',
    website: 'https://www.caranddriver.com',
    rssFeed: 'https://feeds.feedburner.com/caranddriver',
    logo: 'https://www.caranddriver.com/favicon.ico',
    description: 'Consumer and industry automotive news, reviews, and analysis',
    automotiveFocus: 9,
    specialties: ['product-reviews', 'luxury', 'performance', 'EV'],
    credibility: 9,
    updateFrequency: 'hourly',
    contact: {
      email: 'editor@caranddriver.com'
    },
    legal: {
      attribution: 'Car and Driver',
      fairUsePolicy: 'Standard fair use with attribution'
    }
  },
  {
    name: 'Tesla News',
    website: 'https://www.teslarati.com',
    rssFeed: 'https://www.teslarati.com/feed/',
    logo: 'https://www.teslarati.com/favicon.ico',
    description: 'Comprehensive Tesla and electric vehicle news coverage',
    automotiveFocus: 9,
    specialties: ['EV', 'Tesla', 'autonomous', 'luxury'],
    credibility: 8,
    updateFrequency: 'every-15-min',
    contact: {
      email: 'info@teslarati.com'
    },
    legal: {
      attribution: 'Teslarati',
      fairUsePolicy: 'Standard fair use with attribution'
    }
  },
  {
    name: 'Motor Trend',
    website: 'https://www.motortrend.com',
    rssFeed: 'https://feeds.feedburner.com/motortrend',
    logo: 'https://www.motortrend.com/favicon.ico',
    description: 'Automotive industry trends, reviews, and news',
    automotiveFocus: 8,
    specialties: ['product-reviews', 'performance', 'luxury', 'market-analysis'],
    credibility: 8,
    updateFrequency: 'hourly',
    contact: {
      email: 'editor@motortrend.com'
    },
    legal: {
      attribution: 'Motor Trend',
      fairUsePolicy: 'Standard fair use with attribution'
    }
  },
  {
    name: 'Green Car Reports',
    website: 'https://www.greencarreports.com',
    rssFeed: 'https://www.greencarreports.com/rss.xml',
    logo: 'https://www.greencarreports.com/favicon.ico',
    description: 'Electric and hybrid vehicle news and analysis',
    automotiveFocus: 9,
    specialties: ['EV', 'hybrid', 'plug-in-hybrid', 'regulatory'],
    credibility: 8,
    updateFrequency: 'hourly',
    contact: {
      email: 'info@greencarreports.com'
    },
    legal: {
      attribution: 'Green Car Reports',
      fairUsePolicy: 'Standard fair use with attribution'
    }
  },
  {
    name: 'InsideEVs',
    website: 'https://insideevs.com',
    rssFeed: 'https://insideevs.com/feed/',
    logo: 'https://insideevs.com/favicon.ico',
    description: 'Electric vehicle news, reviews, and industry analysis',
    automotiveFocus: 9,
    specialties: ['EV', 'Tesla', 'autonomous', 'market-analysis'],
    credibility: 8,
    updateFrequency: 'hourly',
    contact: {
      email: 'editor@insideevs.com'
    },
    legal: {
      attribution: 'InsideEVs',
      fairUsePolicy: 'Standard fair use with attribution'
    }
  },
  {
    name: 'CarBuzz',
    website: 'https://www.carbuzz.com',
    rssFeed: 'https://www.carbuzz.com/feed/',
    logo: 'https://www.carbuzz.com/favicon.ico',
    description: 'Automotive news, reviews, and industry insights',
    automotiveFocus: 7,
    specialties: ['product-reviews', 'luxury', 'performance', 'economy'],
    credibility: 7,
    updateFrequency: 'hourly',
    contact: {
      email: 'info@carbuzz.com'
    },
    legal: {
      attribution: 'CarBuzz',
      fairUsePolicy: 'Standard fair use with attribution'
    }
  },
  {
    name: 'Automotive World',
    website: 'https://www.automotiveworld.com',
    rssFeed: 'https://www.automotiveworld.com/feed/',
    logo: 'https://www.automotiveworld.com/favicon.ico',
    description: 'Global automotive industry news and analysis',
    automotiveFocus: 8,
    specialties: ['manufacturing', 'supply-chain', 'regulatory', 'global'],
    credibility: 8,
    updateFrequency: 'daily',
    contact: {
      email: 'info@automotiveworld.com'
    },
    legal: {
      attribution: 'Automotive World',
      fairUsePolicy: 'Standard fair use with attribution'
    }
  },
  {
    name: 'WardsAuto',
    website: 'https://www.wardsauto.com',
    rssFeed: 'https://www.wardsauto.com/rss.xml',
    logo: 'https://www.wardsauto.com/favicon.ico',
    description: 'Automotive industry analysis and market intelligence',
    automotiveFocus: 9,
    specialties: ['market-analysis', 'financial', 'manufacturing', 'regulatory'],
    credibility: 9,
    updateFrequency: 'daily',
    contact: {
      email: 'info@wardsauto.com'
    },
    legal: {
      attribution: 'WardsAuto',
      fairUsePolicy: 'Standard fair use with attribution'
    }
  },
  {
    name: 'Electrek',
    website: 'https://electrek.co',
    rssFeed: 'https://electrek.co/feed/',
    logo: 'https://electrek.co/favicon.ico',
    description: 'Electric vehicle and clean energy news',
    automotiveFocus: 8,
    specialties: ['EV', 'Tesla', 'autonomous', 'clean-energy'],
    credibility: 7,
    updateFrequency: 'hourly',
    contact: {
      email: 'tips@electrek.co'
    },
    legal: {
      attribution: 'Electrek',
      fairUsePolicy: 'Standard fair use with attribution'
    }
  }
];

async function seedAutomotiveFeeds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/industry-news');
    console.log('Connected to MongoDB');

    // Clear existing feeds
    await AutomotivePublisher.deleteMany({});
    console.log('Cleared existing automotive publisher feeds');

    // Insert automotive feeds
    const feeds = await AutomotivePublisher.insertMany(automotiveFeeds);
    console.log(`Inserted ${feeds.length} automotive RSS feeds`);

    // Display summary by specialty
    const summary = await AutomotivePublisher.aggregate([
      {
        $unwind: '$specialties'
      },
      {
        $group: {
          _id: '$specialties',
          count: { $sum: 1 },
          avgCredibility: { $avg: '$credibility' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    console.log('\nAutomotive Feeds by Specialty:');
    summary.forEach(item => {
      console.log(`  ${item._id}: ${item.count} feeds (avg credibility: ${item.avgCredibility.toFixed(1)})`);
    });

    // Display high-credibility feeds
    const highCredibility = await AutomotivePublisher.find({ 
      credibility: { $gte: 8 } 
    }).sort({ credibility: -1 });

    console.log('\nHigh-Credibility Automotive Sources:');
    highCredibility.forEach(feed => {
      console.log(`  ${feed.name}: ${feed.credibility}/10 (${feed.specialties.join(', ')})`);
    });

    console.log('\nAutomotive RSS feeds seeded successfully!');
  } catch (error) {
    console.error('Error seeding automotive feeds:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedAutomotiveFeeds();
}

module.exports = { seedAutomotiveFeeds, automotiveFeeds };
