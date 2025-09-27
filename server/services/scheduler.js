const cron = require('node-cron');
const RSSScraper = require('./rssScraper');
const logger = require('../utils/logger');

class Scheduler {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.nextRun = null;
  }

  start() {
    if (this.isRunning) {
      logger.info('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    logger.info('🕐 Starting RSS scraping scheduler');

    // Run every 30 minutes
    this.task = cron.schedule('*/30 * * * *', async () => {
      await this.runScraping();
    }, {
      scheduled: false
    });

    // Start the task
    this.task.start();
    
    // Run immediately on startup
    this.runScraping();

    logger.info('✅ Scheduler started - RSS scraping every 30 minutes');
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.isRunning = false;
      logger.info('🛑 Scheduler stopped');
    }
  }

  async runScraping() {
    if (this.isRunning && this.lastRun && (Date.now() - this.lastRun) < 5 * 60 * 1000) {
      logger.info('⏭️ Skipping scraping - last run was less than 5 minutes ago');
      return;
    }

    try {
      this.lastRun = Date.now();
      logger.info('🔄 Starting scheduled RSS scraping...');
      
      const startTime = Date.now();
      await RSSScraper.processAllFeeds();
      
      const duration = Date.now() - startTime;
      logger.info(`✅ RSS scraping completed in ${duration}ms`);
      
      // Update next run time
      this.nextRun = new Date(Date.now() + 30 * 60 * 1000);
      
    } catch (error) {
      logger.error('❌ Error during scheduled scraping:', error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun: this.nextRun,
      uptime: process.uptime()
    };
  }
}

module.exports = new Scheduler();
