const mongoose = require('mongoose');

const newsSourceSchema = new mongoose.Schema({
  sourceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['RSS', 'RSS_SEARCH', 'SCRAPE'],
    required: true
  },
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  },
  country: {
    type: String,
    required: true,
    default: 'US'
  },
  language: {
    type: String,
    required: true,
    default: 'en'
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  refreshInterval: {
    type: Number,
    default: 1800 // 30 minutes in seconds
  },
  description: String,
  lastFetched: Date,
  lastError: String,
  errorCount: {
    type: Number,
    default: 0
  },
  successCount: {
    type: Number,
    default: 0
  },
  avgResponseTime: Number,
  isHealthy: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
newsSourceSchema.index({ isActive: 1, priority: 1 });
newsSourceSchema.index({ lastFetched: 1 });
newsSourceSchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model('NewsSource', newsSourceSchema);
