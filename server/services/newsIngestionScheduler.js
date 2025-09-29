const cron = require('node-cron');
const newsIngestionPipeline = require('./newsIngestionPipeline');
const newsFetcher = require('./newsFetcher');
const gptProcessor = require('./gptProcessor');
const deduplicationService = require('./deduplicationService');
const logger = require('../utils/logger');

class NewsIngestionScheduler {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
    this.config = {
      // Default schedules
      fullPipelineSchedule: process.env.FULL_PIPELINE_SCHEDULE || '0 */6 * * *', // Every 6 hours
      quickIngestionSchedule: process.env.QUICK_INGESTION_SCHEDULE || '*/2 * * * *', // Every 2 minutes
      gptProcessingSchedule: process.env.GPT_PROCESSING_SCHEDULE || '0 */2 * * *', // Every 2 hours
      deduplicationSchedule: process.env.DEDUPLICATION_SCHEDULE || '0 2 * * *', // Daily at 2 AM
      cleanupSchedule: process.env.CLEANUP_SCHEDULE || '0 3 * * 0', // Weekly on Sunday at 3 AM
      
      // Job settings
      maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS) || 1,
      jobTimeout: parseInt(process.env.JOB_TIMEOUT) || 30 * 60 * 1000, // 30 minutes
      retryAttempts: parseInt(process.env.JOB_RETRY_ATTEMPTS) || 3,
      retryDelay: parseInt(process.env.JOB_RETRY_DELAY) || 5 * 60 * 1000, // 5 minutes
    };
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    logger.info('Starting news ingestion scheduler...');

    // Full pipeline job (comprehensive ingestion)
    this.addJob('fullPipeline', this.config.fullPipelineSchedule, () => {
      return this.runJob('Full Pipeline', () => newsIngestionPipeline.runFullPipeline());
    });

    // Quick ingestion job (just fetch RSS feeds)
    this.addJob('quickIngestion', this.config.quickIngestionSchedule, () => {
      console.log('🕐 Quick Ingestion job triggered at:', new Date().toISOString());
      return this.runJob('Quick Ingestion', async () => {
        const RSSScraper = require('./rssScraper');
        return await RSSScraper.processAllFeeds();
      });
    });

    // GPT processing job
    this.addJob('gptProcessing', this.config.gptProcessingSchedule, () => {
      return this.runJob('GPT Processing', () => gptProcessor.processUnprocessedArticles(100));
    });

    // Deduplication job
    this.addJob('deduplication', this.config.deduplicationSchedule, () => {
      return this.runJob('Deduplication', () => newsIngestionPipeline.runDeduplicationCheck());
    });

    // Cleanup job
    this.addJob('cleanup', this.config.cleanupSchedule, () => {
      return this.runJob('Cleanup', () => newsIngestionPipeline.cleanupOldData());
    });

    this.isRunning = true;
    logger.info(`Scheduler started with ${this.jobs.size} jobs`);
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Scheduler is not running');
      return;
    }

    logger.info('Stopping news ingestion scheduler...');

    for (const [jobName, job] of this.jobs) {
      job.destroy();
      logger.info(`Stopped job: ${jobName}`);
    }

    this.jobs.clear();
    this.isRunning = false;
    logger.info('Scheduler stopped');
  }

  /**
   * Add a new scheduled job
   */
  addJob(name, schedule, jobFunction) {
    if (this.jobs.has(name)) {
      logger.warn(`Job ${name} already exists, replacing it`);
      this.jobs.get(name).destroy();
    }

    try {
      console.log(`🕐 Setting up job: ${name} with schedule: ${schedule}`);
      const job = cron.schedule(schedule, jobFunction, {
        scheduled: false,
        timezone: process.env.TZ || 'UTC'
      });

      this.jobs.set(name, job);
      job.start();

      logger.info(`Added job: ${name} (schedule: ${schedule})`);
      console.log(`✅ Job ${name} started with schedule: ${schedule}`);
    } catch (error) {
      logger.error(`Error adding job ${name}:`, error.message);
      console.error(`❌ Error setting up job ${name}:`, error.message);
    }
  }

  /**
   * Remove a scheduled job
   */
  removeJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.destroy();
      this.jobs.delete(name);
      logger.info(`Removed job: ${name}`);
    } else {
      logger.warn(`Job ${name} not found`);
    }
  }

  /**
   * Run a job with timeout and error handling
   */
  async runJob(jobName, jobFunction) {
    const startTime = Date.now();
    const jobId = `${jobName}_${Date.now()}`;

    try {
      logger.info(`Starting job: ${jobName} (ID: ${jobId})`);

      // Set timeout for the job
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Job timeout')), this.config.jobTimeout);
      });

      // Run the actual job
      const jobPromise = jobFunction();

      const result = await Promise.race([jobPromise, timeoutPromise]);
      const duration = Date.now() - startTime;

      logger.info(`Job completed: ${jobName} (ID: ${jobId}) in ${duration}ms`);

      if (result && result.success !== undefined) {
        logger.info(`Job result: ${JSON.stringify(result)}`);
      }

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Job failed: ${jobName} (ID: ${jobId}) after ${duration}ms:`, error.message);

      // Attempt retry if configured
      if (this.shouldRetryJob(jobName)) {
        logger.info(`Retrying job: ${jobName} in ${this.config.retryDelay / 1000} seconds`);
        setTimeout(() => this.runJob(jobName, jobFunction), this.config.retryDelay);
      }

      throw error;
    }
  }

  /**
   * Check if a job should be retried
   */
  shouldRetryJob(jobName) {
    // Implement retry logic based on job type and failure reason
    const retryableJobs = ['fullPipeline', 'quickIngestion', 'gptProcessing'];
    return retryableJobs.includes(jobName);
  }

  /**
   * Get scheduler status and job information
   */
  getStatus() {
    const status = {
      isRunning: this.isRunning,
      totalJobs: this.jobs.size,
      jobs: []
    };

    for (const [name, job] of this.jobs) {
      status.jobs.push({
        name,
        scheduled: job.running,
        nextRun: this.getNextRunTime(name),
        lastRun: this.getLastRunTime(name)
      });
    }

    return status;
  }

  /**
   * Get next run time for a job (approximate)
   */
  getNextRunTime(jobName) {
    // This is a simplified implementation
    // In a real scenario, you'd want to track actual run times
    const now = new Date();
    const schedules = {
      fullPipeline: 6 * 60 * 60 * 1000, // 6 hours
      quickIngestion: 2 * 60 * 1000, // 2 minutes
      gptProcessing: 2 * 60 * 60 * 1000, // 2 hours
      deduplication: 24 * 60 * 60 * 1000, // 24 hours
      cleanup: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    const interval = schedules[jobName];
    if (interval) {
      return new Date(now.getTime() + interval);
    }

    return null;
  }

  /**
   * Get last run time for a job
   */
  getLastRunTime(jobName) {
    // This would ideally be tracked in a database
    // For now, return null as we don't have persistence
    return null;
  }

  /**
   * Manually trigger a job
   */
  async triggerJob(jobName) {
    const jobMap = {
      fullPipeline: () => newsIngestionPipeline.runFullPipeline(),
      quickIngestion: async () => {
        const RSSScraper = require('./rssScraper');
        return await RSSScraper.processAllFeeds();
      },
      gptProcessing: () => gptProcessor.processUnprocessedArticles(100),
      deduplication: () => newsIngestionPipeline.runDeduplicationCheck(),
      cleanup: () => newsIngestionPipeline.cleanupOldData()
    };

    const jobFunction = jobMap[jobName];
    if (!jobFunction) {
      throw new Error(`Unknown job: ${jobName}`);
    }

    return this.runJob(jobName, jobFunction);
  }

  /**
   * Update job schedule
   */
  updateJobSchedule(jobName, newSchedule) {
    const jobMap = {
      fullPipeline: () => newsIngestionPipeline.runFullPipeline(),
      quickIngestion: async () => {
        const RSSScraper = require('./rssScraper');
        return await RSSScraper.processAllFeeds();
      },
      gptProcessing: () => gptProcessor.processUnprocessedArticles(100),
      deduplication: () => newsIngestionPipeline.runDeduplicationCheck(),
      cleanup: () => newsIngestionPipeline.cleanupOldData()
    };

    const jobFunction = jobMap[jobName];
    if (!jobFunction) {
      throw new Error(`Unknown job: ${jobName}`);
    }

    this.removeJob(jobName);
    this.addJob(jobName, newSchedule, () => this.runJob(jobName, jobFunction));
    
    logger.info(`Updated schedule for job ${jobName}: ${newSchedule}`);
  }

  /**
   * Get job statistics
   */
  async getJobStatistics() {
    // This would ideally query a database for job execution history
    // For now, return basic information
    return {
      totalJobs: this.jobs.size,
      runningJobs: Array.from(this.jobs.values()).filter(job => job.running).length,
      scheduledJobs: Array.from(this.jobs.values()).filter(job => job.scheduled).length,
      lastExecution: new Date(), // Would be tracked in database
      averageExecutionTime: 0, // Would be calculated from history
      successRate: 0 // Would be calculated from history
    };
  }
}

module.exports = new NewsIngestionScheduler();
