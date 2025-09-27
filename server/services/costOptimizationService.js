const ProcessedArticle = require('../models/ProcessedArticle');
const logger = require('../utils/logger');

class CostOptimizationService {
  constructor() {
    this.costTracking = {
      gptTokens: 0,
      gptCost: 0,
      apiCalls: 0,
      contentExtractions: 0,
      dailyBudget: parseFloat(process.env.DAILY_BUDGET) || 50.0, // $50 default
      monthlyBudget: parseFloat(process.env.MONTHLY_BUDGET) || 1000.0 // $1000 default
    };
    
    this.optimizationSettings = {
      // GPT optimization
      maxBatchSize: parseInt(process.env.GPT_MAX_BATCH_SIZE) || 10,
      minConfidenceThreshold: parseFloat(process.env.MIN_CONFIDENCE_THRESHOLD) || 0.6,
      useCheaperModel: process.env.USE_CHEAPER_MODEL === 'true',
      cheaperModelThreshold: parseFloat(process.env.CHEAPER_MODEL_THRESHOLD) || 0.8,
      
      // Content extraction optimization
      skipContentExtraction: process.env.SKIP_CONTENT_EXTRACTION === 'true',
      contentExtractionLimit: parseInt(process.env.CONTENT_EXTRACTION_LIMIT) || 500,
      skipPaywalledContent: process.env.SKIP_PAYWALLED_CONTENT === 'true',
      
      // Caching settings
      enableCaching: process.env.ENABLE_CACHING !== 'false',
      cacheTTL: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour
      maxCacheSize: parseInt(process.env.MAX_CACHE_SIZE) || 1000,
      
      // Rate limiting
      maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 3,
      requestDelay: parseInt(process.env.REQUEST_DELAY) || 1000, // 1 second
      
      // Quality thresholds
      minArticleLength: parseInt(process.env.MIN_ARTICLE_LENGTH) || 100,
      maxProcessingRetries: parseInt(process.env.MAX_PROCESSING_RETRIES) || 2
    };
    
    this.cache = new Map();
    this.costHistory = [];
  }

  /**
   * Check if processing should be skipped based on cost controls
   */
  shouldSkipProcessing(article) {
    // Check daily budget
    const todayCost = this.getTodayCost();
    if (todayCost >= this.costTracking.dailyBudget) {
      logger.warn(`Daily budget exceeded: $${todayCost.toFixed(2)} / $${this.costTracking.dailyBudget}`);
      return { skip: true, reason: 'daily_budget_exceeded' };
    }

    // Check monthly budget
    const monthlyCost = this.getMonthlyCost();
    if (monthlyCost >= this.costTracking.monthlyBudget) {
      logger.warn(`Monthly budget exceeded: $${monthlyCost.toFixed(2)} / $${this.costTracking.monthlyBudget}`);
      return { skip: true, reason: 'monthly_budget_exceeded' };
    }

    // Check article quality thresholds
    if (article.cleanText && article.cleanText.length < this.optimizationSettings.minArticleLength) {
      return { skip: true, reason: 'article_too_short' };
    }

    // Skip paywalled content if configured
    if (this.optimizationSettings.skipPaywalledContent && article.contentStatus === 'paywalled') {
      return { skip: true, reason: 'paywalled_content' };
    }

    return { skip: false };
  }

  /**
   * Optimize GPT processing batch
   */
  optimizeGPTBatch(articles) {
    const optimizedBatch = [];
    let estimatedCost = 0;

    for (const article of articles) {
      const skipCheck = this.shouldSkipProcessing(article);
      if (skipCheck.skip) {
        logger.info(`Skipping article ${article._id}: ${skipCheck.reason}`);
        continue;
      }

      // Estimate cost for this article
      const estimatedArticleCost = this.estimateGPTCost(article);
      if (estimatedCost + estimatedArticleCost > this.costTracking.dailyBudget * 0.1) {
        logger.info(`Stopping batch - would exceed 10% of daily budget`);
        break;
      }

      optimizedBatch.push(article);
      estimatedCost += estimatedArticleCost;
    }

    logger.info(`Optimized GPT batch: ${optimizedBatch.length}/${articles.length} articles, estimated cost: $${estimatedCost.toFixed(4)}`);
    return optimizedBatch;
  }

