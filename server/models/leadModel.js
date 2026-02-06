const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  leadId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  id: {
    type: String,
    trim: true
  },
  primaryField: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuthUser',
    index: true
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  dateUpdated: {
    type: Date,
    default: Date.now
  },
  customFields: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
leadSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for days since last contact
leadSchema.virtual('daysSinceLastContact').get(function() {
  if (!this.lastContacted) return null;
  return Math.floor((Date.now() - this.lastContacted) / (1000 * 60 * 60 * 24));
});

// Indexes for better query performance
leadSchema.index({ dateAdded: -1 });
leadSchema.index({ 'customFields.email': 1 });
leadSchema.index({ 'customFields.companyName': 1 });
leadSchema.index({ 'customFields.status': 1 });
leadSchema.index({ 'customFields.priority': 1 });

// Pre-save middleware to update dateUpdated and set id from leadId
leadSchema.pre('save', function(next) {
  this.dateUpdated = new Date();
  if (!this.id && this.leadId) {
    this.id = this.leadId;
  }
  if (!this.primaryField || !this.primaryField.key) {
    this.primaryField = { key: 'leadId', value: this.leadId };
  }
  next();
});

// Static method to find leads by status
leadSchema.statics.findByStatus = function(status) {
  return this.find({ status: status });
};

// Static method to find high priority leads
leadSchema.statics.findHighPriority = function() {
  return this.find({ priority: 'high' });
};

// Instance method to mark as contacted
leadSchema.methods.markAsContacted = function() {
  this.status = 'contacted';
  this.lastContacted = new Date();
  return this.save();
};

// Instance method to convert to opportunity
leadSchema.methods.convertToOpportunity = function() {
  this.status = 'converted';
  this.metadata.temperature = 'hot';
  return this.save();
};

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;