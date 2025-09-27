/**
 * 🧪 TEST RSS SCRAPER
 * Test the RSS scraper directly to see if it's working
 */

const automotiveRSSScraper = require('./services/automotiveRSSScraper');

async function testRSSScraper() {
  console.log('🧪 Testing RSS Scraper...');
  
  const testFeed = {
    name: "Tesla News",
    website: "https://www.teslarati.com",
    rssFeed: "https://www.teslarati.com/feed/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Electric Vehicles",
    specialties: ["Tesla", "EV Technology", "Autonomous Driving"],
    isActive: true,
    verified: true
  };
  
  try {
    console.log(`📡 Testing feed: ${testFeed.name}`);
    console.log(`🔗 URL: ${testFeed.rssFeed}`);
    
    const articles = await automotiveRSSScraper.scrapeAutomotiveFeed(testFeed.rssFeed, testFeed);
    
    console.log(`✅ Success! Found ${articles ? articles.length : 0} articles`);
    
    if (articles && articles.length > 0) {
      console.log('📄 Sample articles:');
      articles.slice(0, 3).forEach((article, index) => {
        console.log(`  ${index + 1}. ${article.originalTitle}`);
        console.log(`     URL: ${article.originalUrl}`);
        console.log(`     Published: ${article.publishedAt}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing RSS scraper:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testRSSScraper();
