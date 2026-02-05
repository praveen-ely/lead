const UserPreference = require('../models/userPreferenceModel');
const thirdPartyApiService = require('../services/thirdPartyApiService');
const Lead = require('../models/leadModel');
const fs = require('fs').promises;
const path = require('path');

// Normalize filters (Map to plain object)
const normalizeFilters = (filters) => {
  if (!filters) return {};
  if (filters instanceof Map) {
    return Object.fromEntries(filters);
  }
  if (typeof filters.toObject === 'function') {
    return filters.toObject();
  }
  return filters;
};

// Apply preference defaults with normalization
const applyPreferenceDefaults = (preferences = {}, existing = {}) => ({
  ...existing,
  ...preferences,
  geographic: {
    ...(existing.geographic || {}),
    ...(preferences.geographic || {})
  },
  business: {
    ...(existing.business || {}),
    ...(preferences.business || {})
  },
  triggers: {
    ...(existing.triggers || {}),
    ...(preferences.triggers || {})
  },
  scoring: {
    ...(existing.scoring || {}),
    ...(preferences.scoring || {})
  },
  notifications: {
    ...(existing.notifications || {}),
    ...(preferences.notifications || {})
  },
  api: {
    ...(existing.api || {}),
    ...(preferences.api || {}),
    customKeys: {
      ...normalizeFilters(existing.api?.customKeys),
      ...normalizeFilters(preferences.api?.customKeys)
    }
  },
  customFilters: {
    ...normalizeFilters(existing.customFilters),
    ...normalizeFilters(preferences.customFilters)
  },
  dataKeys: {
    ...normalizeFilters(existing.dataKeys),
    ...normalizeFilters(preferences.dataKeys)
  }
});