  /**
   * Estimate GPT processing cost for an article
   */
  estimateGPTCost(article) {
    // Rough estimation based on content length
    const contentLength = (article.cleanText || article.snippet || '').length;
    const titleLength = (article.title || '').length;
    
    // Estimate tokens (rough: 1 token ≈ 4 characters)
    const estimatedTokens = Math.ceil((contentLength + titleLength) / 4);
    
    // GPT-3.5-turbo pricing (as of 2023)
    const costPer1kTokens = this.optimizationSettings.useCheaperModel ? 0.0005 : 0.002;
    
    return (estimatedTokens / 1000) * costPer1kTokens;
  }

  /**
   * Track GPT usage and cost
   */
  trackGPTUsage(tokenUsage, actualCost) {
    this.costTracking.gptTokens += tokenUsage.total_tokens || 0;
    this.costTracking.gptCost += actualCost;
    this.costTracking.apiCalls += 1;

    // Log cost tracking
    logger.info(`GPT Usage - Tokens: ${this.costTracking.gptTokens}, Cost: $${this.costTracking.gptCost.toFixed(4)}, API Calls: ${this.costTracking.apiCalls}`);

    // Add to cost history
    this.costHistory.push({
      timestamp: new Date(),
      type: 'gpt_processing',
      tokens: tokenUsage.total_tokens || 0,
      cost: actualCost,
      tokensPerCall: tokenUsage.total_tokens || 0
    });

    // Clean up old history (keep last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.costHistory = this.costHistory.filter(entry => entry.timestamp > thirtyDaysAgo);
  }

  /**
   * Track content extraction usage
   */
  trackContentExtraction(success) {
    this.costTracking.contentExtractions += 1;
    
    if (success) {
      logger.debug(`Content extraction successful: ${this.costTracking.contentExtractions}`);
    }
  }

