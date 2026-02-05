const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyId: { type: String, required: true, unique: true },
  companyName: { type: String, required: true },
  website: { type: String, required: true },
  industry: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  employeeRange: { type: String, required: true },
  estimatedRevenue: { type: String, required: true },
  outsourcingScore: { type: Number, required: true },
  companyType: { type: String, required: true },
  keyContact: { type: String, required: true },
  contactRole: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  linkedInProfile: { type: String, required: true },
  keywordsFound: { type: String, required: true },
  triggerEvents: { type: String, required: true },
  lastWebsiteUpdate: { type: Date, required: true },
  notes: { type: String, required: true },
  priority: { type: String, required: true, enum: ['Low', 'Medium', 'High'] },
  assignedTo: { type: String, required: true },
  dateAdded: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for better performance
companySchema.index({ email: 1 });
companySchema.index({ industry: 1 });
companySchema.index({ priority: 1 });
companySchema.index({ city: 1 });
companySchema.index({ state: 1 });
companySchema.index({ dateAdded: -1 });

// Virtual for full contact name
companySchema.virtual('fullContactName').get(function() {
  return `${this.keyContact} (${this.contactRole})`;
});

// Pre-save middleware for validation
companySchema.pre('save', function(next) {
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(this.email)) {
    return next(new Error('Invalid email format'));
  }
  
  // Website validation
  if (this.website && !this.website.startsWith('http')) {
    this.website = `https://${this.website}`;
  }
  
  next();
});

// Static method to find by priority
companySchema.statics.findByPriority = function(priority) {
  return this.find({ priority: priority });
};

// Static method to find by industry
companySchema.statics.findByIndustry = function(industry) {
  return this.find({ industry: industry });
};

// Instance method to update priority
companySchema.methods.updatePriority = function(newPriority) {
  this.priority = newPriority;
  return this.save();
};

module.exports = mongoose.model('Company', companySchema);
