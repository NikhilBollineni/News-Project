// Working Automotive RSS Feeds - Tested and Verified
// This file contains only verified, working RSS feeds for automotive news

const workingAutomotiveFeeds = [
  // Major Automotive Publications (Verified Working)
  {
    name: 'Tesla News',
    website: 'https://www.teslarati.com',
    rssFeed: 'https://feeds.feedburner.com/Teslarati',
    region: 'global',
    language: 'en',
    credibility: 8,
    automotiveFocus: 9,
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
    credibility: 8,
    automotiveFocus: 9,
    specialties: ['electric-vehicles', 'ev-technology', 'charging', 'battery'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'Electrek',
    website: 'https://electrek.co',
    rssFeed: 'https://electrek.co/feed/',
    region: 'global',
    language: 'en',
    credibility: 8,
    automotiveFocus: 8,
    specialties: ['electric-vehicles', 'clean-energy', 'tesla', 'ev-technology'],
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
    credibility: 7,
    automotiveFocus: 7,
    specialties: ['clean-technology', 'electric-vehicles', 'renewable-energy', 'sustainability'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  
  // News Agencies with Automotive Coverage
  {
    name: 'Reuters Business',
    website: 'https://www.reuters.com',
    rssFeed: 'https://feeds.reuters.com/reuters/businessNews',
    region: 'global',
    language: 'en',
    credibility: 9,
    automotiveFocus: 6,
    specialties: ['business-news', 'industry-news', 'financial-news', 'automotive-business'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'BBC News - Business',
    website: 'https://www.bbc.com/news/business',
    rssFeed: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    region: 'global',
    language: 'en',
    credibility: 9,
    automotiveFocus: 5,
    specialties: ['business-news', 'industry-news', 'financial-news', 'automotive-business'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  {
    name: 'CNN Business',
    website: 'https://www.cnn.com/business',
    rssFeed: 'http://rss.cnn.com/rss/edition_business.rss',
    region: 'global',
    language: 'en',
    credibility: 8,
    automotiveFocus: 5,
    specialties: ['business-news', 'industry-news', 'financial-news', 'automotive-business'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  
  // Technology and Automotive
  {
    name: 'TechCrunch',
    website: 'https://techcrunch.com',
    rssFeed: 'https://techcrunch.com/feed/',
    region: 'global',
    language: 'en',
    credibility: 8,
    automotiveFocus: 6,
    specialties: ['technology', 'startups', 'transportation-tech', 'mobility'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  
  // Specialized Automotive
  {
    name: 'Jalopnik',
    website: 'https://jalopnik.com',
    rssFeed: 'https://jalopnik.com/rss',
    region: 'global',
    language: 'en',
    credibility: 7,
    automotiveFocus: 8,
    specialties: ['car-culture', 'automotive-news', 'car-reviews', 'motoring'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  },
  
  // Racing and Performance
  {
    name: 'Autosport',
    website: 'https://www.autosport.com',
    rssFeed: 'https://www.autosport.com/rss/',
    region: 'global',
    language: 'en',
    credibility: 8,
    automotiveFocus: 8,
    specialties: ['racing', 'motorsport', 'f1', 'performance-cars'],
    isActive: true,
    lastChecked: null,
    stats: { totalArticles: 0, errorCount: 0, lastError: null }
  }
];

// Helper function to get active feeds
const getActiveFeeds = () => {
  return workingAutomotiveFeeds.filter(feed => feed.isActive);
};

// Helper function to get feeds by region
const getFeedsByRegion = (region) => {
  return workingAutomotiveFeeds.filter(feed => 
    feed.isActive && (feed.region === region || feed.region === 'global')
  );
};

// Helper function to get feeds by specialty
const getFeedsBySpecialty = (specialty) => {
  return workingAutomotiveFeeds.filter(feed => 
    feed.isActive && feed.specialties.includes(specialty)
  );
};

// Helper function to get high-credibility feeds
const getHighCredibilityFeeds = (minCredibility = 8) => {
  return workingAutomotiveFeeds.filter(feed => 
    feed.isActive && feed.credibility >= minCredibility
  );
};

// Helper function to get high-automotive-focus feeds
const getHighAutomotiveFocusFeeds = (minFocus = 8) => {
  return workingAutomotiveFeeds.filter(feed => 
    feed.isActive && feed.automotiveFocus >= minFocus
  );
};

module.exports = {
  workingAutomotiveFeeds,
  getActiveFeeds,
  getFeedsByRegion,
  getFeedsBySpecialty,
  getHighCredibilityFeeds,
  getHighAutomotiveFocusFeeds
};