  /**
   * Get today's cost
   */
  getTodayCost() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.costHistory
      .filter(entry => entry.timestamp >= today)
      .reduce((sum, entry) => sum + entry.cost, 0);
  }

  /**
   * Get this month's cost
   */
  getMonthlyCost() {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    return this.costHistory
      .filter(entry => entry.timestamp >= firstDayOfMonth)
      .reduce((sum, entry) => sum + entry.cost, 0);
  }

  /**
   * Get cost statistics
   */
  getCostStatistics() {
    const todayCost = this.getTodayCost();
    const monthlyCost = this.getMonthlyCost();
    const avgCostPerDay = this.costHistory.length > 0 
      ? this.costHistory.reduce((sum, entry) => sum + entry.cost, 0) / 30 
      : 0;

    return {
      today: {
        cost: todayCost,
        budget: this.costTracking.dailyBudget,
        percentage: (todayCost / this.costTracking.dailyBudget) * 100,
        remaining: this.costTracking.dailyBudget - todayCost
      },
      monthly: {
        cost: monthlyCost,
        budget: this.costTracking.monthlyBudget,
        percentage: (monthlyCost / this.costTracking.monthlyBudget) * 100,
        remaining: this.costTracking.monthlyBudget - monthlyCost
      },
      totals: {
        gptTokens: this.costTracking.gptTokens,
        gptCost: this.costTracking.gptCost,
        apiCalls: this.costTracking.apiCalls,
        contentExtractions: this.costTracking.contentExtractions
      },
      averages: {
        costPerDay: avgCostPerDay,
        costPerArticle: this.costTracking.gptCost / Math.max(this.costTracking.apiCalls, 1),
        tokensPerCall: this.costTracking.gptTokens / Math.max(this.costTracking.apiCalls, 1)
      },
      projections: {
        dailyBudgetRemaining: Math.max(0, this.costTracking.dailyBudget - todayCost),
        monthlyBudgetRemaining: Math.max(0, this.costTracking.monthlyBudget - monthlyCost),
        daysRemainingInMonth: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate(),
        estimatedMonthlyTotal: monthlyCost + (avgCostPerDay * (new Date().getDate()))
      }
    };
  }

  /**
   * Cache management
   */
  setCache(key, value, ttl = this.optimizationSettings.cacheTTL) {
    if (!this.optimizationSettings.enableCaching) return;

    // Clean up expired cache entries
    this.cleanupCache();

    // Check cache size limit
    if (this.cache.size >= this.optimizationSettings.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const expiry = Date.now() + (ttl * 1000);
    this.cache.set(key, { value, expiry });
  }

  getCache(key) {
    if (!this.optimizationSettings.enableCaching) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  cleanupCache() {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Apply rate limiting
   */
  async applyRateLimit() {
    if (this.optimizationSettings.requestDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.optimizationSettings.requestDelay));
    }
  }

  /**
   * Optimize article processing based on quality and cost
   */
  optimizeArticleProcessing(article) {
    const optimizations = {
      skipContentExtraction: false,
      skipGPTProcessing: false,
      useCheaperModel: false,
      reason: null
    };

    // Check if content extraction should be skipped
    if (this.optimizationSettings.skipContentExtraction) {
      optimizations.skipContentExtraction = true;
      optimizations.reason = 'content_extraction_disabled';
    }

    // Check article length
    if (article.snippet && article.snippet.length < this.optimizationSettings.minArticleLength) {
      optimizations.skipGPTProcessing = true;
      optimizations.reason = 'article_too_short';
    }

    // Check if cheaper model should be used
    if (this.optimizationSettings.useCheaperModel) {
      // Use cheaper model for articles that are likely to be processed successfully
      optimizations.useCheaperModel = true;
    }

    return optimizations;
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations() {
    const stats = this.getCostStatistics();
    const recommendations = [];

    // Daily budget recommendations
    if (stats.today.percentage > 80) {
      recommendations.push({
        type: 'budget',
        severity: 'high',
        message: `Daily budget is ${stats.today.percentage.toFixed(1)}% used. Consider reducing processing frequency.`,
        action: 'reduce_processing_frequency'
      });
    }

    // Monthly budget recommendations
    if (stats.monthly.percentage > 70) {
      recommendations.push({
        type: 'budget',
        severity: 'medium',
        message: `Monthly budget is ${stats.monthly.percentage.toFixed(1)}% used. Monitor spending closely.`,
        action: 'monitor_monthly_spending'
      });
    }

    // Cost per article recommendations
    if (stats.averages.costPerArticle > 0.05) {
      recommendations.push({
        type: 'efficiency',
        severity: 'medium',
        message: `Cost per article is high ($${stats.averages.costPerArticle.toFixed(4)}). Consider using cheaper models or reducing batch sizes.`,
        action: 'optimize_gpt_usage'
      });
    }

    // Token efficiency recommendations
    if (stats.averages.tokensPerCall > 2000) {
      recommendations.push({
        type: 'efficiency',
        severity: 'low',
        message: `High token usage per call (${stats.averages.tokensPerCall.toFixed(0)} tokens). Consider shorter prompts.`,
        action: 'optimize_prompts'
      });
    }

    return recommendations;
  }

  /**
   * Update optimization settings
   */
  updateOptimizationSettings(newSettings) {
    this.optimizationSettings = { ...this.optimizationSettings, ...newSettings };
    logger.info('Updated optimization settings:', newSettings);
  }

  /**
   * Reset cost tracking (for testing or manual reset)
   */
  resetCostTracking() {
    this.costTracking.gptTokens = 0;
    this.costTracking.gptCost = 0;
    this.costTracking.apiCalls = 0;
    this.costTracking.contentExtractions = 0;
    this.costHistory = [];
    logger.info('Cost tracking reset');
  }
}

module.exports = new CostOptimizationService();
