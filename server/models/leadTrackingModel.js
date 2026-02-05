const mongoose = require('mongoose');

const leadTrackingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  leadId: {
    type: String,
    required: true
  },
  preferenceId: {
    type: String,
    required: true,
    index: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['matched', 'viewed', 'contacted', 'qualified', 'converted', 'rejected'],
    default: 'matched'
  },
  matchedCriteria: {
    industry: { type: Boolean, default: false },
    location: { type: Boolean, default: false },
    size: { type: Boolean, default: false },
    technology: { type: Boolean, default: false },
    triggers: { type: Boolean, default: false },
    revenue: { type: Boolean, default: false }
  },
  actions: [{
    type: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    details: { type: mongoose.Schema.Types.Mixed },
    performedBy: { type: String }
  }],
  notifications: [{
    type: { type: String, enum: ['email', 'sms', 'push', 'browser'] },
    sent: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
    details: { type: mongoose.Schema.Types.Mixed }
  }],
  metadata: {
    source: { type: String },
    campaign: { type: String },
    priority: { type: String, enum: ['low', 'medium', 'high'] },
    tags: [{ type: String }],
    notes: { type: String }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
leadTrackingSchema.index({ userId: 1, status: 1 });
leadTrackingSchema.index({ userId: 1, score: -1 });
leadTrackingSchema.index({ leadId: 1 });
leadTrackingSchema.index({ createdAt: -1 });
leadTrackingSchema.index({ 'actions.timestamp': -1 });

// Virtual for time since matched
leadTrackingSchema.virtual('timeSinceMatched').get(function() {
  return Date.now() - this.createdAt;
});

// Pre-save middleware
leadTrackingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to add action
leadTrackingSchema.methods.addAction = function(type, details, performedBy) {
  this.actions.push({
    type,
    details,
    performedBy,
    timestamp: new Date()
  });
  return this.save();
};

// Instance method to update status
leadTrackingSchema.methods.updateStatus = function(newStatus, details, performedBy) {
  this.status = newStatus;
  this.actions.push({
    type: 'status_change',
    details: { oldStatus: this.status, newStatus, ...details },
    performedBy,
    timestamp: new Date()
  });
  return this.save();
};

// Instance method to add notification
leadTrackingSchema.methods.addNotification = function(type, details) {
  this.notifications.push({
    type,
    details,
    timestamp: new Date()
  });
  return this.save();
};

// Static method to get user's tracked leads
leadTrackingSchema.statics.getUserTrackedLeads = async function(userId, options = {}) {
  const {
    status,
    minScore,
    maxScore,
    limit = 50,
    page = 1,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const query = { userId };
  
  if (status) query.status = status;
  if (minScore) query.score = { $gte: minScore };
  if (maxScore) query.score = { $lte: maxScore };

  const skip = (page - 1) * limit;
  
  const leads = await this.find(query)
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(limit)
    .populate('leadId')
    .exec();

  const total = await this.countDocuments(query);

  return {
    leads,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get user statistics
leadTrackingSchema.statics.getUserTrackingStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgScore: { $avg: '$score' }
      }
    }
  ]);

  const totalLeads = await this.countDocuments({ userId });
  const avgScore = await this.aggregate([
    { $match: { userId } },
    { $group: { _id: null, avgScore: { $avg: '$score' } } }
  ]);

  return {
    totalLeads,
    avgScore: avgScore.length > 0 ? avgScore[0].avgScore : 0,
    byStatus: stats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        avgScore: stat.avgScore
      };
      return acc;
    }, {})
  };
};

// Static method to get trending leads for user
leadTrackingSchema.statics.getTrendingLeads = async function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ score: -1, createdAt: -1 })
    .limit(limit)
    .populate('leadId')
    .exec();
};

module.exports = mongoose.model('LeadTracking', leadTrackingSchema);
