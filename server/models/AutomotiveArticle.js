const mongoose = require('mongoose');

const automotiveArticleSchema = new mongoose.Schema({
  // Original Content
  originalTitle: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
    index: true
  },
  originalUrl: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    },
    index: true
  },
  originalContent: {
    type: String,
    maxlength: 100000 // Limit content size
  },
  originalSummary: {
    type: String,
    maxlength: 5000
  },
  
  // AI Processed Data
  aiTitle: {
    type: String,
    trim: true,
    maxlength: 300,
    index: true
  },
  aiSummary: {
    type: String,
    maxlength: 1500
  },
  aiCategory: {
    type: String,
    enum: [
      'product-launches', 
      'ev-technology', 
      'manufacturing', 
      'm-and-a', 
      'financials', 
      'regulatory', 
      'market-trends', 
      'competitor-moves', 
      'supply-chain',
      'autonomous',
      'battery-tech',
      'charging-infrastructure',
      'partnerships',
      'safety',
      'environmental',
      'technology'
    ],
    default: 'market-trends',
    index: true
  },
  aiTags: {
    type: [String],
    validate: {
      validator: function(v) {
        return v.length <= 10; // Limit number of tags
      },
      message: 'Too many tags (max 10)'
    }
  },
  aiSentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral', 'Neutral'],
    default: 'neutral',
    index: true
  },
  aiImportance: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
    index: true
  },
  
  // Automotive-Specific Metadata
  automotive: {
    vehicleType: {
      type: String,
      default: 'unknown'
    },
    brand: {
      type: String,
      default: 'Unknown'
    },
    market: {
      type: String,
      default: 'global'
    },
    technology: [{
      type: String
    }],
    region: {
      type: String,
      default: 'global'
    },
    priceRange: {
      type: String,
      default: 'unknown'
    },
    launchDate: Date,
    salesTarget: String
  },
  
  // Publisher Information
  publisher: {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    website: {
      type: String,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Invalid website URL format'
      }
    },
    rssFeed: String,
    logo: String,
    credibility: {
      type: mongoose.Schema.Types.Mixed,
      default: 5
    },
    automotiveFocus: {
      type: mongoose.Schema.Types.Mixed,
      default: 5
    },
    region: {
      type: String,
      enum: ['north-america', 'europe', 'asia', 'south-america', 'africa', 'oceania', 'global', 'other'],
      default: 'global'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  
  // Timestamps
  publishedAt: {
    type: Date,
    required: true,
    index: true
  },
  scrapedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: {
    type: Date,
    default: Date.now
  },
  
  // Legal & Compliance
  copyright: {
    holder: String,
    license: String,
    attribution: String,
    fairUse: {
      type: Boolean,
      default: true
    },
    disclaimer: String
  },
  
  // Engagement
  engagement: {
    views: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  collection: 'automotive_articles'
});

// Compound indexes for better query performance
automotiveArticleSchema.index({ publishedAt: -1, aiCategory: 1 });
automotiveArticleSchema.index({ 'automotive.brand': 1, publishedAt: -1 });
automotiveArticleSchema.index({ 'automotive.technology': 1, publishedAt: -1 });
automotiveArticleSchema.index({ 'automotive.region': 1, publishedAt: -1 });
automotiveArticleSchema.index({ aiSentiment: 1, aiImportance: -1 });
automotiveArticleSchema.index({ 'publisher.name': 1, publishedAt: -1 });

// Text search index for full-text search
automotiveArticleSchema.index({
  originalTitle: 'text',
  aiTitle: 'text',
  aiSummary: 'text',
  'automotive.brand': 'text'
});

// TTL index for data retention (optional - 90 days)
// automotiveArticleSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('AutomotiveArticle', automotiveArticleSchema);
