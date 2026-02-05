const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Global settings identifier
  key: { type: String, required: true, unique: true },
  
  // API configurations
  apis: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    method: { type: String, enum: ['GET', 'POST'], default: 'GET' },
    headers: { type: Map, of: String, default: new Map() },
    params: { type: Map, of: String, default: new Map() },
    fieldMapping: { type: Map, of: String, default: new Map() },
    schedule: { type: String, required: true, default: '0 12 * * *' },
    enabled: { type: Boolean, default: false },
    lastRun: { type: Date },
    status: { type: String, enum: ['success', 'error', 'pending'], default: 'pending' }
  }],
  
  // Field configurations
  fields: [{
    fieldName: { type: String, required: true },
    displayName: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['text', 'number', 'email', 'phone', 'date', 'url', 'select'], 
      required: true,
      default: 'text'
    },
    required: { type: Boolean, default: false },
    validation: {
      min: Number,
      max: Number,
      pattern: String,
      options: [String]
    },
    display: {
      showInList: { type: Boolean, default: true },
      showInDetails: { type: Boolean, default: true },
      width: { type: String, default: 'auto' }
    }
  }],
  
  // Notification configurations
  notifications: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['browser', 'email', 'sms', 'webhook'], required: true },
    enabled: { type: Boolean, default: true },
    triggers: [String], // ['new_leads', 'api_errors', 'daily_summary']
    settings: {
      // Browser notification settings
      title: String,
      icon: String,
      
      // Email notification settings
      email: String,
      template: String,
      
      // SMS notification settings
      phone: String,
      provider: String,
      
      // Webhook notification settings
      webhook: String,
      headers: Map,
      method: { type: String, enum: ['GET', 'POST'], default: 'POST' }
    }
  }],
  
  // Global scheduling settings
  schedule: {
    enabled: { type: Boolean, default: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
    retryAttempts: { type: Number, default: 3 },
    retryDelay: { type: Number, default: 5 }, // minutes
    maxLeadsPerRun: { type: Number, default: 1000 }
  },
  
  // Metadata
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: String, default: 'system' }
}, {
  timestamps: true
});

// Indexes for better performance
settingsSchema.index({ lastUpdated: -1 });

// Static method to get global settings
settingsSchema.statics.getGlobalSettings = async function() {
  let settings = await this.findOne({ key: 'global_settings' });
  
  if (!settings) {
    // Create default settings if none exist
    settings = await this.create({
      key: 'global_settings',
      apis: [],
      fields: getDefaultFields(),
      notifications: getDefaultNotifications(),
      schedule: {
        enabled: true,
        timezone: 'Asia/Kolkata',
        retryAttempts: 3,
        retryDelay: 5,
        maxLeadsPerRun: 1000
      }
    });
  }
  
  return settings;
};

// Static method to update global settings
settingsSchema.statics.updateGlobalSettings = async function(updates) {
  return await this.findOneAndUpdate(
    { key: 'global_settings' },
    { ...updates, lastUpdated: new Date() },
    { new: true, upsert: true }
  );
};

// Static method to get API configuration
settingsSchema.statics.getApiConfig = async function(apiId) {
  const settings = await this.getGlobalSettings();
  return settings.apis.find(api => api.id === apiId);
};

// Static method to update API configuration
settingsSchema.statics.updateApiConfig = async function(apiId, updates) {
  return await this.findOneAndUpdate(
    { key: 'global_settings', 'apis.id': apiId },
    { 
      $set: { 
        'apis.$': updates,
        lastUpdated: new Date()
      }
    },
    { new: true }
  );
};

// Static method to get enabled APIs
settingsSchema.statics.getEnabledApis = async function() {
  const settings = await this.getGlobalSettings();
  return settings.apis.filter(api => api.enabled);
};

// Static method to get enabled notifications
settingsSchema.statics.getEnabledNotifications = async function(trigger) {
  const settings = await this.getGlobalSettings();
  return settings.notifications.filter(notification => 
    notification.enabled && notification.triggers.includes(trigger)
  );
};

