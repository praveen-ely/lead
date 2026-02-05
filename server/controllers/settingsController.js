const Settings = require('../models/settingsModel');
const cron = require('node-cron');
const { sendNotification } = require('../routes/notificationRoutes');

// Scheduled tasks management
let scheduledTasks = [];

// Get all settings
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getGlobalSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message
    });
  }
};

// Save all settings
const saveAllSettings = async (req, res) => {
  try {
    const settingsData = req.body;
    
    const settings = await Settings.updateGlobalSettings(settingsData);
    
    // Restart scheduled tasks if schedule settings changed
    if (settingsData.schedule) {
      await restartScheduledTasks(settings);
    }
    
    res.json({
      success: true,
      message: 'Settings saved successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving settings',
      error: error.message
    });
  }
};

// Test API connection
const testApiConnection = async (req, res) => {
  try {
    const { apiConfig } = req.body;
    
    // Build URL with parameters
    let fullUrl = apiConfig.url;
    if (apiConfig.params && Object.keys(apiConfig.params).length > 0) {
      const searchParams = new URLSearchParams(apiConfig.params);
      fullUrl += `?${searchParams.toString()}`;
    }
    
    // Make API call
    const response = await fetch(fullUrl, {
      method: apiConfig.method,
      headers: apiConfig.headers || {}
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    res.json({
      success: true,
      message: 'API connection successful',
      data: {
        status: response.status,
        statusText: response.statusText,
        sampleData: data
      }
    });
  } catch (error) {
    console.error('API connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'API connection failed',
      error: error.message
    });
  }
};

// Execute API call and process data
const executeApiCall = async (apiConfig) => {
  try {
    console.log(`Executing API call: ${apiConfig.name}`);
    
    // Update API status to pending
    await Settings.updateApiConfig(apiConfig.id, {
      ...apiConfig,
      lastRun: new Date(),
      status: 'pending'
    });
    
    // Build URL with parameters
    let fullUrl = apiConfig.url;
    if (apiConfig.params && Object.keys(apiConfig.params).length > 0) {
      const searchParams = new URLSearchParams(apiConfig.params);
      fullUrl += `?${searchParams.toString()}`;
    }
    
    // Make API call
    const response = await fetch(fullUrl, {
      method: apiConfig.method,
      headers: apiConfig.headers || {}
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Process API data based on field mapping
    const processedLeads = processApiResponse(data, apiConfig.fieldMapping);
    
    // Save leads to database
    const savedLeads = await saveLeadsToDatabase(processedLeads, apiConfig);
    
    // Update API status to success
    await Settings.updateApiConfig(apiConfig.id, {
      ...apiConfig,
      lastRun: new Date(),
      status: 'success'
    });
    
    // Send notifications
    if (savedLeads.length > 0) {
      await sendNotifications('new_leads', {
        apiName: apiConfig.name,
        leadsCount: savedLeads.length,
        message: `${savedLeads.length} new leads imported from ${apiConfig.name}`
      });
    }
    
    return savedLeads;
  } catch (error) {
    console.error(`API execution failed for ${apiConfig.name}:`, error);
    
    // Update API status to error
    await Settings.updateApiConfig(apiConfig.id, {
      ...apiConfig,
      lastRun: new Date(),
      status: 'error'
    });
    
    // Send error notification
    await sendNotifications('api_errors', {
      apiName: apiConfig.name,
      error: error.message,
      message: `API execution failed: ${apiConfig.name}`
    });
    
    throw error;
  }
};

// Process API response based on field mapping
const processApiResponse = (data, fieldMapping) => {
  const leads = [];
  
  // Handle different response formats
  let items = [];
  if (Array.isArray(data)) {
    items = data;
  } else if (data.data && Array.isArray(data.data)) {
    items = data.data;
  } else if (data.results && Array.isArray(data.results)) {
    items = data.results;
  } else if (data.organizations && Array.isArray(data.organizations)) {
    items = data.organizations;
  } else {
    items = [data]; // Single item
  }
  
  for (const item of items) {
    try {
      const leadData = mapFields(item, fieldMapping);
      if (leadData && leadData.name) { // Only include leads with basic info
        leads.push(leadData);
      }
    } catch (error) {
      console.error('Error processing item:', error);
    }
  }
  
  return leads;
};

// Map fields from API response to our format
const mapFields = (item, fieldMapping) => {
  const leadData = {
    source: 'API Import',
    importDate: new Date().toISOString(),
    originalData: item
  };
  
  // Apply field mapping
  Object.entries(fieldMapping).forEach(([targetField, sourcePath]) => {
    try {
      const value = getNestedValue(item, sourcePath);
      if (value !== undefined && value !== null) {
        leadData[targetField] = value;
      }
    } catch (error) {
      // Skip field if mapping fails
    }
  });
  
  // Add some default fields if not present
  if (!leadData.status) {
    leadData.status = 'New';
  }
  if (!leadData.priority) {
    leadData.priority = 'Medium';
  }
  
  return leadData;
};

// Get nested value from object using dot notation or array notation
const getNestedValue = (obj, path) => {
  try {
    // Handle array notation like "location_identifiers[0].value"
    const arrayPath = path.match(/^(\w+)\[(\d+)\]\.?(.*)$/);
    if (arrayPath) {
      const [, arrayName, index, remainingPath] = arrayPath;
      const array = obj[arrayName];
      if (array && array[index]) {
        if (remainingPath) {
          return getNestedValue(array[index], remainingPath);
        }
        return array[index];
      }
      return undefined;
    }
    
    // Handle regular dot notation
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  } catch (error) {
    return undefined;
  }
};

// Save leads to database
const saveLeadsToDatabase = async (leads, apiConfig) => {
  const Lead = require('../models/leadModel');
  const savedLeads = [];
  
  for (const leadData of leads) {
    try {
      const lead = new Lead({
        leadId: `API_${apiConfig.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: apiConfig.name,
        status: 'New',
        priority: 'Medium',
        assignedTo: 'Unassigned',
        data: leadData,
        notes: `Imported from ${apiConfig.name} API`,
        aiProcessed: false,
        aiConfidence: 0,
        aiModel: 'API Import'
      });
      
      await lead.save();
      savedLeads.push(lead);
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  }
  
  return savedLeads;
};

// Send notifications
const sendNotifications = async (trigger, data) => {
  try {
    const enabledNotifications = await Settings.getEnabledNotifications(trigger);
    
    // Send real-time notification to all connected clients
    sendNotification(trigger, data);
    
    for (const notification of enabledNotifications) {
      switch (notification.type) {
        case 'browser':
          // Already handled by sendNotification above
          console.log('Browser notification sent:', trigger, data);
          break;
          
        case 'email':
          // Send email notification
          console.log('Email notification to', notification.settings.email, ':', trigger, data);
          // TODO: Implement actual email sending
          break;
          
        case 'sms':
          // Send SMS notification
          console.log('SMS notification to', notification.settings.phone, ':', trigger, data);
          // TODO: Implement actual SMS sending
          break;
          
        case 'webhook':
          // Send webhook notification
          if (notification.settings.webhook) {
            try {
              await fetch(notification.settings.webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trigger, data, timestamp: new Date().toISOString() })
              });
            } catch (error) {
              console.error('Webhook notification failed:', error);
            }
          }
          break;
      }
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
};

// Scheduled tasks management
const restartScheduledTasks = async (settings) => {
  // Clear existing tasks
  scheduledTasks.forEach(task => task.stop());
  scheduledTasks = [];
  
  if (!settings.schedule.enabled) {
    console.log('Scheduled tasks disabled');
    return;
  }
  
  // Schedule enabled APIs
  settings.apis.forEach(apiConfig => {
    if (apiConfig.enabled && apiConfig.schedule) {
      try {
        const task = cron.schedule(apiConfig.schedule, async () => {
          console.log(`Running scheduled API: ${apiConfig.name}`);
          
          // Retry logic
          let attempts = 0;
          const maxAttempts = settings.schedule.retryAttempts || 3;
          
          while (attempts < maxAttempts) {
            try {
              await executeApiCall(apiConfig);
              break; // Success, exit retry loop
            } catch (error) {
              attempts++;
              console.error(`API call attempt ${attempts} failed:`, error.message);
              
              if (attempts < maxAttempts) {
                const delay = settings.schedule.retryDelay || 5;
                console.log(`Retrying in ${delay} minutes...`);
                await new Promise(resolve => setTimeout(resolve, delay * 60 * 1000));
              }
            }
          }
          
          if (attempts >= maxAttempts) {
            console.error(`API call failed after ${maxAttempts} attempts: ${apiConfig.name}`);
          }
        }, {
          scheduled: false,
          timezone: settings.schedule.timezone || 'Asia/Kolkata'
        });
        
        task.start();
        scheduledTasks.push(task);
        
        console.log(`Scheduled API: ${apiConfig.name} with cron: ${apiConfig.schedule}`);
      } catch (error) {
        console.error(`Error scheduling API ${apiConfig.name}:`, error);
      }
    }
  });
  
  console.log(`Scheduled ${scheduledTasks.length} API tasks`);
};

// Initialize scheduled tasks on server start
const initializeScheduledTasks = async () => {
  try {
    const settings = await Settings.getGlobalSettings();
    await restartScheduledTasks(settings);
  } catch (error) {
    console.error('Error initializing scheduled tasks:', error);
  }
};

// Manual trigger for API execution
const triggerApiExecution = async (req, res) => {
  try {
    const { apiId } = req.params;
    const apiConfig = await Settings.getApiConfig(apiId);
    
    if (!apiConfig) {
      return res.status(404).json({
        success: false,
        message: 'API configuration not found'
      });
    }
    
    const leads = await executeApiCall(apiConfig);
    
    res.json({
      success: true,
      message: 'API execution completed',
      data: {
        leadsImported: leads.length,
        apiName: apiConfig.name
      }
    });
  } catch (error) {
    console.error('Manual API execution error:', error);
    res.status(500).json({
      success: false,
      message: 'API execution failed',
      error: error.message
    });
  }
};

// Get field configurations
const getFieldConfigs = async (req, res) => {
  try {
    const settings = await Settings.getGlobalSettings();
    res.json({
      success: true,
      data: settings.fields
    });
  } catch (error) {
    console.error('Error fetching field configs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching field configs',
      error: error.message
    });
  }
};

// Update field configurations
const updateFieldConfigs = async (req, res) => {
  try {
    const { fields } = req.body;
    
    const settings = await Settings.updateGlobalSettings({ fields });
    
    res.json({
      success: true,
      message: 'Field configurations updated successfully',
      data: settings.fields
    });
  } catch (error) {
    console.error('Error updating field configs:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating field configs',
      error: error.message
    });
  }
};

// Get notification configurations
const getNotificationConfigs = async (req, res) => {
  try {
    const settings = await Settings.getGlobalSettings();
    res.json({
      success: true,
      data: settings.notifications
    });
  } catch (error) {
    console.error('Error fetching notification configs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notification configs',
      error: error.message
    });
  }
};

// Update notification configurations
const updateNotificationConfigs = async (req, res) => {
  try {
    const { notifications } = req.body;
    
    const settings = await Settings.updateGlobalSettings({ notifications });
    
    res.json({
      success: true,
      message: 'Notification configurations updated successfully',
      data: settings.notifications
    });
  } catch (error) {
    console.error('Error updating notification configs:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification configs',
      error: error.message
    });
  }
};

module.exports = {
  getSettings,
  saveAllSettings,
  testApiConnection,
  executeApiCall,
  triggerApiExecution,
  getFieldConfigs,
  updateFieldConfigs,
  getNotificationConfigs,
  updateNotificationConfigs,
  initializeScheduledTasks
};