// Get user preferences
exports.getUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;

    const userPreference = await UserPreference.findOne({ userId });

    if (!userPreference) {
      return res.status(404).json({
        success: false,
        message: 'User preferences not found'
      });
    }

    res.json({
      success: true,
      data: userPreference
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create or update user preferences
exports.createOrUpdateUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const { preferences } = req.body;

    let userPreference = await UserPreference.findOne({ userId });

    if (userPreference) {
      const existingPreferences = typeof userPreference.preferences?.toObject === 'function'
        ? userPreference.preferences.toObject()
        : userPreference.preferences || {};
      // Update existing preferences (merge to preserve admin API settings)
      userPreference.preferences = applyPreferenceDefaults(preferences, existingPreferences);
      userPreference.updatedAt = new Date();
      await userPreference.save();
    } else {
      // Create new preferences
      userPreference = new UserPreference({
        userId,
        preferences: applyPreferenceDefaults(preferences, {}),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await userPreference.save();
    }

    res.json({
      success: true,
      data: userPreference,
      message: userPreference.isNew ? 'User preferences created successfully' : 'User preferences updated successfully'
    });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get user leads based on preferences
exports.getUserLeads = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      priority = '',
      sortBy = 'dateAdded',
      sortOrder = 'desc'
    } = req.query;

    // Get user preferences (don't return 404 if not found, allow leads to be shown)
    const userPreference = await UserPreference.findOne({ userId });
    
    // Fetch leads from database
    const query = { assignedTo: userId };
    
    // Apply search filter
    if (search) {
      query.$or = [
        { 'customFields.companyName': { $regex: search, $options: 'i' } },
        { 'customFields.email': { $regex: search, $options: 'i' } },
        { 'customFields.website': { $regex: search, $options: 'i' } },
        { leadId: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply status filter
    if (status) {
      query['customFields.leadStatus'] = status;
    }

    // Apply priority filter
    if (priority) {
      query['customFields.priority'] = priority;
    }

    // Sort options
    const sort = {};
    if (sortBy === 'leadId') {
      sort.leadId = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'dateAdded') {
      sort.dateAdded = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort[`customFields.${sortBy}`] = sortOrder === 'desc' ? -1 : 1;
    }

    const leads = await Lead.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Lead.countDocuments(query);

    res.json({
      success: true,
      data: leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      userPreferences: {
        hasPreferences: !!userPreference,
        preferences: userPreference?.preferences || null
      }
    });
  } catch (error) {
    console.error('Error fetching user leads:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user statistics
exports.getUserStatistics = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await UserPreference.getUserStatistics(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Test lead matching
exports.testLeadMatching = async (req, res) => {
  try {
    const { userId } = req.params;
    const { leadData } = req.body;

    const userPreference = await UserPreference.findOne({ userId });

    if (!userPreference) {
      return res.status(404).json({
        success: false,
        message: 'User preferences not found'
      });
    }

    const score = userPreference.calculateLeadScore(leadData);
    const matches = userPreference.matchesLead(leadData);

    res.json({
      success: true,
      data: {
        score,
        matches,
        threshold: userPreference.preferences.scoring.thresholds.minimum,
        category: score >= userPreference.preferences.scoring.thresholds.high ? 'High' :
                 score >= userPreference.preferences.scoring.thresholds.medium ? 'Medium' :
                 score >= userPreference.preferences.scoring.thresholds.low ? 'Low' : 'Very Low'
      }
    });
  } catch (error) {
    console.error('Error testing lead matching:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Trigger manual sync
exports.triggerManualSync = async (req, res) => {
  try {
    const { userId } = req.params;

    const userPreference = await UserPreference.findOne({ userId });

    if (!userPreference) {
      return res.status(404).json({
        success: false,
        message: 'User preferences not found'
      });
    }

    // Simulate API sync process
    const syncResults = await thirdPartyApiService.syncLeadsForUser(userPreference);

    // Update user statistics
    await userPreference.updateStats({
      totalLeads: syncResults.totalLeads || userPreference.stats.totalLeads + Math.floor(Math.random() * 10),
      qualifiedLeads: syncResults.qualifiedLeads || userPreference.stats.qualifiedLeads + Math.floor(Math.random() * 5),
      apiCalls: userPreference.stats.apiCalls + (syncResults.apiCalls || Math.floor(Math.random() * 100)),
      successRate: syncResults.successRate || Math.min(100, userPreference.stats.successRate + Math.random() * 10)
    });

    res.json({
      success: true,
      message: 'Manual sync triggered successfully',
      data: syncResults
    });
  } catch (error) {
    console.error('Error triggering manual sync:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get available preference options - extract from actual leads data
exports.getPreferenceOptions = async (req, res) => {
  try {
    const Lead = require('../models/leadModel');
    
    // Fetch all leads from database (not dummy data) to extract unique values
    // Using lean() for better performance when reading large datasets
    const leads = await Lead.find({}).limit(5000).lean();
    
    console.log(`Extracting options from ${leads.length} actual database leads`);
    
    // Extract unique values from customFields
    const citiesSet = new Set();
    const industriesSet = new Set();
    const companySizesSet = new Set();
    const revenueRangesSet = new Set();
    const triggerEventsSet = new Set();
    const companyTypesSet = new Set();
    const therapeuticAreasSet = new Set();
    const businessModelsSet = new Set();
    const targetMarketsSet = new Set();
    
    // Debug: Log a sample lead structure
    if (leads.length > 0) {
      console.log('Sample lead structure:', JSON.stringify(leads[0], null, 2).substring(0, 500));
      console.log('Sample customFields keys:', Object.keys(leads[0].customFields || {}).slice(0, 20));
      
      // Check for Indian data specifically
      const sampleFields = leads[0].customFields || {};
      console.log('Sample headquarters:', sampleFields.headquarters);
      console.log('Sample city:', sampleFields.city);
      console.log('Sample industry:', sampleFields.industry);
      console.log('Sample revenueRangeCr:', sampleFields.revenueRangeCr);
    }
    
    leads.forEach(lead => {
      // Extract from customFields (primary source) - this is where all lead data is stored
      const customFields = lead.customFields || {};
      
      // Use customFields directly
      const fields = customFields;
      
      // Extract cities from multiple sources
      // 1. Direct city field
      if (fields.city) {
        const city = String(fields.city).trim();
        if (city && city !== 'null' && city !== 'undefined') {
          citiesSet.add(city);
          // Extract city name if it contains state
          const parts = city.split(/\s+/);
          if (parts.length > 0 && parts[0]) {
            const cityName = parts[0].trim();
            if (cityName.length > 1 && !/^\d+$/.test(cityName)) {
              citiesSet.add(cityName);
            }
          }
        }
      }
      
      // 2. Extract cities from headquarters (may contain city + state like "Bengaluru Karnataka")
      if (fields.headquarters) {
        const hq = String(fields.headquarters).trim();
        if (hq && hq !== 'null' && hq !== 'undefined') {
          // Add full headquarters
          citiesSet.add(hq);
          // Extract city name (first word before state)
          const parts = hq.split(/\s+/);
          if (parts.length > 0 && parts[0]) {
            const city = parts[0].trim();
            if (city.length > 1 && !/^\d+$/.test(city)) {
              citiesSet.add(city);
            }
          }
          // Also try to extract state name (usually last word)
          if (parts.length > 1) {
            const state = parts.slice(1).join(' ').trim();
            if (state && state.length > 1) {
              statesSet.add(state);
            }
          }
        }
      }
      
      // 3. Extract from plantLocations (can be string or array)
      if (fields.plantLocations) {
        if (Array.isArray(fields.plantLocations)) {
          fields.plantLocations.forEach(loc => {
            if (loc && String(loc).trim() && String(loc).trim() !== 'null' && String(loc).trim() !== 'undefined') {
              const locStr = String(loc).trim();
              citiesSet.add(locStr);
              // Extract city name if it contains state
              const parts = locStr.split(/\s+/);
              if (parts.length > 0 && parts[0]) {
                const cityName = parts[0].trim();
                if (cityName.length > 1 && !/^\d+$/.test(cityName)) {
                  citiesSet.add(cityName);
                }
              }
            }
          });
        } else if (String(fields.plantLocations).trim()) {
          const locStr = String(fields.plantLocations).trim();
          if (locStr !== 'null' && locStr !== 'undefined') {
            citiesSet.add(locStr);
            const parts = locStr.split(/\s+/);
            if (parts.length > 0 && parts[0]) {
              const cityName = parts[0].trim();
              if (cityName.length > 1 && !/^\d+$/.test(cityName)) {
                citiesSet.add(cityName);
              }
            }
          }
        }
      }
      
      // 4. Extract from manufacturingPlants
      if (fields.manufacturingPlants) {
        if (Array.isArray(fields.manufacturingPlants)) {
          fields.manufacturingPlants.forEach(plant => {
            if (plant && String(plant).trim() && String(plant).trim() !== 'null') {
              const plantStr = String(plant).trim();
              citiesSet.add(plantStr);
              const parts = plantStr.split(/\s+/);
              if (parts.length > 0 && parts[0]) {
                const cityName = parts[0].trim();
                if (cityName.length > 1 && !/^\d+$/.test(cityName)) {
                  citiesSet.add(cityName);
                }
              }
            }
          });
        } else if (String(fields.manufacturingPlants).trim()) {
          const plantStr = String(fields.manufacturingPlants).trim();
          if (plantStr !== 'null' && plantStr !== 'undefined') {
            citiesSet.add(plantStr);
            const parts = plantStr.split(/\s+/);
            if (parts.length > 0 && parts[0]) {
              const cityName = parts[0].trim();
              if (cityName.length > 1 && !/^\d+$/.test(cityName)) {
                citiesSet.add(cityName);
              }
            }
          }
        }
      }
      
      // Extract industry from multiple sources
      if (fields.industry) {
        const industry = String(fields.industry).trim();
        if (industry && industry !== 'null' && industry !== 'undefined') {
          industriesSet.add(industry);
        }
      }
      
      // Extract company sizes (employeeCount)
      if (fields.employeeCount) {
        const size = String(fields.employeeCount).trim();
        if (size && size !== 'null' && size !== 'undefined') {
          companySizesSet.add(size);
        }
      }
      
      // Also check companySize field
      if (fields.companySize) {
        const size = String(fields.companySize).trim();
        if (size && size !== 'null' && size !== 'undefined') {
          companySizesSet.add(size);
        }
      }
      
      // Extract revenue ranges (revenueRangeCr) - preserve original format, add ₹ if missing
      if (fields.revenueRangeCr) {
        const rev = String(fields.revenueRangeCr).trim();
        if (rev && rev !== 'null' && rev !== 'undefined') {
          // Preserve original format from database, just ensure ₹ prefix if missing
          let normalizedRev = rev;
          if (!normalizedRev.includes('₹') && !normalizedRev.includes('$')) {
            // Add ₹ prefix but keep original format (e.g., "5000+" stays "₹5000+", "300-600" stays "₹300-600")
            normalizedRev = `₹${normalizedRev}`;
            // Add Cr suffix only if not already present
            if (!normalizedRev.toLowerCase().includes('cr')) {
              normalizedRev = `${normalizedRev} Cr`;
            }
          } else if (normalizedRev.includes('$')) {
            // Convert $ to ₹
            normalizedRev = normalizedRev.replace(/\$/g, '₹');
            if (!normalizedRev.toLowerCase().includes('cr')) {
              normalizedRev = normalizedRev.replace(/M/g, ' Cr').replace(/B/g, '000 Cr');
            }
          }
          revenueRangesSet.add(normalizedRev);
          // Also add original format for matching
          revenueRangesSet.add(rev);
        }
      }
      
      // Extract trigger events
      if (fields.triggerEvent) {
        triggerEventsSet.add(String(fields.triggerEvent).trim());
      }
      
      // Extract company types
      if (fields.companyType) {
        companyTypesSet.add(String(fields.companyType).trim());
      }
      
      // Extract therapeutic areas
      if (fields.therapeuticAreas) {
        therapeuticAreasSet.add(String(fields.therapeuticAreas).trim());
      }
      
      // Extract business models
      if (fields.businessModel) {
        businessModelsSet.add(String(fields.businessModel).trim());
      }
      
      // Extract target markets
      if (fields.targetMarkets) {
        targetMarketsSet.add(String(fields.targetMarkets).trim());
      }
    });
    
    // Get base options (Indian static options) - this will be prioritized
    const dbCities = Array.from(citiesSet).sort();
    const dbStates = Array.from(statesSet).sort();
    const dbIndustries = Array.from(industriesSet).sort();
    const dbCompanySizes = Array.from(companySizesSet).sort();
    const dbRevenueRanges = Array.from(revenueRangesSet).sort();
    const dbEvents = Array.from(triggerEventsSet).sort();
    const dbCompanyTypes = Array.from(companyTypesSet).sort();
    
    // Get base options (Indian static options)
    const baseOptions = UserPreference.getAvailableOptions();
    
    // Filter database data to prioritize Indian data
    // Common US city/state patterns to filter out
    const usStates = ['AZ', 'CA', 'TX', 'NY', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI', 'CO', 'MN', 'SC', 'AL', 'LA', 'KY', 'OR', 'OK', 'CT', 'IA', 'UT', 'AR', 'NV', 'MS', 'KS', 'NM', 'NE', 'WV', 'ID', 'HI', 'NH', 'ME', 'RI', 'MT', 'DE', 'SD', 'ND', 'AK', 'VT', 'WY', 'DC'];
    const usCities = ['Phoenix', 'Los Angeles', 'Chicago', 'Houston', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'San Francisco', 'Columbus', 'Fort Worth', 'Charlotte', 'Seattle', 'Denver', 'Boston', 'El Paso', 'Detroit', 'Nashville', 'Memphis', 'Portland', 'Oklahoma City', 'Las Vegas', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento', 'Kansas City', 'Mesa', 'Atlanta', 'Omaha', 'Colorado Springs', 'Raleigh', 'Virginia Beach', 'Miami', 'Oakland', 'Minneapolis', 'Tulsa', 'Cleveland', 'Wichita', 'Arlington'];
    
    // Indian city names to identify Indian data
    const indianCityKeywords = ['mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'kolkata', 'pune', 'ahmedabad', 'jaipur', 'surat', 'lucknow', 'kanpur', 'nagpur', 'indore', 'thane', 'bhopal', 'visakhapatnam', 'patna', 'vadodara', 'ghaziabad', 'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut', 'rajkot', 'varanasi', 'srinagar', 'amritsar', 'ranchi', 'jabalpur', 'gwalior', 'vijayawada', 'jodhpur', 'raipur', 'kota', 'guwahati', 'chandigarh', 'solapur', 'hubli', 'mysore', 'bareilly', 'moradabad', 'gurgaon', 'gurugram', 'aligarh', 'jalandhar', 'bhubaneswar', 'salem', 'noida', 'aurangabad', 'dhanbad', 'nellore', 'gaya', 'jammu', 'belagavi', 'mangalore', 'malegaon', 'jalgaon', 'udaipur', 'tirupati', 'karnal', 'panipat', 'darbhanga', 'khandwa', 'morena', 'bilaspur', 'kharagpur', 'bharatpur', 'bardhaman', 'bhiwandi', 'muzaffarpur', 'mathura'];
    
    // Indian state names
    const indianStateKeywords = ['maharashtra', 'karnataka', 'tamil nadu', 'west bengal', 'gujarat', 'rajasthan', 'uttar pradesh', 'andhra pradesh', 'telangana', 'kerala', 'madhya pradesh', 'bihar', 'punjab', 'haryana', 'odisha', 'assam', 'jharkhand', 'chhattisgarh', 'delhi', 'jammu', 'kashmir', 'himachal pradesh', 'uttarakhand', 'goa', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'tripura', 'sikkim', 'arunachal pradesh'];
    
    // Filter database cities - keep Indian cities, filter out US cities
    const filteredDbCities = dbCities.filter(city => {
      const cityLower = city.toLowerCase();
      // Keep if it contains Indian city keywords
      const isIndianCity = indianCityKeywords.some(keyword => cityLower.includes(keyword));
      // Filter out if it's a US city
      const isUSCity = usCities.some(usCity => cityLower.includes(usCity.toLowerCase())) ||
                       usStates.some(usState => cityLower.includes(usState.toLowerCase()));
      
      // If database has Indian data, keep it; otherwise filter out US data
      return isIndianCity || (!isUSCity && cityLower.length > 0);
    });
    
    // Filter database states - keep Indian states, filter out US states
    const filteredDbStates = dbStates.filter(state => {
      const stateLower = state.toLowerCase();
      // Keep if it contains Indian state keywords
      const isIndianState = indianStateKeywords.some(keyword => stateLower.includes(keyword));
      // Filter out if it's a US state
      const isUSState = usStates.some(usState => stateLower === usState.toLowerCase() || stateLower.includes(usState.toLowerCase()));
      
      return isIndianState || (!isUSState && stateLower.length > 0);
    });
    
    // Filter revenue ranges - prioritize ₹ Cr format, filter out $ format
    const filteredDbRevenueRanges = dbRevenueRanges.filter(range => {
      const rangeStr = String(range);
      // Keep ranges with ₹ or Cr, filter out $ or M/B formats
      return rangeStr.includes('₹') || rangeStr.includes('Cr') || 
             (!rangeStr.includes('$') && !rangeStr.match(/\$?\d+[MB]/i));
    });
    
    // Always prioritize Indian static options first
    const options = {
      ...baseOptions,
      // Use Indian static options first, then add filtered database data that doesn't exist in static options
      cities: [...baseOptions.cities, ...filteredDbCities.filter(c => !baseOptions.cities.includes(c))],
      states: [...baseOptions.states, ...filteredDbStates.filter(s => !baseOptions.states.includes(s))],
      industries: [...baseOptions.industries, ...dbIndustries.filter(i => !baseOptions.industries.includes(i))],
      companySizes: [...baseOptions.companySizes, ...dbCompanySizes.filter(s => !baseOptions.companySizes.includes(s))],
      revenueRanges: [...baseOptions.revenueRanges, ...filteredDbRevenueRanges.filter(r => {
        // Check if revenue range already exists in base options (normalized comparison)
        const normalizedR = r.replace(/₹/g, '').replace(/\s*Cr/g, '').trim();
        return !baseOptions.revenueRanges.some(br => {
          const normalizedBr = br.replace(/₹/g, '').replace(/\s*Cr/g, '').trim();
          return normalizedBr === normalizedR;
        });
      })],
      events: [...baseOptions.events, ...dbEvents.filter(e => !baseOptions.events.includes(e))],
      companyTypes: [...baseOptions.companyTypes, ...dbCompanyTypes.filter(t => !baseOptions.companyTypes.includes(t))],
      therapeuticAreas: Array.from(therapeuticAreasSet).sort(),
      businessModels: Array.from(businessModelsSet).sort(),
      targetMarkets: Array.from(targetMarketsSet).sort()
    };
    
    // Log sample data for debugging
    console.log(`Extracted from database: ${dbCities.length} cities, ${dbStates.length} states, ${dbIndustries.length} industries, ${dbCompanySizes.length} company sizes, ${dbRevenueRanges.length} revenue ranges, ${dbEvents.length} trigger events`);
    if (dbCities.length > 0) {
      console.log(`Sample cities (first 15):`, dbCities.slice(0, 15));
    }
    if (dbStates.length > 0) {
      console.log(`Sample states (first 10):`, dbStates.slice(0, 10));
    }
    if (dbIndustries.length > 0) {
      console.log(`Sample industries (first 15):`, dbIndustries.slice(0, 15));
    }
    if (dbRevenueRanges.length > 0) {
      console.log(`Sample revenue ranges (first 10):`, dbRevenueRanges.slice(0, 10));
    }
    if (dbCompanySizes.length > 0) {
      console.log(`Sample company sizes (first 10):`, dbCompanySizes.slice(0, 10));
    }

    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('Error fetching preference options:', error);
    // Fallback to static options if database query fails
    try {
      const options = UserPreference.getAvailableOptions();
      res.json({
        success: true,
        data: options
      });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

// Test API connection
exports.testApiConnection = async (req, res) => {
  try {
    const { api, endpoint, apiKey } = req.body;

    // Simulate API test
    const testResult = await thirdPartyApiService.testApiConnection(api, endpoint, apiKey);

    res.json({
      success: testResult.success,
      message: testResult.message,
      data: testResult.data
    });
  } catch (error) {
    console.error('Error testing API connection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete user preferences
exports.deleteUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;

    const userPreference = await UserPreference.findOneAndDelete({ userId });

    if (!userPreference) {
      return res.status(404).json({
        success: false,
        message: 'User preferences not found'
      });
    }

    res.json({
      success: true,
      message: 'User preferences deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper function to generate mock leads
function generateMockLeads(preferences, limit) {
  const leads = [];
  const statuses = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];
  const priorities = ['High', 'Medium', 'Low'];
  const sources = ['Crunchbase', 'Hunter.io', 'Clearbit', 'LinkedIn', 'Manual'];

  for (let i = 0; i < limit; i++) {
    const city = preferences.geographic.cities[Math.floor(Math.random() * preferences.geographic.cities.length)] || 'New York';
    const state = preferences.geographic.states[Math.floor(Math.random() * preferences.geographic.states.length)] || 'NY';
    const industry = preferences.business.industries[Math.floor(Math.random() * preferences.business.industries.length)] || 'Technology';
    const technology = preferences.business.technologies[Math.floor(Math.random() * preferences.business.technologies.length)] || 'React';
    
    const lead = {
      _id: `lead_${Date.now()}_${i}`,
      leadId: `L${Date.now()}${i.toString().padStart(3, '0')}`,
      source: sources[Math.floor(Math.random() * sources.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      assignedTo: `user${Math.floor(Math.random() * 5) + 1}`,
      data: {
        name: `${['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa'][Math.floor(Math.random() * 6)]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'][Math.floor(Math.random() * 6)]}`,
        email: `contact${i}@example.com`,
        phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        company: `${['Tech', 'Digital', 'Smart', 'Innovative', 'Global'][Math.floor(Math.random() * 5)]} ${['Solutions', 'Systems', 'Technologies', 'Services', 'Labs'][Math.floor(Math.random() * 5)]}`,
        website: `https://company${i}.com`,
        industry: industry,
        city: city,
        state: state,
        country: 'United States',
        employeeRange: preferences.business.employeeRanges[Math.floor(Math.random() * preferences.business.employeeRanges.length)] || '51-250',
        revenueRange: preferences.business.revenueRanges[Math.floor(Math.random() * preferences.business.revenueRanges.length)] || '$1M-$10M',
        technologies: [technology, 'JavaScript', 'Node.js'],
        description: `Leading ${industry.toLowerCase()} company specializing in innovative solutions and cutting-edge technology.`,
        founded: Math.floor(Math.random() * 20) + 2000,
        linkedinProfile: `https://linkedin.com/company/company${i}`,
        score: Math.floor(Math.random() * 40) + 60
      },
      dateAdded: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString(),
      notes: `Generated lead based on user preferences. Interested in ${technology} solutions.`,
      aiProcessed: Math.random() > 0.3,
      aiConfidence: Math.floor(Math.random() * 30) + 70,
      aiModel: 'LeadScoring-v2.1'
    };

    leads.push(lead);
  }

  return leads;
}

// Get lead model preferences from JSON file
exports.getLeadModelPreferences = async (req, res) => {
  try {
    const preferencesPath = path.join(__dirname, '../data/preferences.json');
    
    // Check if file exists
    try {
      await fs.access(preferencesPath);
    } catch (accessError) {
      return res.status(404).json({
        success: false,
        message: 'Preferences file not found',
        error: 'preferences.json does not exist'
      });
    }

    const data = await fs.readFile(preferencesPath, 'utf8');
    const preferences = JSON.parse(data);
    
    res.json({
      success: true,
      data: preferences,
      message: 'Lead model preferences loaded successfully'
    });
  } catch (error) {
    console.error('Error reading preferences.json:', error);
    
    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return res.status(500).json({
        success: false,
        message: 'Invalid JSON in preferences file',
        error: 'The preferences.json file contains invalid JSON'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to load lead model preferences',
      error: error.message
    });
  }
};

// Update lead model preferences JSON file
exports.updateLeadModelPreferences = async (req, res) => {
  try {
    const { preferences } = req.body;
    
    if (!preferences) {
      return res.status(400).json({
        success: false,
        message: 'Preferences data is required'
      });
    }

    const preferencesPath = path.join(__dirname, '../data/preferences.json');
    
    // Update lastUpdated timestamp
    preferences.lastUpdated = new Date().toISOString();
    
    // Write to file
    await fs.writeFile(preferencesPath, JSON.stringify(preferences, null, 2), 'utf8');
    
    res.json({
      success: true,
      data: preferences,
      message: 'Lead model preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating preferences.json:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lead model preferences',
      error: error.message
    });
  }
};
