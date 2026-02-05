const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const authUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  preferences: {
    geographic: {
      cities: [String],
      states: [String],
      countries: [String],
      radius: {
        type: Number,
        default: 50
      }
    },
    business: {
      industries: [String],
      companySizes: [String],
      revenueRanges: [String]
    },
    triggers: {
      events: [String],
      keywords: [String],
      technologies: [String]
    },
    scoring: {
      enabled: {
        type: Boolean,
        default: false
      },
      weights: {
        industry: { type: Number, default: 25 },
        size: { type: Number, default: 25 },
        location: { type: Number, default: 15 },
        technology: { type: Number, default: 20 },
        triggers: { type: Number, default: 15 },
        revenue: { type: Number, default: 5 }
      }
    },
    notifications: {
      email: { type: Boolean, default: true },
      browser: { type: Boolean, default: true },
      frequency: { type: String, default: 'daily' }
    }
  },
  stats: {
    totalLeads: { type: Number, default: 0 },
    qualifiedLeads: { type: Number, default: 0 },
    convertedLeads: { type: Number, default: 0 },
    lastPreferenceUpdate: { type: Date }
  }
}, {
  timestamps: true
});

// Hash password before saving
authUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
authUserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get user profile without password
authUserSchema.methods.toProfileJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Static method to find by email and include password for authentication
authUserSchema.statics.findByEmailForAuth = function(email) {
  return this.findOne({ email }).select('+password');
};

module.exports = mongoose.model('AuthUser', authUserSchema);
