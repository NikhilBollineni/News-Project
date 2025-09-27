const ProcessedArticle = require('../models/ProcessedArticle');
const NewsSource = require('../models/NewsSource');
const IngestionLog = require('../models/IngestionLog');
const newsIngestionPipeline = require('./newsIngestionPipeline');
const newsIngestionScheduler = require('./newsIngestionScheduler');
const logger = require('../utils/logger');

class MonitoringService {
  constructor() {
    this.metrics = {
      lastHealthCheck: null,
      systemHealth: 'unknown',
      alerts: []
    };
    
    this.thresholds = {
      // Health check thresholds
      maxIngestionDelay: 24 * 60 * 60 * 1000, // 24 hours
      minHealthySourcesRatio: 0.7, // 70% of sources should be healthy
      maxErrorRate: 0.3, // 30% error rate
      minProcessingRate: 0.8, // 80% of articles should be processed
      
      // Performance thresholds
      maxResponseTime: 30000, // 30 seconds
      minArticlesPerHour: 10, // Minimum articles per hour
      maxGPTFailureRate: 0.2, // 20% GPT failure rate
      
      // Resource thresholds
      maxDatabaseSize: 10 * 1024 * 1024 * 1024, // 10GB
      maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
      maxCPUUsage: 80 // 80%
    };
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const startTime = Date.now();
    const healthCheck = {
      timestamp: new Date(),
      status: 'healthy',
      checks: {},
      metrics: {},
      alerts: []
    };

    try {
      // Check database connectivity
      healthCheck.checks.database = await this.checkDatabaseHealth();
      
      // Check ingestion pipeline
      healthCheck.checks.ingestion = await this.checkIngestionHealth();
      
      // Check source health
      healthCheck.checks.sources = await this.checkSourceHealth();
      
      // Check processing pipeline
      healthCheck.checks.processing = await this.checkProcessingHealth();
      
      // Check system resources
      healthCheck.checks.resources = await this.checkResourceHealth();
      
      // Check scheduler status
      healthCheck.checks.scheduler = await this.checkSchedulerHealth();

      // Calculate overall health status
      healthCheck.status = this.calculateOverallHealth(healthCheck.checks);
      
      // Get system metrics
      healthCheck.metrics = await this.getSystemMetrics();
      
      // Generate alerts
      healthCheck.alerts = this.generateAlerts(healthCheck.checks, healthCheck.metrics);

      this.metrics.lastHealthCheck = healthCheck;
      this.metrics.systemHealth = healthCheck.status;
      this.metrics.alerts = healthCheck.alerts;

      const duration = Date.now() - startTime;
      logger.info(`Health check completed in ${duration}ms - Status: ${healthCheck.status}`);

      return healthCheck;

    } catch (error) {
      logger.error('Health check failed:', error.message);
      
      healthCheck.status = 'unhealthy';
      healthCheck.error = error.message;
      
      this.metrics.lastHealthCheck = healthCheck;
      this.metrics.systemHealth = 'unhealthy';
      
      return healthCheck;
    }
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    try {
      const startTime = Date.now();
      
      // Test basic database operations
      const articleCount = await ProcessedArticle.countDocuments();
      const sourceCount = await NewsSource.countDocuments();
      const logCount = await IngestionLog.countDocuments();
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < this.thresholds.maxResponseTime ? 'healthy' : 'degraded',
        responseTime,
        metrics: {
          articleCount,
          sourceCount,
          logCount
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Check ingestion health
   */
  async checkIngestionHealth() {
    try {
      // Check last successful ingestion
      const lastIngestion = await IngestionLog.findOne({ status: 'completed' })
        .sort({ completedAt: -1 });
      
      const timeSinceLastIngestion = lastIngestion 
        ? Date.now() - lastIngestion.completedAt.getTime()
        : Infinity;
      
      // Check recent ingestion success rate
      const recentLogs = await IngestionLog.find({
        startedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      
      const successCount = recentLogs.filter(log => log.status === 'completed').length;
      const successRate = recentLogs.length > 0 ? successCount / recentLogs.length : 1;
      
      let status = 'healthy';
      if (timeSinceLastIngestion > this.thresholds.maxIngestionDelay) {
        status = 'unhealthy';
      } else if (successRate < this.thresholds.minProcessingRate) {
        status = 'degraded';
      }
      
      return {
        status,
        metrics: {
          timeSinceLastIngestion,
          successRate,
          recentIngestions: recentLogs.length,
          lastIngestionTime: lastIngestion?.completedAt
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Check source health
   */
  async checkSourceHealth() {
    try {
      const sources = await NewsSource.find({ isActive: true });
      
      const healthySources = sources.filter(source => source.isHealthy).length;
      const healthyRatio = sources.length > 0 ? healthySources / sources.length : 1;
      
      const errorSources = sources.filter(source => source.errorCount > 5).length;
      const errorRate = sources.length > 0 ? errorSources / sources.length : 0;
      
      let status = 'healthy';
      if (healthyRatio < this.thresholds.minHealthySourcesRatio) {
        status = 'unhealthy';
      } else if (errorRate > this.thresholds.maxErrorRate) {
        status = 'degraded';
      }
      
      return {
        status,
        metrics: {
          totalSources: sources.length,
          healthySources,
          healthyRatio,
          errorRate,
          sourcesWithErrors: errorSources
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Check processing health
   */
  async checkProcessingHealth() {
    try {
      const totalArticles = await ProcessedArticle.countDocuments();
      const processedArticles = await ProcessedArticle.countDocuments({ gptStatus: 'processed' });
      const pendingArticles = await ProcessedArticle.countDocuments({ gptStatus: 'pending' });
      const failedArticles = await ProcessedArticle.countDocuments({ gptStatus: 'failed' });
      
      const processingRate = totalArticles > 0 ? processedArticles / totalArticles : 1;
      const failureRate = totalArticles > 0 ? failedArticles / totalArticles : 0;
      
      // Check recent processing rate
      const recentArticles = await ProcessedArticle.find({
        fetchedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      });
      
      const articlesPerHour = recentArticles.length;
      
      let status = 'healthy';
      if (processingRate < this.thresholds.minProcessingRate) {
        status = 'degraded';
      }
      if (failureRate > this.thresholds.maxGPTFailureRate || articlesPerHour < this.thresholds.minArticlesPerHour) {
        status = 'unhealthy';
      }
      
      return {
        status,
        metrics: {
          totalArticles,
          processedArticles,
          pendingArticles,
          failedArticles,
          processingRate,
          failureRate,
          articlesPerHour
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Check resource health
   */
  async checkResourceHealth() {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // Basic resource monitoring
      const memoryUsageMB = memUsage.heapUsed / 1024 / 1024;
      const memoryLimitMB = this.thresholds.maxMemoryUsage / 1024 / 1024;
      const memoryRatio = memoryUsageMB / memoryLimitMB;
      
      let status = 'healthy';
      if (memoryRatio > 0.9) {
        status = 'unhealthy';
      } else if (memoryRatio > 0.7) {
        status = 'degraded';
      }
      
      return {
        status,
        metrics: {
          memoryUsageMB: Math.round(memoryUsageMB),
          memoryLimitMB,
          memoryRatio: Math.round(memoryRatio * 100) / 100,
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024)
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Check scheduler health
   */
  async checkSchedulerHealth() {
    try {
      const schedulerStatus = newsIngestionScheduler.getStatus();
      
      return {
        status: schedulerStatus.isRunning ? 'healthy' : 'unhealthy',
        metrics: {
          isRunning: schedulerStatus.isRunning,
          totalJobs: schedulerStatus.totalJobs,
          jobs: schedulerStatus.jobs
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Calculate overall health status
   */
  calculateOverallHealth(checks) {
    const statuses = Object.values(checks).map(check => check.status);
    
    if (statuses.includes('unhealthy')) {
      return 'unhealthy';
    }
    
    if (statuses.includes('degraded')) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics() {
    try {
      const [
        totalArticles,
        recentArticles,
        industryStats,
        categoryStats,
        sourceStats
      ] = await Promise.all([
        ProcessedArticle.countDocuments(),
        ProcessedArticle.countDocuments({
          fetchedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }),
        ProcessedArticle.aggregate([
          { $group: { _id: '$industry', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        ProcessedArticle.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        ProcessedArticle.aggregate([
          { $group: { _id: '$sourceId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
      ]);

      return {
        totalArticles,
        recentArticles,
        industryDistribution: industryStats,
        categoryDistribution: categoryStats,
        topSources: sourceStats,
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform
      };
    } catch (error) {
      logger.error('Error getting system metrics:', error.message);
      return {};
    }
  }

  /**
   * Generate alerts based on health checks and metrics
   */
  generateAlerts(checks, metrics) {
    const alerts = [];

    // Check for critical issues
    if (checks.database?.status === 'unhealthy') {
      alerts.push({
        level: 'critical',
        message: 'Database is unhealthy',
        component: 'database'
      });
    }

    if (checks.ingestion?.status === 'unhealthy') {
      alerts.push({
        level: 'critical',
        message: 'Ingestion pipeline is not working',
        component: 'ingestion'
      });
    }

    if (checks.sources?.status === 'unhealthy') {
      alerts.push({
        level: 'warning',
        message: 'Multiple news sources are failing',
        component: 'sources'
      });
    }

    if (checks.processing?.status === 'unhealthy') {
      alerts.push({
        level: 'warning',
        message: 'GPT processing is failing',
        component: 'processing'
      });
    }

    if (checks.resources?.status === 'unhealthy') {
      alerts.push({
        level: 'critical',
        message: 'System resources are critically low',
        component: 'resources'
      });
    }

    if (!checks.scheduler?.isRunning) {
      alerts.push({
        level: 'critical',
        message: 'Scheduler is not running',
        component: 'scheduler'
      });
    }

    return alerts;
  }

  /**
   * Get current monitoring status
   */
  getMonitoringStatus() {
    return {
      lastHealthCheck: this.metrics.lastHealthCheck,
      systemHealth: this.metrics.systemHealth,
      alerts: this.metrics.alerts,
      thresholds: this.thresholds
    };
  }

  /**
   * Update monitoring thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Updated monitoring thresholds');
  }
}

module.exports = new MonitoringService();
