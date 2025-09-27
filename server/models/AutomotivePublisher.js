const mongoose = require('mongoose');

const automotivePublisherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  website: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid website URL format'
    }
  },
  rssFeed: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid RSS feed URL format'
    },
    index: true
  },
  logo: String,
  description: String,
  
  // Geographic and Language Info
  region: {
    type: String,
    default: 'global',
    index: true
  },
  language: {
    type: String,
    default: 'en',
    index: true
  },
  
  // Quality Metrics
  credibility: {
    type: Number,
    min: 1,
    max: 10,
    default: 5,
    index: true
  },
  automotiveFocus: {
    type: Number,
    min: 1,
    max: 10,
    default: 5,
    index: true
  },
  specialties: [{
    type: String
  }],
  
  // Operational Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastChecked: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Performance Statistics
  stats: {
    totalArticles: {
      type: Number,
      default: 0,
      min: 0
    },
    errorCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastError: String,
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageResponseTime: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Configuration
  scrapeInterval: {
    type: Number,
    default: 3600000, // 1 hour in milliseconds
    min: 300000 // Minimum 5 minutes
  },
  maxArticlesPerFetch: {
    type: Number,
    default: 10,
    min: 1,
    max: 50
  },
  
  // Contact Information
  contact: {
    email: String,
    socialMedia: {
      twitter: String,
      facebook: String,
      linkedin: String
    }
  }
}, {
  timestamps: true,
  collection: 'automotive_publishers'
});

// Indexes for efficient queries
automotivePublisherSchema.index({ isActive: 1, lastChecked: -1 });
automotivePublisherSchema.index({ region: 1, isActive: 1 });
automotivePublisherSchema.index({ credibility: -1, automotiveFocus: -1 });
automotivePublisherSchema.index({ 'stats.successRate': -1 });

// Text search index
automotivePublisherSchema.index({
  name: 'text',
  description: 'text',
  specialties: 'text'
});

// Pre-save middleware to calculate success rate
automotivePublisherSchema.pre('save', function(next) {
  if (this.stats.totalArticles > 0) {
    this.stats.successRate = ((this.stats.totalArticles - this.stats.errorCount) / this.stats.totalArticles) * 100;
  }
  next();
});

// Instance methods
automotivePublisherSchema.methods.incrementArticleCount = function() {
  this.stats.totalArticles += 1;
  return this.save();
};

automotivePublisherSchema.methods.incrementErrorCount = function(errorMessage) {
  this.stats.errorCount += 1;
  this.stats.lastError = errorMessage;
  this.lastChecked = new Date();
  return this.save();
};

automotivePublisherSchema.methods.updateSuccessRate = function() {
  if (this.stats.totalArticles > 0) {
    this.stats.successRate = ((this.stats.totalArticles - this.stats.errorCount) / this.stats.totalArticles) * 100;
  }
  return this.save();
};

// Static methods
automotivePublisherSchema.statics.getActivePublishers = function() {
  return this.find({ isActive: true }).sort({ 'stats.successRate': -1, credibility: -1 });
};

automotivePublisherSchema.statics.getPublishersByRegion = function(region) {
  return this.find({ region, isActive: true }).sort({ credibility: -1 });
};

automotivePublisherSchema.statics.getTopPublishers = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ credibility: -1, 'stats.successRate': -1 })
    .limit(limit);
};

module.exports = mongoose.model('AutomotivePublisher', automotivePublisherSchema);