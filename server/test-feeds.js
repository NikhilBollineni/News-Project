/**
 * 🧪 FEED TESTING SCRIPT
 * Test all 139 automotive news feeds to identify working vs broken sources
 */

const Parser = require('rss-parser');
const axios = require('axios');

// Import all feed collections
const globalAutomotiveNewsFeeds = require('./data/globalAutomotiveNewsFeeds');
const manufacturerFeeds = require('./data/manufacturerFeeds');
const industryPublications = require('./data/industryPublications');
const regionalAutomotiveFeeds = require('./data/regionalAutomotiveFeeds');

// Combine all feeds
const allFeeds = [
  ...globalAutomotiveNewsFeeds,
  ...manufacturerFeeds,
  ...industryPublications,
  ...regionalAutomotiveFeeds
];

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; AutomotiveNewsBot/1.0)'
  }
});

async function testFeed(feed) {
  const result = {
    name: feed.name,
    url: feed.rssFeed,
    status: 'unknown',
    articles: 0,
    error: null,
    responseTime: 0
  };

  const startTime = Date.now();
  
  try {
    console.log(`🧪 Testing: ${feed.name}`);
    
    // First, check if URL is accessible
    const response = await axios.head(feed.rssFeed, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AutomotiveNewsBot/1.0)'
      }
    });
    
    if (response.status >= 200 && response.status < 300) {
      // Try to parse the RSS feed
      const feedData = await parser.parseURL(feed.rssFeed);
      
      result.status = 'working';
      result.articles = feedData.items ? feedData.items.length : 0;
      result.responseTime = Date.now() - startTime;
      
      console.log(`✅ ${feed.name}: ${result.articles} articles (${result.responseTime}ms)`);
    } else {
      result.status = 'error';
      result.error = `HTTP ${response.status}`;
      console.log(`❌ ${feed.name}: HTTP ${response.status}`);
    }
    
  } catch (error) {
    result.status = 'error';
    result.error = error.message;
    result.responseTime = Date.now() - startTime;
    console.log(`❌ ${feed.name}: ${error.message}`);
  }
  
  return result;
}

async function testAllFeeds() {
  console.log('🧪 Starting comprehensive feed testing...');
  console.log(`📊 Testing ${allFeeds.length} feeds across all categories`);
  console.log('=' * 60);
  
  const results = [];
  const batchSize = 5; // Test 5 feeds at a time
  
  // Test in batches to avoid overwhelming servers
  for (let i = 0; i < allFeeds.length; i += batchSize) {
    const batch = allFeeds.slice(i, i + batchSize);
    console.log(`\n📦 Testing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allFeeds.length/batchSize)}`);
    
    const batchPromises = batch.map(feed => testFeed(feed));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + batchSize < allFeeds.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Analyze results
  const working = results.filter(r => r.status === 'working');
  const broken = results.filter(r => r.status === 'error');
  
  console.log('\n' + '=' * 60);
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' * 60);
  console.log(`✅ Working feeds: ${working.length}`);
  console.log(`❌ Broken feeds: ${broken.length}`);
  console.log(`📊 Success rate: ${((working.length / allFeeds.length) * 100).toFixed(1)}%`);
  
  // Show working feeds
  console.log('\n✅ WORKING FEEDS:');
  working.forEach(feed => {
    console.log(`  • ${feed.name}: ${feed.articles} articles (${feed.responseTime}ms)`);
  });
  
  // Show broken feeds with reasons
  console.log('\n❌ BROKEN FEEDS:');
  broken.forEach(feed => {
    console.log(`  • ${feed.name}: ${feed.error}`);
  });
  
  // Category breakdown
  console.log('\n📊 CATEGORY BREAKDOWN:');
  const categories = {
    'Global News': globalAutomotiveNewsFeeds.length,
    'Manufacturers': manufacturerFeeds.length,
    'Industry Publications': industryPublications.length,
    'Regional Sources': regionalAutomotiveFeeds.length
  };
  
  Object.entries(categories).forEach(([category, total]) => {
    const categoryFeeds = allFeeds.filter(f => 
      (category === 'Global News' && globalAutomotiveNewsFeeds.includes(f)) ||
      (category === 'Manufacturers' && manufacturerFeeds.includes(f)) ||
      (category === 'Industry Publications' && industryPublications.includes(f)) ||
      (category === 'Regional Sources' && regionalAutomotiveFeeds.includes(f))
    );
    
    const workingInCategory = results.filter(r => 
      categoryFeeds.some(f => f.name === r.name) && r.status === 'working'
    ).length;
    
    console.log(`  • ${category}: ${workingInCategory}/${total} working (${((workingInCategory/total)*100).toFixed(1)}%)`);
  });
  
  return {
    total: allFeeds.length,
    working: working.length,
    broken: broken.length,
    successRate: (working.length / allFeeds.length) * 100,
    results: results
  };
}

// Run the test
testAllFeeds().then(summary => {
  console.log('\n🎯 RECOMMENDATIONS:');
  if (summary.successRate < 50) {
    console.log('⚠️  Low success rate - consider using only verified working feeds');
  } else if (summary.successRate < 70) {
    console.log('⚠️  Moderate success rate - some feeds may need URL updates');
  } else {
    console.log('✅ Good success rate - most feeds are working well');
  }
  
  console.log('\n💡 Next steps:');
  console.log('1. Use only working feeds in production');
  console.log('2. Update broken feed URLs');
  console.log('3. Implement fallback mechanisms');
  console.log('4. Monitor feed health regularly');
}).catch(error => {
  console.error('❌ Test failed:', error);
});