// Static method to get field configuration
settingsSchema.statics.getFieldConfig = async function(fieldName) {
  const settings = await this.getGlobalSettings();
  return settings.fields.find(field => field.fieldName === fieldName);
};

// Static method to get list fields
settingsSchema.statics.getListFields = async function() {
  const settings = await this.getGlobalSettings();
  return settings.fields.filter(field => field.display.showInList);
};

// Helper function to get default fields
function getDefaultFields() {
  return [
    {
      fieldName: 'name',
      displayName: 'Name',
      type: 'text',
      required: true,
      display: { showInList: true, showInDetails: true, width: '200px' }
    },
    {
      fieldName: 'email',
      displayName: 'Email',
      type: 'email',
      required: false,
      validation: { pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$' },
      display: { showInList: true, showInDetails: true, width: '200px' }
    },
    {
      fieldName: 'phone',
      displayName: 'Phone',
      type: 'phone',
      required: false,
      validation: { pattern: '^[+]?[\\d\\s\\-\\(\\)]+$' },
      display: { showInList: true, showInDetails: true, width: '150px' }
    },
    {
      fieldName: 'company',
      displayName: 'Company',
      type: 'text',
      required: false,
      display: { showInList: true, showInDetails: true, width: '200px' }
    },
    {
      fieldName: 'city',
      displayName: 'City',
      type: 'text',
      required: false,
      display: { showInList: true, showInDetails: true, width: '120px' }
    },
    {
      fieldName: 'industry',
      displayName: 'Industry',
      type: 'select',
      required: false,
      validation: { 
        options: ['Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail', 'Education', 'Other']
      },
      display: { showInList: true, showInDetails: true, width: '150px' }
    },
    {
      fieldName: 'status',
      displayName: 'Status',
      type: 'select',
      required: true,
      validation: { 
        options: ['New', 'Contacted', 'Qualified', 'Converted', 'Lost']
      },
      display: { showInList: true, showInDetails: true, width: '100px' }
    },
    {
      fieldName: 'priority',
      displayName: 'Priority',
      type: 'select',
      required: true,
      validation: { 
        options: ['High', 'Medium', 'Low']
      },
      display: { showInList: true, showInDetails: true, width: '100px' }
    }
  ];
}

// Helper function to get default notifications
function getDefaultNotifications() {
  return [
    {
      id: 'browser_new_leads',
      name: 'Browser - New Leads',
      type: 'browser',
      enabled: true,
      triggers: ['new_leads'],
      settings: {
        title: 'New Leads Available',
        icon: '/favicon.ico'
      }
    },
    {
      id: 'browser_api_errors',
      name: 'Browser - API Errors',
      type: 'browser',
      enabled: true,
      triggers: ['api_errors'],
      settings: {
        title: 'API Error Occurred',
        icon: '/favicon.ico'
      }
    },
    {
      id: 'browser_daily_summary',
      name: 'Browser - Daily Summary',
      type: 'browser',
      enabled: true,
      triggers: ['daily_summary'],
      settings: {
        title: 'Daily Lead Summary',
        icon: '/favicon.ico'
      }
    }
  ];
}

// Instance method to convert Mongoose Maps to plain objects
settingsSchema.methods.toJSON = function() {
  const settings = this.toObject();
  
  // Convert Map objects to plain objects
  if (settings.apis) {
    settings.apis = settings.apis.map(api => ({
      ...api,
      headers: api.headers ? Object.fromEntries(api.headers) : {},
      params: api.params ? Object.fromEntries(api.params) : {},
      fieldMapping: api.fieldMapping ? Object.fromEntries(api.fieldMapping) : {}
    }));
  }
  
  if (settings.notifications) {
    settings.notifications = settings.notifications.map(notification => ({
      ...notification,
      settings: {
        ...notification.settings,
        headers: notification.settings.headers ? Object.fromEntries(notification.settings.headers) : {}
      }
    }));
  }
  
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);