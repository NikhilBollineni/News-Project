// Global Automotive RSS Feeds Database
// Comprehensive list of automotive news sources worldwide

const globalAutomotiveFeeds = [
  // North America - Primary Sources
  {
    name: 'Automotive News',
    website: 'https://www.autonews.com',
    rssFeed: 'https://www.autonews.com/rss.xml',
    region: 'north-america',
    language: 'en',
    credibility: 9,
    automotiveFocus: 10,
    specialties: ['industry-news', 'manufacturing', 'dealer-news', 'supply-chain'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Car and Driver',
    website: 'https://www.caranddriver.com',
    rssFeed: 'https://feeds.feedburner.com/CarAndDriver',
    region: 'north-america',
    language: 'en',
    credibility: 8,
    automotiveFocus: 9,
    specialties: ['reviews', 'new-cars', 'technology', 'performance'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Motor Trend',
    website: 'https://www.motortrend.com',
    rssFeed: 'https://feeds.feedburner.com/MotorTrend',
    region: 'north-america',
    language: 'en',
    credibility: 8,
    automotiveFocus: 9,
    specialties: ['reviews', 'racing', 'trucks', 'suvs'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Tesla News',
    website: 'https://www.teslarati.com',
    rssFeed: 'https://feeds.feedburner.com/Teslarati',
    region: 'global',
    language: 'en',
    credibility: 7,
    automotiveFocus: 8,
    specialties: ['tesla', 'electric-vehicles', 'autonomous-driving', 'energy'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'InsideEVs',
    website: 'https://insideevs.com',
    rssFeed: 'https://insideevs.com/feed/',
    region: 'global',
    language: 'en',
    credibility: 7,
    automotiveFocus: 8,
    specialties: ['electric-vehicles', 'battery-technology', 'charging-infrastructure'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Green Car Reports',
    website: 'https://www.greencarreports.com',
    rssFeed: 'https://www.greencarreports.com/rss.xml',
    region: 'north-america',
    language: 'en',
    credibility: 7,
    automotiveFocus: 8,
    specialties: ['green-cars', 'hybrids', 'fuel-economy', 'environmental'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Automotive News Europe',
    website: 'https://europe.autonews.com',
    rssFeed: 'https://europe.autonews.com/rss.xml',
    region: 'europe',
    language: 'en',
    credibility: 8,
    automotiveFocus: 9,
    specialties: ['european-market', 'manufacturing', 'regulatory'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Auto Express',
    website: 'https://www.autoexpress.co.uk',
    rssFeed: 'https://www.autoexpress.co.uk/rss',
    region: 'europe',
    language: 'en',
    credibility: 7,
    automotiveFocus: 8,
    specialties: ['uk-market', 'reviews', 'news'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Autocar',
    website: 'https://www.autocar.co.uk',
    rssFeed: 'https://www.autocar.co.uk/rss',
    region: 'europe',
    language: 'en',
    credibility: 8,
    automotiveFocus: 9,
    specialties: ['uk-market', 'reviews', 'industry-news'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Automotive News China',
    website: 'https://china.autonews.com',
    rssFeed: 'https://china.autonews.com/rss.xml',
    region: 'china',
    language: 'en',
    credibility: 8,
    automotiveFocus: 9,
    specialties: ['chinese-market', 'manufacturing', 'ev-market'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Gasgoo',
    website: 'https://www.gasgoo.com',
    rssFeed: 'https://www.gasgoo.com/rss/',
    region: 'china',
    language: 'en',
    credibility: 6,
    automotiveFocus: 7,
    specialties: ['chinese-automotive', 'suppliers', 'manufacturing'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Indian Autos Blog',
    website: 'https://indianautosblog.com',
    rssFeed: 'https://indianautosblog.com/feed',
    region: 'india',
    language: 'en',
    credibility: 6,
    automotiveFocus: 7,
    specialties: ['indian-market', 'local-brands', 'affordable-cars'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'CarAdvice Australia',
    website: 'https://www.caradvice.com.au',
    rssFeed: 'https://www.caradvice.com.au/feed/',
    region: 'australia',
    language: 'en',
    credibility: 7,
    automotiveFocus: 8,
    specialties: ['australian-market', 'reviews', 'news'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Drive.com.au',
    website: 'https://www.drive.com.au',
    rssFeed: 'https://www.drive.com.au/feed/',
    region: 'australia',
    language: 'en',
    credibility: 7,
    automotiveFocus: 8,
    specialties: ['australian-market', 'reviews', 'industry-news'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Automotive News Japan',
    website: 'https://japan.autonews.com',
    rssFeed: 'https://japan.autonews.com/rss.xml',
    region: 'japan',
    language: 'en',
    credibility: 8,
    automotiveFocus: 9,
    specialties: ['japanese-market', 'manufacturing', 'technology'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Brazilian Automotive News',
    website: 'https://brazil.autonews.com',
    rssFeed: 'https://brazil.autonews.com/rss.xml',
    region: 'south-america',
    language: 'en',
    credibility: 7,
    automotiveFocus: 8,
    specialties: ['brazilian-market', 'manufacturing', 'latin-america'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  // Electric Vehicle Specialized Sources
  {
    name: 'Electrek',
    website: 'https://electrek.co',
    rssFeed: 'https://electrek.co/feed/',
    region: 'global',
    language: 'en',
    credibility: 7,
    automotiveFocus: 8,
    specialties: ['electric-vehicles', 'tesla', 'clean-energy', 'battery-tech'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'CleanTechnica',
    website: 'https://cleantechnica.com',
    rssFeed: 'https://cleantechnica.com/feed/',
    region: 'global',
    language: 'en',
    credibility: 6,
    automotiveFocus: 7,
    specialties: ['clean-tech', 'electric-vehicles', 'renewable-energy'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  // Technology and Innovation
  {
    name: 'Autonomous Vehicle News',
    website: 'https://www.autonomousvehiclenews.com',
    rssFeed: 'https://www.autonomousvehiclenews.com/feed/',
    region: 'global',
    language: 'en',
    credibility: 6,
    automotiveFocus: 8,
    specialties: ['autonomous-driving', 'ai-technology', 'sensors'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Automotive World',
    website: 'https://www.automotiveworld.com',
    rssFeed: 'https://www.automotiveworld.com/feed/',
    region: 'global',
    language: 'en',
    credibility: 7,
    automotiveFocus: 8,
    specialties: ['industry-analysis', 'technology', 'supply-chain'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  // Additional Major Automotive Sources
  {
    name: 'Road & Track',
    website: 'https://www.roadandtrack.com',
    rssFeed: 'https://www.roadandtrack.com/rss/',
    region: 'north-america',
    language: 'en',
    credibility: 8,
    automotiveFocus: 9,
    specialties: ['performance', 'racing', 'sports-cars', 'reviews'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'AutoWeek',
    website: 'https://www.autoweek.com',
    rssFeed: 'https://www.autoweek.com/rss/',
    region: 'north-america',
    language: 'en',
    credibility: 8,
    automotiveFocus: 9,
    specialties: ['racing', 'performance', 'industry-news', 'reviews'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'WardsAuto',
    website: 'https://www.wardsauto.com',
    rssFeed: 'https://www.wardsauto.com/rss/',
    region: 'north-america',
    language: 'en',
    credibility: 8,
    automotiveFocus: 9,
    specialties: ['industry-analysis', 'manufacturing', 'supply-chain', 'technology'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Just Auto',
    website: 'https://www.just-auto.com',
    rssFeed: 'https://www.just-auto.com/rss/',
    region: 'global',
    language: 'en',
    credibility: 7,
    automotiveFocus: 8,
    specialties: ['industry-news', 'manufacturing', 'supply-chain', 'analysis'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Auto Industry News',
    website: 'https://www.autoindustrynews.com',
    rssFeed: 'https://www.autoindustrynews.com/rss/',
    region: 'global',
    language: 'en',
    credibility: 6,
    automotiveFocus: 8,
    specialties: ['industry-news', 'manufacturing', 'business'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  // EV and Green Technology Sources
  {
    name: 'EV Magazine',
    website: 'https://www.evmagazine.com',
    rssFeed: 'https://www.evmagazine.com/feed/',
    region: 'global',
    language: 'en',
    credibility: 6,
    automotiveFocus: 8,
    specialties: ['electric-vehicles', 'battery-technology', 'charging'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Electric Vehicle News',
    website: 'https://www.electricvehiclenews.com',
    rssFeed: 'https://www.electricvehiclenews.com/feed/',
    region: 'global',
    language: 'en',
    credibility: 6,
    automotiveFocus: 8,
    specialties: ['electric-vehicles', 'ev-technology', 'market-trends'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Battery Technology',
    website: 'https://www.batterytechnology.com',
    rssFeed: 'https://www.batterytechnology.com/feed/',
    region: 'global',
    language: 'en',
    credibility: 6,
    automotiveFocus: 7,
    specialties: ['battery-technology', 'energy-storage', 'ev-batteries'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  // Luxury and Performance
  {
    name: 'Top Gear',
    website: 'https://www.topgear.com',
    rssFeed: 'https://www.topgear.com/rss/',
    region: 'global',
    language: 'en',
    credibility: 8,
    automotiveFocus: 9,
    specialties: ['performance', 'luxury', 'reviews', 'entertainment'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Car Magazine',
    website: 'https://www.carmagazine.co.uk',
    rssFeed: 'https://www.carmagazine.co.uk/rss/',
    region: 'europe',
    language: 'en',
    credibility: 7,
    automotiveFocus: 8,
    specialties: ['reviews', 'performance', 'luxury', 'uk-market'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  // Commercial and Fleet
  {
    name: 'Fleet News',
    website: 'https://www.fleetnews.co.uk',
    rssFeed: 'https://www.fleetnews.co.uk/rss/',
    region: 'europe',
    language: 'en',
    credibility: 7,
    automotiveFocus: 8,
    specialties: ['fleet-management', 'commercial-vehicles', 'business'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Commercial Vehicle News',
    website: 'https://www.cvnews.com',
    rssFeed: 'https://www.cvnews.com/feed/',
    region: 'global',
    language: 'en',
    credibility: 6,
    automotiveFocus: 8,
    specialties: ['commercial-vehicles', 'trucks', 'fleet-management'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  // Racing and Motorsport
  {
    name: 'Motorsport.com',
    website: 'https://www.motorsport.com',
    rssFeed: 'https://www.motorsport.com/rss/',
    region: 'global',
    language: 'en',
    credibility: 8,
    automotiveFocus: 7,
    specialties: ['racing', 'motorsport', 'f1', 'performance'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Autosport',
    website: 'https://www.autosport.com',
    rssFeed: 'https://www.autosport.com/rss/',
    region: 'global',
    language: 'en',
    credibility: 8,
    automotiveFocus: 7,
    specialties: ['racing', 'f1', 'motorsport', 'performance'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  // Technology and Innovation
  {
    name: 'TechCrunch Automotive',
    website: 'https://techcrunch.com',
    rssFeed: 'https://techcrunch.com/category/transportation/feed/',
    region: 'global',
    language: 'en',
    credibility: 7,
    automotiveFocus: 6,
    specialties: ['automotive-tech', 'mobility', 'innovation', 'startups'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'IEEE Spectrum Automotive',
    website: 'https://spectrum.ieee.org',
    rssFeed: 'https://spectrum.ieee.org/rss/fulltext',
    region: 'global',
    language: 'en',
    credibility: 8,
    automotiveFocus: 6,
    specialties: ['automotive-engineering', 'technology', 'innovation'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  // Regional Specialized Sources
  {
    name: 'Automotive News Canada',
    website: 'https://canada.autonews.com',
    rssFeed: 'https://canada.autonews.com/rss.xml',
    region: 'canada',
    language: 'en',
    credibility: 8,
    automotiveFocus: 9,
    specialties: ['canadian-market', 'manufacturing', 'industry-news'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Korean Automotive News',
    website: 'https://korea.autonews.com',
    rssFeed: 'https://korea.autonews.com/rss.xml',
    region: 'korea',
    language: 'en',
    credibility: 7,
    automotiveFocus: 8,
    specialties: ['korean-market', 'hyundai', 'kia', 'manufacturing'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'German Automotive News',
    website: 'https://germany.autonews.com',
    rssFeed: 'https://germany.autonews.com/rss.xml',
    region: 'germany',
    language: 'en',
    credibility: 8,
    automotiveFocus: 9,
    specialties: ['german-market', 'bmw', 'mercedes', 'audi', 'vw'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'French Automotive News',
    website: 'https://france.autonews.com',
    rssFeed: 'https://france.autonews.com/rss.xml',
    region: 'france',
    language: 'en',
    credibility: 7,
    automotiveFocus: 8,
    specialties: ['french-market', 'renault', 'peugeot', 'manufacturing'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Italian Automotive News',
    website: 'https://italy.autonews.com',
    rssFeed: 'https://italy.autonews.com/rss.xml',
    region: 'italy',
    language: 'en',
    credibility: 7,
    automotiveFocus: 8,
    specialties: ['italian-market', 'ferrari', 'lamborghini', 'fiat', 'alfa-romeo'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Swedish Automotive News',
    website: 'https://sweden.autonews.com',
    rssFeed: 'https://sweden.autonews.com/rss.xml',
    region: 'sweden',
    language: 'en',
    credibility: 7,
    automotiveFocus: 8,
    specialties: ['swedish-market', 'volvo', 'saab', 'manufacturing'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  }
];

// Feed categories for organization
const feedCategories = {
  'primary-sources': ['Automotive News', 'Car and Driver', 'Motor Trend'],
  'electric-vehicles': ['Tesla News', 'InsideEVs', 'Green Car Reports', 'Electrek', 'CleanTechnica'],
  'regional': ['Automotive News Europe', 'Auto Express', 'Autocar', 'Automotive News China', 'Gasgoo', 'Indian Autos Blog', 'CarAdvice Australia', 'Drive.com.au', 'Automotive News Japan', 'Brazilian Automotive News'],
  'technology': ['Autonomous Vehicle News', 'Automotive World'],
  'specialized': ['Automotive News Europe', 'Automotive News China', 'Automotive News Japan', 'Brazilian Automotive News']
};

// Helper functions
function getFeedsByRegion(region) {
  return globalAutomotiveFeeds.filter(feed => feed.region === region);
}

function getFeedsBySpecialty(specialty) {
  return globalAutomotiveFeeds.filter(feed => 
    feed.specialties.includes(specialty)
  );
}

function getActiveFeeds() {
  return globalAutomotiveFeeds.filter(feed => feed.isActive);
}

function getHighCredibilityFeeds(minCredibility = 8) {
  return globalAutomotiveFeeds.filter(feed => feed.credibility >= minCredibility);
}

module.exports = {
  globalAutomotiveFeeds,
  feedCategories,
  getFeedsByRegion,
  getFeedsBySpecialty,
  getActiveFeeds,
  getHighCredibilityFeeds
};
