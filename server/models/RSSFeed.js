const mongoose = require('mongoose');

const rssFeedSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  website: {
    type: String,
    required: true
  },
  industry: {
    type: String,
    required: true,
    enum: ['automotive', 'technology', 'finance', 'healthcare', 'energy', 'manufacturing', 'retail', 'real-estate']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastScraped: Date,
  scrapeFrequency: {
    type: String,
    enum: ['every-15-min', 'hourly', 'every-3-hours', 'daily'],
    default: 'hourly'
  },
  successRate: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  metadata: {
    description: String,
    language: { type: String, default: 'en' },
    category: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RSSFeed', rssFeedSchema);
