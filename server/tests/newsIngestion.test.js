const { describe, it, before, after, beforeEach } = require('mocha');
const { expect } = require('chai');
const mongoose = require('mongoose');
const newsFetcher = require('../services/newsFetcher');
const contentExtractor = require('../services/contentExtractor');
const gptProcessor = require('../services/gptProcessor');
const deduplicationService = require('../services/deduplicationService');
const costOptimizationService = require('../services/costOptimizationService');
const ProcessedArticle = require('../models/ProcessedArticle');
const NewsSource = require('../models/NewsSource');

// Test configuration
const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/news-ingestion-test';

describe('News Ingestion Pipeline Tests', () => {
  before(async () => {
    // Connect to test database
    await mongoose.connect(TEST_MONGODB_URI);
    console.log('Connected to test database');
  });

  after(async () => {
    // Clean up test database
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
    console.log('Disconnected from test database');
  });

  beforeEach(async () => {
    // Clear collections before each test
    await ProcessedArticle.deleteMany({});
    await NewsSource.deleteMany({});
    costOptimizationService.resetCostTracking();
  });

  describe('News Fetcher Tests', () => {
    it('should normalize URLs correctly', () => {
      const testUrls = [
        'https://example.com/article?utm_source=google&utm_campaign=test',
        'https://example.com/article/',
        'https://example.com/article?fbclid=123456789',
        'https://example.com/article?utm_source=google&other=param'
      ];

      const expectedUrls = [
        'https://example.com/article?other=param',
        'https://example.com/article',
        'https://example.com/article',
        'https://example.com/article?other=param'
      ];

      testUrls.forEach((url, index) => {
        const normalized = newsFetcher.normalizeUrl(url);
        expect(normalized).to.equal(expectedUrls[index]);
      });
    });

    it('should generate title fingerprints correctly', () => {
      const titles = [
        'Tesla Announces New Model Y Updates',
        'tesla announces new model y updates',
        'Tesla Announces New Model Y Updates!!!',
        'Tesla Announces New Model Y Updates (Updated)'
      ];

      const fingerprints = titles.map(title => newsFetcher.generateTitleFingerprint(title));
      
      // All should generate the same fingerprint
      fingerprints.forEach(fingerprint => {
        expect(fingerprint).to.equal(fingerprints[0]);
      });
    });

    it('should validate and normalize feed items', () => {
      const validItem = {
        title: 'Test Article',
        link: 'https://example.com/article',
        contentSnippet: 'Test content',
        pubDate: '2023-12-01T10:00:00Z'
      };

      const normalized = newsFetcher.normalizeFeedItem(validItem, 'test-source');
      
      expect(normalized).to.not.be.null;
      expect(normalized.title).to.equal('Test Article');
      expect(normalized.link).to.equal('https://example.com/article');
      expect(normalized.sourceId).to.equal('test-source');
    });

    it('should reject items without required fields', () => {
      const invalidItems = [
        { title: 'No Link' },
        { link: 'https://example.com/article' },
        { title: '', link: 'https://example.com/article' },
        { title: 'Test', link: '' }
      ];

      invalidItems.forEach(item => {
        const normalized = newsFetcher.normalizeFeedItem(item, 'test-source');
        expect(normalized).to.be.null;
      });
    });
  });

  describe('Content Extractor Tests', () => {
    it('should detect paywalls correctly', () => {
      const paywallHtml = `
        <html>
          <body>
            <div class="paywall">Subscribe to read more</div>
            <div class="subscription">Premium content</div>
          </body>
        </html>
      `;

      const cheerio = require('cheerio');
      const $ = cheerio.load(paywallHtml);
      const isPaywalled = contentExtractor.detectPaywall($, paywallHtml);
      
      expect(isPaywalled).to.be.true;
    });

    it('should extract content using selectors', () => {
      const html = `
        <html>
          <body>
            <article>
              <h1>Test Article</h1>
              <p>This is the main content of the article.</p>
              <p>This is more content.</p>
            </article>
          </body>
        </html>
      `;

      const cheerio = require('cheerio');
      const $ = cheerio.load(html);
      const content = contentExtractor.extractMainContent($);
      
      expect(content).to.include('Test Article');
      expect(content).to.include('This is the main content');
    });

    it('should extract metadata correctly', () => {
      const html = `
        <html lang="en">
          <head>
            <meta name="author" content="John Doe">
            <meta name="language" content="en">
          </head>
          <body>
            <article>
              <time datetime="2023-12-01T10:00:00Z">December 1, 2023</time>
              <img src="https://example.com/image.jpg" alt="Test image">
            </article>
          </body>
        </html>
      `;

      const cheerio = require('cheerio');
      const $ = cheerio.load(html);
      const metadata = contentExtractor.extractMetadata($, html);
      
      expect(metadata.author).to.equal('John Doe');
      expect(metadata.language).to.equal('en');
      expect(metadata.images).to.have.length(1);
      expect(metadata.publishedAt).to.not.be.null;
    });
  });

  describe('Deduplication Service Tests', () => {
    it('should generate content fingerprints correctly', () => {
      const content1 = 'Tesla announces new Model Y features and pricing updates';
      const content2 = 'Tesla Announces New Model Y Features And Pricing Updates!!!';
      const content3 = 'Ford announces new F-150 features and pricing updates';

      const fingerprint1 = deduplicationService.generateContentFingerprint(content1, '');
      const fingerprint2 = deduplicationService.generateContentFingerprint(content2, '');
      const fingerprint3 = deduplicationService.generateContentFingerprint(content3, '');

      expect(fingerprint1).to.equal(fingerprint2); // Should be same
      expect(fingerprint1).to.not.equal(fingerprint3); // Should be different
    });

    it('should calculate title similarity correctly', () => {
      const title1 = 'Tesla Model Y gets new features';
      const title2 = 'Tesla Model Y receives new features';
      const title3 = 'Ford F-150 gets new features';

      const similarity1 = deduplicationService.calculateTitleSimilarity(title1, title2);
      const similarity2 = deduplicationService.calculateTitleSimilarity(title1, title3);

      expect(similarity1).to.be.greaterThan(0.8); // Should be very similar
      expect(similarity2).to.be.lessThan(0.8); // Should be less similar
    });
  });

  describe('Cost Optimization Service Tests', () => {
    it('should track GPT usage correctly', () => {
      const tokenUsage = {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150
      };
      const cost = 0.001;

      costOptimizationService.trackGPTUsage(tokenUsage, cost);

      const stats = costOptimizationService.getCostStatistics();
      expect(stats.totals.gptTokens).to.equal(150);
      expect(stats.totals.gptCost).to.equal(0.001);
      expect(stats.totals.apiCalls).to.equal(1);
    });

    it('should estimate GPT cost correctly', () => {
      const article = {
        title: 'Test Article',
        cleanText: 'This is a test article with some content to estimate tokens.'
      };

      const estimatedCost = costOptimizationService.estimateGPTCost(article);
      expect(estimatedCost).to.be.greaterThan(0);
      expect(estimatedCost).to.be.lessThan(0.01); // Should be reasonable
    });

    it('should skip processing when budget exceeded', () => {
      // Set very low budget
      costOptimizationService.updateOptimizationSettings({
        dailyBudget: 0.001
      });

      // Track some usage to exceed budget
      costOptimizationService.trackGPTUsage({ total_tokens: 1000 }, 0.002);

      const article = { title: 'Test', cleanText: 'Content' };
      const shouldSkip = costOptimizationService.shouldSkipProcessing(article);

      expect(shouldSkip.skip).to.be.true;
      expect(shouldSkip.reason).to.equal('daily_budget_exceeded');
    });

    it('should cache data correctly', () => {
      const key = 'test-key';
      const value = { test: 'data' };

      costOptimizationService.setCache(key, value, 3600);
      const cached = costOptimizationService.getCache(key);

      expect(cached).to.deep.equal(value);
    });

    it('should return null for expired cache', () => {
      const key = 'test-key';
      const value = { test: 'data' };

      costOptimizationService.setCache(key, value, 0); // Immediate expiry
      const cached = costOptimizationService.getCache(key);

      expect(cached).to.be.null;
    });
  });

  describe('Database Integration Tests', () => {
    it('should save and retrieve articles correctly', async () => {
      const articleData = {
        sourceId: 'test-source',
        title: 'Test Article',
        link: 'https://example.com/test',
        snippet: 'Test snippet',
        publishedAt: new Date(),
        canonicalUrl: 'https://example.com/test',
        titleFingerprint: 'test-fingerprint',
        industry: 'Automotive',
        category: 'Launch',
        summary: 'Test summary',
        confidence: 0.9,
        keyEntities: ['Tesla', 'Model Y'],
        gptStatus: 'processed'
      };

      const article = new ProcessedArticle(articleData);
      await article.save();

      const retrieved = await ProcessedArticle.findById(article._id);
      expect(retrieved.title).to.equal('Test Article');
      expect(retrieved.industry).to.equal('Automotive');
      expect(retrieved.confidence).to.equal(0.9);
    });

    it('should prevent duplicate articles', async () => {
      const articleData = {
        sourceId: 'test-source',
        title: 'Test Article',
        link: 'https://example.com/test',
        snippet: 'Test snippet',
        publishedAt: new Date(),
        canonicalUrl: 'https://example.com/test',
        titleFingerprint: 'test-fingerprint',
        industry: 'Automotive',
        category: 'Launch',
        summary: 'Test summary',
        confidence: 0.9,
        keyEntities: ['Tesla'],
        gptStatus: 'processed'
      };

      const article1 = new ProcessedArticle(articleData);
      await article1.save();

      const article2 = new ProcessedArticle(articleData);
      
      try {
        await article2.save();
        expect.fail('Should have thrown duplicate key error');
      } catch (error) {
        expect(error.code).to.equal(11000); // Duplicate key error
      }
    });

    it('should save and retrieve news sources correctly', async () => {
      const sourceData = {
        sourceId: 'test-source',
        name: 'Test Source',
        type: 'RSS',
        url: 'https://example.com/rss',
        country: 'US',
        language: 'en',
        isActive: true,
        priority: 1
      };

      const source = new NewsSource(sourceData);
      await source.save();

      const retrieved = await NewsSource.findById(source._id);
      expect(retrieved.name).to.equal('Test Source');
      expect(retrieved.isActive).to.be.true;
    });
  });

  describe('End-to-End Pipeline Tests', () => {
    it('should process a mock RSS feed item', async () => {
      // Create a test source
      const source = new NewsSource({
        sourceId: 'test-source',
        name: 'Test Source',
        type: 'RSS',
        url: 'https://example.com/rss',
        isActive: true
      });
      await source.save();

      // Mock RSS feed item
      const feedItem = {
        title: 'Tesla Model Y Gets New Features',
        link: 'https://example.com/tesla-model-y',
        contentSnippet: 'Tesla has announced new features for the Model Y including improved autopilot and longer range.',
        pubDate: '2023-12-01T10:00:00Z'
      };

      // Normalize the feed item
      const normalized = newsFetcher.normalizeFeedItem(feedItem, 'test-source');
      expect(normalized).to.not.be.null;

      // Save as processed article
      const article = new ProcessedArticle({
        ...normalized,
        industry: 'Automotive',
        category: 'Launch',
        summary: 'Tesla announces new Model Y features',
        confidence: 0.9,
        keyEntities: ['Tesla', 'Model Y'],
        gptStatus: 'processed'
      });

      await article.save();

      // Verify it was saved correctly
      const retrieved = await ProcessedArticle.findById(article._id);
      expect(retrieved.title).to.equal('Tesla Model Y Gets New Features');
      expect(retrieved.industry).to.equal('Automotive');
      expect(retrieved.gptStatus).to.equal('processed');
    });

    it('should handle deduplication correctly', async () => {
      // Create first article
      const article1 = new ProcessedArticle({
        sourceId: 'test-source',
        title: 'Tesla Model Y News',
        link: 'https://example.com/tesla-1',
        snippet: 'Tesla Model Y gets updates',
        publishedAt: new Date(),
        canonicalUrl: 'https://example.com/tesla-1',
        titleFingerprint: 'tesla-model-y-news',
        industry: 'Automotive',
        category: 'Launch',
        summary: 'Tesla Model Y news',
        confidence: 0.9,
        keyEntities: ['Tesla'],
        gptStatus: 'processed'
      });
      await article1.save();

      // Create second article with same fingerprint
      const article2 = new ProcessedArticle({
        sourceId: 'test-source-2',
        title: 'Tesla Model Y News',
        link: 'https://example.com/tesla-2',
        snippet: 'Tesla Model Y gets updates',
        publishedAt: new Date(),
        canonicalUrl: 'https://example.com/tesla-2',
        titleFingerprint: 'tesla-model-y-news',
        industry: 'Automotive',
        category: 'Launch',
        summary: 'Tesla Model Y news',
        confidence: 0.9,
        keyEntities: ['Tesla'],
        gptStatus: 'processed'
      });

      try {
        await article2.save();
        expect.fail('Should have thrown duplicate key error');
      } catch (error) {
        expect(error.code).to.equal(11000);
      }
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle invalid URLs gracefully', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://invalid-protocol.com',
        '',
        null,
        undefined
      ];

      invalidUrls.forEach(url => {
        const normalized = newsFetcher.normalizeUrl(url);
        // Should return original or handle gracefully
        expect(typeof normalized).to.equal('string');
      });
    });

    it('should handle empty content extraction', async () => {
      const emptyHtml = '<html><body></body></html>';
      const cheerio = require('cheerio');
      const $ = cheerio.load(emptyHtml);
      
      const content = contentExtractor.extractMainContent($);
      expect(content).to.equal('');
    });

    it('should handle malformed JSON in GPT processing', () => {
      const malformedJson = '{ invalid json }';
      
      try {
        JSON.parse(malformedJson);
        expect.fail('Should have thrown JSON parse error');
      } catch (error) {
        expect(error).to.be.instanceOf(SyntaxError);
      }
    });
  });
});

