const mongoose = require('mongoose');

const processedArticleSchema = new mongoose.Schema({
  // Original feed data
  sourceId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
    index: true
  },
  link: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    },
    index: true
  },
  snippet: {
    type: String,
    maxlength: 1000
  },
  publishedAt: {
    type: Date,
    required: true,
    index: true
  },
  rawFeedItem: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Content extraction
  cleanText: {
    type: String,
    maxlength: 50000
  },
  contentStatus: {
    type: String,
    enum: ['full', 'partial', 'failed'],
    default: 'partial'
  },
  rawHtml: String,
  
  // Deduplication
  canonicalUrl: {
    type: String,
    index: true
  },
  titleFingerprint: {
    type: String,
    index: true
  },
  contentFingerprint: {
    type: String,
    index: true
  },
  isDuplicate: {
    type: Boolean,
    default: false
  },
  
  // Metadata enrichment
  author: String,
  language: {
    type: String,
    default: 'en'
  },
  images: [String],
  wordCount: Number,
  extractedEntities: [String],
  
  // GPT Classification
  industry: {
    type: String,
    enum: ['Automotive', 'HVAC', 'Finance', 'Healthcare', 'Energy', 'Tech', 'Unknown'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['Launch', 'Financials', 'Competitor', 'Regulation', 'Research', 'Opinion', 'Other'],
    required: true,
    index: true
  },
  summary: {
    type: String,
    required: true,
    maxlength: 1000
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    required: true,
    index: true
  },
  keyEntities: [String],
  gptStatus: {
    type: String,
    enum: ['pending', 'processed', 'failed', 'retry'],
    default: 'pending'
  },
  gptError: String,
  
  // Timestamps
  fetchedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: Date,
  gptProcessedAt: Date,
  
  // Quality flags
  requiresReview: {
    type: Boolean,
    default: false
  },
  reviewReason: String
}, {
  timestamps: true
});

// Compound indexes for efficient queries
processedArticleSchema.index({ industry: 1, category: 1, publishedAt: -1 });
processedArticleSchema.index({ confidence: 1, requiresReview: 1 });
processedArticleSchema.index({ gptStatus: 1, processedAt: 1 });
processedArticleSchema.index({ isDuplicate: 1, fetchedAt: -1 });

// Text search index
processedArticleSchema.index({
  title: 'text',
  summary: 'text',
  cleanText: 'text'
});

// Unique constraint to prevent duplicates
processedArticleSchema.index({ canonicalUrl: 1 }, { unique: true, sparse: true });
processedArticleSchema.index({ titleFingerprint: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('ProcessedArticle', processedArticleSchema);
