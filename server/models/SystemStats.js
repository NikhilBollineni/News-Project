const mongoose = require('mongoose');

const systemStatsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  // Article Processing Metrics
  articles: {
    total: {
      type: Number,
      default: 0,
      min: 0
    },
    processed: {
      type: Number,
      default: 0,
      min: 0
    },
    failed: {
      type: Number,
      default: 0,
      min: 0
    },
    pending: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Feed Processing Metrics
  feeds: {
    active: {
      type: Number,
      default: 0,
      min: 0
    },
    failed: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      default: 0,
      min: 0
    },
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // AI Processing Metrics
  ai: {
    requests: {
      type: Number,
      default: 0,
      min: 0
    },
    processingTime: {
      type: Number,
      default: 0,
      min: 0
    },
    averageProcessingTime: {
      type: Number,
      default: 0,
      min: 0
    },
    tokensUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    cost: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // User Engagement Metrics
  users: {
    active: {
      type: Number,
      default: 0,
      min: 0
    },
    new: {
      type: Number,
      default: 0,
      min: 0
    },
    sessions: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // API Usage Metrics
  api: {
    requests: {
      type: Number,
      default: 0,
      min: 0
    },
    errors: {
      type: Number,
      default: 0,
      min: 0
    },
    responseTime: {
      type: Number,
      default: 0,
      min: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // System Health Metrics
  system: {
    uptime: {
      type: Number,
      default: 0,
      min: 0
    },
    memoryUsage: {
      type: Number,
      default: 0,
      min: 0
    },
    cpuUsage: {
      type: Number,
      default: 0,
      min: 0
    },
    diskUsage: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Error Tracking
  errors: {
    database: {
      type: Number,
      default: 0,
      min: 0
    },
    network: {
      type: Number,
      default: 0,
      min: 0
    },
    ai: {
      type: Number,
      default: 0,
      min: 0
    },
    scraping: {
      type: Number,
      default: 0,
      min: 0
    },
    validation: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Performance Metrics
  performance: {
    averageScrapeTime: {
      type: Number,
      default: 0,
      min: 0
    },
    averageProcessingTime: {
      type: Number,
      default: 0,
      min: 0
    },
    throughput: {
      type: Number,
      default: 0,
      min: 0
    }
  }
}, {
  timestamps: true,
  collection: 'system_stats'
});

// Indexes
systemStatsSchema.index({ date: -1 });
systemStatsSchema.index({ 'articles.total': -1 });
systemStatsSchema.index({ 'feeds.successRate': -1 });

// Pre-save middleware to calculate derived metrics
systemStatsSchema.pre('save', function(next) {
  // Calculate feed success rate
  if (this.feeds.total > 0) {
    this.feeds.successRate = ((this.feeds.active) / this.feeds.total) * 100;
  }
  
  // Calculate average AI processing time
  if (this.ai.requests > 0) {
    this.ai.averageProcessingTime = this.ai.processingTime / this.ai.requests;
  }
  
  // Calculate average API response time
  if (this.api.requests > 0) {
    this.api.averageResponseTime = this.api.responseTime / this.api.requests;
  }
  
  // Calculate throughput (articles per hour)
  const hoursSinceStart = (Date.now() - new Date(this.date).setHours(0, 0, 0, 0)) / (1000 * 60 * 60);
  if (hoursSinceStart > 0) {
    this.performance.throughput = this.articles.processed / hoursSinceStart;
  }
  
  next();
});

// Static methods
systemStatsSchema.statics.getDailyStats = function(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.findOne({
    date: { $gte: startOfDay, $lte: endOfDay }
  });
};

systemStatsSchema.statics.getWeeklyStats = function(startDate) {
  const startOfWeek = new Date(startDate);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startDate);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return this.find({
    date: { $gte: startOfWeek, $lte: endOfWeek }
  }).sort({ date: 1 });
};

systemStatsSchema.statics.getMonthlyStats = function(year, month) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
  
  return this.find({
    date: { $gte: startOfMonth, $lte: endOfMonth }
  }).sort({ date: 1 });
};

systemStatsSchema.statics.getLatestStats = function() {
  return this.findOne().sort({ date: -1 });
};

// Instance methods
systemStatsSchema.methods.incrementArticleProcessed = function() {
  this.articles.processed += 1;
  this.articles.total += 1;
  return this.save();
};

systemStatsSchema.methods.incrementArticleFailed = function() {
  this.articles.failed += 1;
  this.articles.total += 1;
  return this.save();
};

systemStatsSchema.methods.incrementAIRequest = function(processingTime, tokensUsed) {
  this.ai.requests += 1;
  this.ai.processingTime += processingTime;
  this.ai.tokensUsed += tokensUsed;
  return this.save();
};

systemStatsSchema.methods.incrementAPIRequest = function(responseTime) {
  this.api.requests += 1;
  this.api.responseTime += responseTime;
  return this.save();
};

systemStatsSchema.methods.incrementError = function(errorType) {
  if (this.errors[errorType] !== undefined) {
    this.errors[errorType] += 1;
  }
  return this.save();
};

module.exports = mongoose.model('SystemStats', systemStatsSchema);