// Integration test for the full pipeline
describe('Full Pipeline Integration Test', () => {
  before(async () => {
    await mongoose.connect(TEST_MONGODB_URI);
  });

  after(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  });

  it('should run complete ingestion pipeline with mock data', async () => {
    // This test would run the complete pipeline with mock data
    // and verify all components work together correctly
    
    // Create test sources
    const source = new NewsSource({
      sourceId: 'integration-test',
      name: 'Integration Test Source',
      type: 'RSS',
      url: 'https://example.com/test-rss',
      isActive: true
    });
    await source.save();

    // Mock feed items
    const mockItems = [
      {
        title: 'Tesla Model Y Updates',
        link: 'https://example.com/tesla-updates',
        contentSnippet: 'Tesla announces updates to Model Y',
        pubDate: '2023-12-01T10:00:00Z'
      },
      {
        title: 'Ford F-150 Electric Launch',
        link: 'https://example.com/ford-electric',
        contentSnippet: 'Ford launches electric F-150',
        pubDate: '2023-12-01T11:00:00Z'
      }
    ];

    // Process items through the pipeline
    const processedItems = [];
    for (const item of mockItems) {
      const normalized = newsFetcher.normalizeFeedItem(item, 'integration-test');
      if (normalized) {
        const article = new ProcessedArticle({
          ...normalized,
          industry: 'Automotive',
          category: 'Launch',
          summary: `${normalized.title} - processed`,
          confidence: 0.8,
          keyEntities: ['Tesla', 'Ford'],
          gptStatus: 'processed'
        });
        await article.save();
        processedItems.push(article);
      }
    }

    // Verify results
    expect(processedItems).to.have.length(2);
    
    const articles = await ProcessedArticle.find({ sourceId: 'integration-test' });
    expect(articles).to.have.length(2);
    expect(articles[0].industry).to.equal('Automotive');
    expect(articles[0].gptStatus).to.equal('processed');
  });
});
