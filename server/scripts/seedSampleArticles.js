const mongoose = require('mongoose');
const ProcessedArticle = require('../models/ProcessedArticle');
require('dotenv').config();

// Sample automotive articles
const sampleArticles = [
  {
    sourceId: 'bbc_automotive',
    title: 'Tesla Model Y Gets New Software Update with Enhanced Autopilot Features',
    link: 'https://www.bbc.com/news/business/tesla-model-y-update',
    snippet: 'Tesla has released a new software update for the Model Y that includes enhanced autopilot capabilities and improved battery management.',
    publishedAt: new Date(),
    canonicalUrl: 'https://www.bbc.com/news/business/tesla-model-y-update',
    titleFingerprint: 'tesla-model-y-software-update',
    industry: 'Automotive',
    category: 'Launch',
    summary: 'Tesla releases new software update for Model Y with enhanced autopilot features and improved battery management.',
    confidence: 0.9,
    keyEntities: ['Tesla', 'Model Y', 'Autopilot', 'Software Update'],
    language: 'en',
    gptStatus: 'processed',
    isAutomotiveFiltered: false,
    originalIndustry: 'Automotive'
  },
  {
    sourceId: 'techcrunch_transportation',
    title: 'Ford F-150 Lightning Production Increases to Meet Growing Demand',
    link: 'https://techcrunch.com/ford-f150-lightning-production-increase',
    snippet: 'Ford has announced increased production of the F-150 Lightning electric pickup truck to meet growing consumer demand.',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    canonicalUrl: 'https://techcrunch.com/ford-f150-lightning-production-increase',
    titleFingerprint: 'ford-f150-lightning-production-increase',
    industry: 'Automotive',
    category: 'Financials',
    summary: 'Ford increases F-150 Lightning production to meet growing demand for electric pickup trucks.',
    confidence: 0.85,
    keyEntities: ['Ford', 'F-150 Lightning', 'Electric Pickup', 'Production'],
    language: 'en',
    gptStatus: 'processed',
    isAutomotiveFiltered: false,
    originalIndustry: 'Automotive'
  },
  {
    sourceId: 'engadget_transportation',
    title: 'BMW iX Electric SUV Sets New Range Record',
    link: 'https://www.engadget.com/bmw-ix-range-record',
    snippet: 'BMW\'s iX electric SUV has achieved a new range record of 324 miles on a single charge in real-world driving conditions.',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    canonicalUrl: 'https://www.engadget.com/bmw-ix-range-record',
    titleFingerprint: 'bmw-ix-electric-suv-range-record',
    industry: 'Automotive',
    category: 'Research',
    summary: 'BMW iX electric SUV achieves new range record of 324 miles on single charge in real-world conditions.',
    confidence: 0.88,
    keyEntities: ['BMW', 'iX', 'Electric SUV', 'Range Record'],
    language: 'en',
    gptStatus: 'processed',
    isAutomotiveFiltered: false,
    originalIndustry: 'Automotive'
  },
  {
    sourceId: 'bbc_automotive',
    title: 'Volkswagen ID.4 Wins European Car of the Year Award',
    link: 'https://www.bbc.com/news/business/volkswagen-id4-award',
    snippet: 'The Volkswagen ID.4 has been named European Car of the Year, recognizing its innovation in electric vehicle technology.',
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    canonicalUrl: 'https://www.bbc.com/news/business/volkswagen-id4-award',
    titleFingerprint: 'volkswagen-id4-european-car-year-award',
    industry: 'Automotive',
    category: 'Launch',
    summary: 'Volkswagen ID.4 wins European Car of the Year award for electric vehicle innovation.',
    confidence: 0.92,
    keyEntities: ['Volkswagen', 'ID.4', 'European Car of the Year', 'Electric Vehicle'],
    language: 'en',
    gptStatus: 'processed',
    isAutomotiveFiltered: false,
    originalIndustry: 'Automotive'
  },
  {
    sourceId: 'techcrunch_transportation',
    title: 'Rivian R1T Electric Truck Begins Customer Deliveries',
    link: 'https://techcrunch.com/rivian-r1t-customer-deliveries',
    snippet: 'Rivian has begun customer deliveries of the R1T electric pickup truck, marking a milestone for the electric vehicle startup.',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    canonicalUrl: 'https://techcrunch.com/rivian-r1t-customer-deliveries',
    titleFingerprint: 'rivian-r1t-electric-truck-customer-deliveries',
    industry: 'Automotive',
    category: 'Launch',
    summary: 'Rivian begins customer deliveries of R1T electric pickup truck, marking milestone for EV startup.',
    confidence: 0.87,
    keyEntities: ['Rivian', 'R1T', 'Electric Pickup Truck', 'Customer Deliveries'],
    language: 'en',
    gptStatus: 'processed',
    isAutomotiveFiltered: false,
    originalIndustry: 'Automotive'
  },
  {
    sourceId: 'engadget_transportation',
    title: 'Mercedes EQS Electric Sedan Achieves 400-Mile Range',
    link: 'https://www.engadget.com/mercedes-eqs-400-mile-range',
    snippet: 'Mercedes-Benz EQS electric sedan has achieved an EPA-rated range of 400 miles, setting a new benchmark for luxury electric vehicles.',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    canonicalUrl: 'https://www.engadget.com/mercedes-eqs-400-mile-range',
    titleFingerprint: 'mercedes-eqs-electric-sedan-400-mile-range',
    industry: 'Automotive',
    category: 'Research',
    summary: 'Mercedes EQS electric sedan achieves 400-mile EPA range, setting luxury EV benchmark.',
    confidence: 0.91,
    keyEntities: ['Mercedes-Benz', 'EQS', 'Electric Sedan', '400-Mile Range'],
    language: 'en',
    gptStatus: 'processed',
    isAutomotiveFiltered: false,
    originalIndustry: 'Automotive'
  },
  {
    sourceId: 'bbc_automotive',
    title: 'General Motors Announces $7 Billion Investment in Electric Vehicle Production',
    link: 'https://www.bbc.com/news/business/gm-electric-investment',
    snippet: 'General Motors has announced a $7 billion investment to expand electric vehicle production capacity across multiple facilities.',
    publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 hours ago
    canonicalUrl: 'https://www.bbc.com/news/business/gm-electric-investment',
    titleFingerprint: 'general-motors-7-billion-electric-investment',
    industry: 'Automotive',
    category: 'Financials',
    summary: 'General Motors announces $7 billion investment to expand electric vehicle production capacity.',
    confidence: 0.89,
    keyEntities: ['General Motors', 'Electric Vehicle', 'Investment', 'Production'],
    language: 'en',
    gptStatus: 'processed',
    isAutomotiveFiltered: false,
    originalIndustry: 'Automotive'
  },
  {
    sourceId: 'techcrunch_transportation',
    title: 'Lucid Air Dream Edition Sets New EV Range Record',
    link: 'https://techcrunch.com/lucid-air-dream-edition-range-record',
    snippet: 'Lucid Motors Air Dream Edition has set a new electric vehicle range record with 520 miles on a single charge.',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    canonicalUrl: 'https://techcrunch.com/lucid-air-dream-edition-range-record',
    titleFingerprint: 'lucid-air-dream-edition-ev-range-record',
    industry: 'Automotive',
    category: 'Research',
    summary: 'Lucid Air Dream Edition sets new EV range record with 520 miles on single charge.',
    confidence: 0.93,
    keyEntities: ['Lucid Motors', 'Air Dream Edition', 'EV Range Record', '520 Miles'],
    language: 'en',
    gptStatus: 'processed',
    isAutomotiveFiltered: false,
    originalIndustry: 'Automotive'
  }
];

async function seedSampleArticles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/automotive-news');
    console.log('Connected to MongoDB');

    // Clear existing articles
    await ProcessedArticle.deleteMany({});
    console.log('Cleared existing articles');

    // Insert sample articles
    const insertedArticles = await ProcessedArticle.insertMany(sampleArticles);
    console.log(`Inserted ${insertedArticles.length} sample articles`);

    // Display articles
    console.log('\nSample Articles:');
    insertedArticles.forEach(article => {
      console.log(`- ${article.title} (${article.industry})`);
    });

    console.log('\nSample articles seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding sample articles:', error);
    process.exit(1);
  }
}

seedSampleArticles();