const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  originalTitle: String,
  content: String,
  url: {
    type: String,
    required: true,
    unique: true
  },
  source: {
    name: String,
    url: String,
    rssFeed: String
  },
  industry: {
    type: String,
    required: true,
    enum: ['automotive', 'technology', 'finance', 'healthcare', 'energy', 'manufacturing', 'retail', 'real-estate']
  },
  category: {
    type: String,
    required: true,
    enum: ['product-launches', 'competitor-moves', 'm-and-a', 'financials', 'regulatory', 'market-trends', 'partnerships', 'other']
  },
  tags: [String],
  sentiment: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral'
  },
  importance: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  publishedAt: {
    type: Date,
    required: true
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  },
  processedByAI: {
    type: Boolean,
    default: false
  },
  aiProcessingDate: Date,
  // AI-generated fields
  aiTitle: String,
  aiSummary: String,
  aiCategory: String,
  aiSentiment: String,
  aiTags: [String],
  originalUrl: String,
  engagement: {
    views: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Index for efficient queries
articleSchema.index({ industry: 1, category: 1, publishedAt: -1 });
articleSchema.index({ url: 1 });

module.exports = mongoose.model('Article', articleSchema);
