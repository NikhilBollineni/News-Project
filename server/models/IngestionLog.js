const mongoose = require('mongoose');

const ingestionLogSchema = new mongoose.Schema({
  sourceId: {
    type: String,
    required: true,
    index: true
  },
  runId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['started', 'completed', 'failed', 'partial'],
    required: true
  },
  
  // Statistics
  itemsDiscovered: {
    type: Number,
    default: 0
  },
  itemsUnique: {
    type: Number,
    default: 0
  },
  itemsProcessed: {
    type: Number,
    default: 0
  },
  itemsSaved: {
    type: Number,
    default: 0
  },
  itemsSkipped: {
    type: Number,
    default: 0
  },
  
  // Content extraction stats
  contentExtracted: {
    type: Number,
    default: 0
  },
  contentPartial: {
    type: Number,
    default: 0
  },
  contentFailed: {
    type: Number,
    default: 0
  },
  
  // GPT processing stats
  gptCalls: {
    type: Number,
    default: 0
  },
  gptTokens: {
    type: Number,
    default: 0
  },
  gptCost: {
    type: Number,
    default: 0
  },
  gptSuccess: {
    type: Number,
    default: 0
  },
  gptFailed: {
    type: Number,
    default: 0
  },
  
  // Performance metrics
  duration: Number, // in milliseconds
  avgResponseTime: Number,
  errors: [String],
  
  // Timestamps
  startedAt: {
    type: Date,
    required: true,
    index: true
  },
  completedAt: Date,
  
  // Configuration used
  config: {
    batchSize: Number,
    maxConcurrency: Number,
    timeout: Number
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
ingestionLogSchema.index({ sourceId: 1, startedAt: -1 });
ingestionLogSchema.index({ status: 1, startedAt: -1 });
ingestionLogSchema.index({ runId: 1 });

module.exports = mongoose.model('IngestionLog', ingestionLogSchema);
