const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  zipCode: { type: String, required: true },
  occupation: { type: String, required: true },
  company: { type: String, required: true },
  department: { type: String, required: true },
  jobTitle: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  joinDate: { type: Date, required: true },
  salary: { type: Number, required: true },
  workType: { type: String, required: true, enum: ['Full-time', 'Part-time', 'Contract', 'Intern'] },
  status: { type: String, required: true, enum: ['Active', 'Inactive', 'On Leave', 'Terminated'] },
  skills: { type: String, required: true },
  experience: { type: Number, required: true },
  education: { type: String, required: true },
  certifications: { type: String, required: true },
  emergencyContact: { type: String, required: true },
  emergencyPhone: { type: String, required: true },
  relationship: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  maritalStatus: { type: String, required: true, enum: ['Single', 'Married', 'Divorced', 'Widowed'] },
  nationality: { type: String, required: true },
  languages: { type: String, required: true },
  hobbies: { type: String, required: true },
  socialMedia: { type: String, required: true },
  notes: { type: String, required: true },
  priority: { type: String, required: true, enum: ['Low', 'Medium', 'High'] },
  assignedTo: { type: String, required: true },
  dateAdded: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ department: 1 });
userSchema.index({ status: 1 });
userSchema.index({ workType: 1 });
userSchema.index({ city: 1 });
userSchema.index({ state: 1 });
userSchema.index({ company: 1 });
userSchema.index({ dateAdded: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
userSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Pre-save middleware for validation
userSchema.pre('save', function(next) {
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(this.email)) {
    return next(new Error('Invalid email format'));
  }
  
  // Phone validation (basic)
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(this.phone)) {
    return next(new Error('Invalid phone format'));
  }
  
  next();
});

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ status: 'Active' });
};

// Static method to find by department
userSchema.statics.findByDepartment = function(department) {
  return this.find({ department: department });
};

// Instance method to deactivate user
userSchema.methods.deactivate = function() {
  this.status = 'Inactive';
  return this.save();
};

// Instance method to activate user
userSchema.methods.activate = function() {
  this.status = 'Active';
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
