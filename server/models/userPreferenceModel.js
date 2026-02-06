const mongoose = require('mongoose');

const userPreferenceSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  preferences: {
    geographic: {
      cities: [{
        type: String,
        trim: true
      }],
      states: [{
        type: String,
        trim: true
      }],
      countries: [{
        type: String,
        trim: true
      }],
      regions: [{
        type: String,
        trim: true
      }],
      radius: {
        type: Number,
        default: 50,
        min: 0,
        max: 1000
      },
      radiusUnit: {
        type: String,
        enum: ['km', 'miles'],
        default: 'km'
      }
    },
    business: {
      industries: [{
        type: String,
        trim: true
      }],
      companySizes: [{
        type: String,
        trim: true
      }],
      revenueRanges: [{
        type: String,
        trim: true
      }],
      employeeRanges: [{
        type: String,
        trim: true
      }],
      companyTypes: [{
        type: String,
        trim: true
      }],
      technologies: [{
        type: String,
        trim: true
      }],
      businessModels: [{
        type: String,
        trim: true
      }]
    },
    triggers: {
      events: [{
        type: String,
        trim: true
      }],
      keywords: [{
        type: String,
        trim: true
      }],
      timeframes: {
        lastFunding: {
          type: String,
          enum: ['1month', '3months', '6months', '12months', '24months'],
          default: '6months'
        },
        lastHiring: {
          type: String,
          enum: ['1month', '3months', '6months', '12months', '24months'],
          default: '3months'
        },
        lastExpansion: {
          type: String,
          enum: ['1month', '3months', '6months', '12months', '24months'],
          default: '12months'
        },
        lastWebsiteUpdate: {
          type: String,
          enum: ['1month', '3months', '6months', '12months', '24months'],
          default: '3months'
        }
      }
    },
    scoring: {
      weights: {
        industry: {
          type: Number,
          default: 25,
          min: 0,
          max: 100
        },
        size: {
          type: Number,
          default: 20,
          min: 0,
          max: 100
        },
        location: {
          type: Number,
          default: 15,
          min: 0,
          max: 100
        },
        technology: {
          type: Number,
          default: 20,
          min: 0,
          max: 100
        },
        triggers: {
          type: Number,
          default: 15,
          min: 0,
          max: 100
        },
        revenue: {
          type: Number,
          default: 5,
          min: 0,
          max: 100
        }
      },
      thresholds: {
        minimum: {
          type: Number,
          default: 40,
          min: 0,
          max: 100
        },
        high: {
          type: Number,
          default: 80,
          min: 0,
          max: 100
        },
        medium: {
          type: Number,
          default: 60,
          min: 0,
          max: 100
        },
        low: {
          type: Number,
          default: 40,
          min: 0,
          max: 100
        }
      }
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      },
      frequency: {
        type: String,
        enum: ['realtime', 'hourly', 'daily', 'weekly'],
        default: 'daily'
      },
      filters: {
        minimumScore: {
          type: Number,
          default: 60,
          min: 0,
          max: 100
        },
        industries: [{
          type: String,
          trim: true
        }],
        locations: [{
          type: String,
          trim: true
        }]
      }
    },
    api: {
      endpoints: {
        crunchbase: {
          type: String,
          default: 'https://api.crunchbase.com/v4'
        },
        hunter: {
          type: String,
          default: 'https://api.hunter.io/v2'
        },
        clearbit: {
          type: String,
          default: 'https://api.clearbit.com/v1'
        },
        linkedin: {
          type: String,
          default: 'https://api.linkedin.com/v2'
        }
      },
      keys: {
        crunchbase: {
          type: String,
          default: ''
        },
        hunter: {
          type: String,
          default: ''
        },
        clearbit: {
          type: String,
          default: ''
        },
        linkedin: {
          type: String,
          default: ''
        }
      },
      rateLimits: {
        requestsPerMinute: {
          type: Number,
          default: 100,
          min: 1
        },
        requestsPerHour: {
          type: Number,
          default: 5000,
          min: 1
        },
        requestsPerDay: {
          type: Number,
          default: 50000,
          min: 1
        }
      },
      customKeys: {
        type: Map,
        of: String,
        default: new Map()
      }
    },
    customFilters: {
      type: Map,
      of: [String],
      default: new Map()
    },
    dataKeys: {
      type: Map,
      of: String,
      default: new Map()
    }
  },
  stats: {
    totalLeads: {
      type: Number,
      default: 0
    },
    qualifiedLeads: {
      type: Number,
      default: 0
    },
    convertedLeads: {
      type: Number,
      default: 0
    },
    lastSync: {
      type: Date,
      default: Date.now
    },
    apiCalls: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
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
userPreferenceSchema.index({ 'stats.lastSync': 1 });
userPreferenceSchema.index({ createdAt: 1 });

// Virtual for lead conversion rate
userPreferenceSchema.virtual('conversionRate').get(function() {
  return this.stats.totalLeads > 0 
    ? Math.round((this.stats.convertedLeads / this.stats.totalLeads) * 100)
    : 0;
});

// Virtual for qualification rate
userPreferenceSchema.virtual('qualificationRate').get(function() {
  return this.stats.totalLeads > 0 
    ? Math.round((this.stats.qualifiedLeads / this.stats.totalLeads) * 100)
    : 0;
});

// Pre-save middleware to update timestamps
userPreferenceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to calculate lead score
userPreferenceSchema.methods.calculateLeadScore = function(leadData) {
  let score = 0;
  const weights = this.preferences.scoring.weights;

  // Industry matching
  if (leadData.industry && this.preferences.business.industries.includes(leadData.industry)) {
    score += weights.industry;
  }

  // Company size matching
  if (leadData.employeeRange && this.preferences.business.employeeRanges.includes(leadData.employeeRange)) {
    score += weights.size;
  }

  // Location matching
  let locationMatch = false;
  if (leadData.city && this.preferences.geographic.cities.includes(leadData.city)) {
    locationMatch = true;
  } else if (leadData.state && this.preferences.geographic.states.includes(leadData.state)) {
    locationMatch = true;
  } else if (leadData.country && this.preferences.geographic.countries.includes(leadData.country)) {
    locationMatch = true;
  }
  if (locationMatch) {
    score += weights.location;
  }

  // Technology matching
  if (leadData.technologies) {
    const techMatches = leadData.technologies.filter(tech => 
      this.preferences.business.technologies.includes(tech)
    ).length;
    if (techMatches > 0) {
      score += (weights.technology * (techMatches / leadData.technologies.length));
    }
  }

  // Trigger events matching
  if (leadData.triggerEvents) {
    const eventMatches = leadData.triggerEvents.filter(event => 
      this.preferences.triggers.events.includes(event)
    ).length;
    if (eventMatches > 0) {
      score += (weights.triggers * (eventMatches / leadData.triggerEvents.length));
    }
  }

  // Revenue matching
  if (leadData.revenueRange && this.preferences.business.revenueRanges.includes(leadData.revenueRange)) {
    score += weights.revenue;
  }

  return Math.min(100, Math.round(score));
};

// Instance method to check if lead matches preferences
userPreferenceSchema.methods.matchesLead = function(leadData) {
  const score = this.calculateLeadScore(leadData);
  return score >= this.preferences.scoring.thresholds.minimum;
};

// Instance method to update statistics
userPreferenceSchema.methods.updateStats = function(statsUpdate) {
  Object.assign(this.stats, statsUpdate);
  this.stats.lastSync = new Date();
  return this.save();
};

// Static method to get user statistics
userPreferenceSchema.statics.getUserStatistics = async function(userId) {
  const userPref = await this.findOne({ userId });
  if (!userPref) {
    return {
      totalLeads: 0,
      qualifiedLeads: 0,
      convertedLeads: 0,
      conversionRate: 0,
      qualificationRate: 0,
      lastSync: null,
      apiCalls: 0,
      successRate: 0
    };
  }

  return {
    totalLeads: userPref.stats.totalLeads,
    qualifiedLeads: userPref.stats.qualifiedLeads,
    convertedLeads: userPref.stats.convertedLeads,
    conversionRate: userPref.conversionRate,
    qualificationRate: userPref.qualificationRate,
    lastSync: userPref.stats.lastSync,
    apiCalls: userPref.stats.apiCalls,
    successRate: userPref.stats.successRate
  };
};

// Static method to get available options
userPreferenceSchema.statics.getAvailableOptions = function() {
  return {
    cities: [
      // Major Indian cities (matching actual leads data)
      'Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata',
      'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
      'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna',
      'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad',
      'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Amritsar', 'Allahabad',
      'Ranchi', 'Howrah', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur',
      'Raipur', 'Kota', 'Guwahati', 'Chandigarh', 'Solapur', 'Hubli',
      'Tiruchirappalli', 'Mysore', 'Bareilly', 'Moradabad', 'Gurgaon', 'Gurugram',
      'Aligarh', 'Jalandhar', 'Tirunelveli', 'Bhubaneswar', 'Salem',
      // Additional major cities
      'Noida', 'Greater Noida', 'Faridabad', 'Ghaziabad', 'Kalyan', 'Vasai-Virar',
      'Aurangabad', 'Dhanbad', 'Amravati', 'Nellore', 'Gaya', 'Jammu',
      'Belagavi', 'Mangalore', 'Tirunelveli', 'Malegaon', 'Gaya', 'Jalgaon',
      'Udaipur', 'Maheshtala', 'Tirupati', 'Karnal', 'Bihar Sharif', 'Parbhani',
      'Panipat', 'Darbhanga', 'Khandwa', 'Morena', 'Raebareli', 'Bilaspur',
      'Kharagpur', 'Bharatpur', 'Bardhaman', 'Bhiwandi', 'Muzaffarpur', 'Mathura'
    ],
    states: [
      // Indian States and Union Territories (matching actual leads data)
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
      'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
      'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
      'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
      'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir',
      'Ladakh', 'Puducherry', 'Chandigarh', 'Daman and Diu', 'Dadra and Nagar Haveli',
      'Andaman and Nicobar Islands', 'Lakshadweep',
      // Common abbreviations/alternate names
      'AP', 'UP', 'MP', 'TN', 'MH', 'GJ', 'KA', 'WB', 'RJ', 'PB'
    ],
    countries: [
      'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
      'Germany', 'France', 'Japan', 'China', 'Singapore',
      'UAE', 'Saudi Arabia', 'South Korea', 'Netherlands', 'Switzerland',
      'Italy', 'Spain', 'Brazil', 'Mexico', 'South Africa'
    ],
    industries: [
      // Pharmaceuticals first (most common in leads)
      'Pharmaceuticals', 'Pharma', 'Biotechnology', 'Biotech', 'Life Sciences',
      'Technology', 'IT', 'Software', 'Healthcare', 'Medical Devices',
      'Finance', 'Banking', 'Insurance', 'Financial Services',
      'Manufacturing', 'Retail', 'Automotive', 'Construction', 'Education',
      'Real Estate', 'Telecommunications', 'Energy', 'Agriculture', 'Food & Beverages',
      'Textiles', 'Chemicals', 'Steel', 'IT Services', 'Consulting',
      'E-commerce', 'Logistics', 'Hospitality', 'Media & Entertainment',
      'Engineering', 'FMCG', 'Oil & Gas', 'Power', 'Infrastructure',
      'API Manufacturing', 'Formulations', 'Contract Manufacturing', 'Research & Development'
    ],
    companySizes: [
      // Matching actual employeeCount formats from leads
      '1-50', '51-100', '101-250', '251-500', '501-1000',
      '1001-3000', '3001-6000', '6000+',
      // Additional formats found in actual data
      '300-600', '100-500', '500-1000', '1000-5000', '5000+',
      '1-10', '11-50', '51-250', '251-1000', '1000+'
    ],
    revenueRanges: [
      // Matching actual revenueRangeCr formats from leads (₹ Crores)
      '₹0-50 Cr', '₹50-100 Cr', '₹100-300 Cr', '₹300-600 Cr', 
      '₹600-1000 Cr', '₹1000-5000 Cr', '₹5000+ Cr', '₹1000+ Cr',
      // Also include formats without ₹ for matching
      '0-50 Cr', '50-100 Cr', '100-300 Cr', '300-600 Cr',
      '600-1000 Cr', '1000-5000 Cr', '5000+ Cr', '1000+ Cr',
      // Raw formats from database
      '300-600', '5000+', '1000+', '100-300', '50-100'
    ],
    employeeRanges: [
      '1-10', '11-50', '51-250', '251-1000', '1000+'
    ],
    companyTypes: [
      // Matching actual companyType from leads
      'MNC', 'Private', 'Public', 'Public Limited', 'Private Limited',
      'Startup', 'SME', 'Enterprise', 'Corporation', 'LLC', 
      'Partnership', 'Sole Proprietorship', 'Limited', 'Unlisted'
    ],
    technologies: [
      'JavaScript', 'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
      'React', 'Angular', 'Vue.js', 'Node.js', 'Django', 'Flask', 'Spring', 'Laravel', 'Rails',
      'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab', 'GitHub',
      'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB',
      'TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras', 'Apache Spark', 'Hadoop',
      'iOS', 'Android', 'React Native', 'Flutter', 'Xamarin', 'Ionic',
      'Salesforce', 'HubSpot', 'Marketo', 'Pardot', 'Mailchimp', 'Constant Contact'
    ],
    events: [
      // Matching actual triggerEvent from leads
      'Expansion', 'Funding', 'Hiring', 'Product Launch', 'Acquisition', 'IPO',
      'Partnership', 'Award', 'Certification', 'Conference', 'Trade Show',
      'Website Update', 'Social Media Activity', 'News Mention', 'Blog Post', 'Press Release',
      'New Facility', 'Capacity Expansion', 'Market Entry', 'Strategic Partnership'
    ],
    keywords: [
      'AI', 'Machine Learning', 'Artificial Intelligence', 'Cloud Computing', 'Big Data',
      'Blockchain', 'IoT', 'Cybersecurity', 'DevOps', 'Agile', 'Scrum',
      'Digital Transformation', 'SaaS', 'PaaS', 'IaaS', 'Microservices',
      'API', 'REST', 'GraphQL', 'Webhook', 'Integration', 'Automation',
      'Analytics', 'Business Intelligence', 'Data Science', 'Predictive Analytics',
      'Customer Experience', 'User Experience', 'Product Design', 'UX/UI'
    ],
    predefinedOptions: {
      companyTypes: [
        'Startup', 'SME', 'Enterprise', 'Corporation', 'Private Limited', 'Public Limited', 'Partnership', 'Sole Proprietorship'
      ],
      employeeRanges: [
        '1-50', '51-100', '101-250', '251-500', '501-1000', '1001-3000', '3001-6000', '6000+',
        '300-600', '100-500', '500-1000', '1000-5000', '5000+'
      ],
      revenueRanges: [
        '₹0-50 Cr', '₹50-100 Cr', '₹100-300 Cr', '₹300-600 Cr', '₹600-1000 Cr', 
        '₹1000-5000 Cr', '₹5000+ Cr', '₹1000+ Cr',
        '300-600', '5000+', '1000+', '100-300', '50-100'
      ]
    }
  };
};

module.exports = mongoose.model('UserPreference', userPreferenceSchema);
