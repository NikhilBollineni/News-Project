const newsFetcher = require('./newsFetcher');
const contentExtractor = require('./contentExtractor');
const metadataEnricher = require('./metadataEnricher');
const gptProcessor = require('./gptProcessor');
const deduplicationService = require('./deduplicationService');
const ProcessedArticle = require('../models/ProcessedArticle');
const logger = require('../utils/logger');

class NewsIngestionPipeline {
  constructor() {
    this.isRunning = false;
    this.config = {
      maxConcurrentContentExtraction: parseInt(process.env.MAX_CONCURRENT_CONTENT_EXTRACTION) || 5,
      contentExtractionBatchSize: parseInt(process.env.CONTENT_EXTRACTION_BATCH_SIZE) || 10,
      gptBatchSize: parseInt(process.env.GPT_BATCH_SIZE) || 5,
      enableContentExtraction: process.env.ENABLE_CONTENT_EXTRACTION !== 'false',
      enableGPTProcessing: process.env.ENABLE_GPT_PROCESSING !== 'false'
    };
  }

  /**
   * Run the complete ingestion pipeline
   */
  async runFullPipeline() {
    if (this.isRunning) {
      logger.warn('Pipeline is already running, skipping this execution');
      return { success: false, error: 'Pipeline already running' };
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Starting full news ingestion pipeline...');

      // Step 1: Fetch RSS feeds and normalize data
      logger.info('Step 1: Fetching RSS feeds...');
      const fetchResult = await newsFetcher.processAllSources();
      
      if (!fetchResult.success) {
        throw new Error(`Feed fetching failed: ${fetchResult.error}`);
      }

      logger.info(`Step 1 completed: ${fetchResult.totalItemsSaved} articles fetched`);

      // Step 2: Content extraction for new articles
      if (this.config.enableContentExtraction) {
        logger.info('Step 2: Extracting article content...');
        const extractionResult = await this.extractContentForNewArticles();
        logger.info(`Step 2 completed: ${extractionResult.extracted} articles processed`);
      }

      // Step 3: Metadata enrichment
      logger.info('Step 3: Enriching metadata...');
      const enrichmentResult = await this.enrichMetadataForNewArticles();
      logger.info(`Step 3 completed: ${enrichmentResult.enriched} articles enriched`);

      // Step 4: GPT processing
      if (this.config.enableGPTProcessing) {
        logger.info('Step 4: GPT classification and summarization...');
        const gptResult = await gptProcessor.processUnprocessedArticles(50);
        
        if (gptResult.success) {
          logger.info(`Step 4 completed: ${gptResult.processedCount} articles processed by GPT`);
        } else {
          logger.error(`Step 4 failed: ${gptResult.error}`);
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`Full pipeline completed in ${duration}ms`);

      return {
        success: true,
        duration,
        results: {
          fetch: fetchResult,
          extraction: this.config.enableContentExtraction ? extractionResult : null,
          enrichment: enrichmentResult,
          gpt: this.config.enableGPTProcessing ? gptResult : null
        }
      };

    } catch (error) {
      logger.error('Pipeline execution failed:', error.message);
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Extract content for articles that don't have it yet
   */
  async extractContentForNewArticles() {
    try {
      const articles = await ProcessedArticle.find({
        $and: [
          { cleanText: { $exists: false } },
          { isDuplicate: { $ne: true } },
          { link: { $exists: true, $ne: '' } }
        ]
      })
      .sort({ fetchedAt: 1 })
      .limit(100); // Process up to 100 articles at a time

      if (articles.length === 0) {
        return { extracted: 0, skipped: 0, failed: 0 };
      }

      logger.info(`Extracting content for ${articles.length} articles...`);

      let extracted = 0;
      let skipped = 0;
      let failed = 0;

      // Process in batches
      const batches = [];
      for (let i = 0; i < articles.length; i += this.config.contentExtractionBatchSize) {
        batches.push(articles.slice(i, i + this.config.contentExtractionBatchSize));
      }

      for (const batch of batches) {
        const batchResults = await contentExtractor.batchExtractContent(
          batch.map(article => article.link),
          this.config.maxConcurrentContentExtraction
        );

        // Update articles with extracted content
        for (let i = 0; i < batch.length; i++) {
          const article = batch[i];
          const result = batchResults[i];

          try {
            const updateData = {
              contentStatus: result.status || 'failed',
              processedAt: new Date()
            };

            if (result.success && result.content) {
              updateData.cleanText = result.content.cleanText;
              updateData.wordCount = result.content.wordCount;
              updateData.author = result.content.metadata?.author;
              updateData.language = result.content.metadata?.language || 'en';
              updateData.images = result.content.metadata?.images || [];
              
              // Update published date if extracted
              if (result.content.metadata?.publishedAt) {
                updateData.publishedAt = result.content.metadata.publishedAt;
              }

              extracted++;
            } else {
              updateData.contentStatus = 'failed';
              failed++;
            }

            await ProcessedArticle.findByIdAndUpdate(article._id, updateData);

          } catch (updateError) {
            logger.error(`Error updating article ${article._id}:`, updateError.message);
            failed++;
          }
        }

        // Add delay between batches
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      return { extracted, skipped, failed };

    } catch (error) {
      logger.error('Error in content extraction:', error.message);
      return { extracted: 0, skipped: 0, failed: 0, error: error.message };
    }
  }

  /**
   * Enrich metadata for articles that need it
   */
  async enrichMetadataForNewArticles() {
    try {
      const articles = await ProcessedArticle.find({
        $and: [
          { extractedEntities: { $exists: false } },
          { isDuplicate: { $ne: true } },
          { $or: [
            { cleanText: { $exists: true, $ne: '' } },
            { snippet: { $exists: true, $ne: '' } }
          ]}
        ]
      })
      .sort({ fetchedAt: 1 })
      .limit(50); // Process up to 50 articles at a time

      if (articles.length === 0) {
        return { enriched: 0, skipped: 0, failed: 0 };
      }

      logger.info(`Enriching metadata for ${articles.length} articles...`);

      let enriched = 0;
      let skipped = 0;
      let failed = 0;

      for (const article of articles) {
        try {
          const enrichedData = await metadataEnricher.enrichMetadata(article);
          
          const updateData = {
            extractedEntities: enrichedData.extractedEntities,
            topics: enrichedData.topics,
            readingTime: enrichedData.readingTime,
            sentimentIndicators: enrichedData.sentimentIndicators,
            locations: enrichedData.locations,
            dates: enrichedData.dates,
            products: enrichedData.products,
            wordCount: enrichedData.wordCount,
            language: enrichedData.language,
            images: enrichedData.images
          };

          await ProcessedArticle.findByIdAndUpdate(article._id, updateData);
          enriched++;

        } catch (error) {
          logger.error(`Error enriching article ${article._id}:`, error.message);
          failed++;
        }
      }

      return { enriched, skipped, failed };

    } catch (error) {
      logger.error('Error in metadata enrichment:', error.message);
      return { enriched: 0, skipped: 0, failed: 0, error: error.message };
    }
  }

  /**
   * Run deduplication check on recent articles
   */
  async runDeduplicationCheck() {
    try {
      logger.info('Running deduplication check...');

      // Find articles from the last 24 hours that haven't been checked for duplicates
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const articles = await ProcessedArticle.find({
        $and: [
          { fetchedAt: { $gte: cutoffDate } },
          { isDuplicate: { $exists: false } },
          { canonicalUrl: { $exists: true } }
        ]
      })
      .limit(100);

      let duplicatesFound = 0;

      for (const article of articles) {
        try {
          const duplicateCheck = await deduplicationService.isDuplicate(article);
          
          if (duplicateCheck.isDuplicate) {
            await ProcessedArticle.findByIdAndUpdate(article._id, {
              isDuplicate: true,
              duplicateReason: duplicateCheck.reason
            });
            duplicatesFound++;
          } else {
            // Update fingerprints
            await ProcessedArticle.findByIdAndUpdate(article._id, {
              canonicalUrl: duplicateCheck.canonicalUrl,
              titleFingerprint: duplicateCheck.titleFingerprint,
              contentFingerprint: duplicateCheck.contentFingerprint
            });
          }

        } catch (error) {
          logger.error(`Error checking duplicate for article ${article._id}:`, error.message);
        }
      }

      logger.info(`Deduplication check completed: ${duplicatesFound} duplicates found`);
      return { duplicatesFound, checked: articles.length };

    } catch (error) {
      logger.error('Error in deduplication check:', error.message);
      return { duplicatesFound: 0, checked: 0, error: error.message };
    }
  }

  /**
   * Get pipeline status and statistics
   */
  async getPipelineStatus() {
    try {
      const [
        totalArticles,
        processedArticles,
        pendingArticles,
        duplicateArticles,
        reviewRequired,
        lastIngestion,
        sourceStats
      ] = await Promise.all([
        ProcessedArticle.countDocuments(),
        ProcessedArticle.countDocuments({ gptStatus: 'processed' }),
        ProcessedArticle.countDocuments({ gptStatus: 'pending' }),
        ProcessedArticle.countDocuments({ isDuplicate: true }),
        ProcessedArticle.countDocuments({ requiresReview: true }),
        ProcessedArticle.findOne().sort({ fetchedAt: -1 }).select('fetchedAt'),
        ProcessedArticle.aggregate([
          { $group: { _id: '$sourceId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
      ]);

      return {
        isRunning: this.isRunning,
        statistics: {
          totalArticles,
          processedArticles,
          pendingArticles,
          duplicateArticles,
          reviewRequired,
          processingRate: totalArticles > 0 ? (processedArticles / totalArticles) * 100 : 0
        },
        lastActivity: lastIngestion?.fetchedAt,
        topSources: sourceStats,
        config: this.config
      };

    } catch (error) {
      logger.error('Error getting pipeline status:', error.message);
      return null;
    }
  }

  /**
   * Clean up old data
   */
  async cleanupOldData() {
    try {
      logger.info('Cleaning up old data...');

      // Remove old duplicates (older than 30 days)
      const duplicateCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const duplicateResult = await ProcessedArticle.deleteMany({
        isDuplicate: true,
        fetchedAt: { $lt: duplicateCutoff }
      });

      // Remove articles with failed content extraction (older than 7 days)
      const failedCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const failedResult = await ProcessedArticle.deleteMany({
        contentStatus: 'failed',
        fetchedAt: { $lt: failedCutoff }
      });

      logger.info(`Cleanup completed: ${duplicateResult.deletedCount} duplicates, ${failedResult.deletedCount} failed articles removed`);

      return {
        duplicatesRemoved: duplicateResult.deletedCount,
        failedRemoved: failedResult.deletedCount
      };

    } catch (error) {
      logger.error('Error in cleanup:', error.message);
      return { duplicatesRemoved: 0, failedRemoved: 0, error: error.message };
    }
  }
}

module.exports = new NewsIngestionPipeline();
