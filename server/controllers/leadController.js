const mongoose = require('mongoose');
const Lead = require('../models/leadModel');
const AuthUser = require('../models/authUserModel');

// Generate next sequential leadId (A1, A2, A3...)
const generateNextLeadId = async () => {
  try {
    // Get all leads with pattern A\d+ and find the maximum number
    const leads = await Lead.find({ leadId: /^A\d+$/ }).select('leadId');
    let maxNum = 0;
    
    leads.forEach(lead => {
      const match = lead.leadId.match(/^A(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    });
    
    return `A${maxNum + 1}`;
  } catch (error) {
    console.error('Error generating leadId:', error);
    return `A${Date.now()}`;
  }
};

// Generate multiple sequential leadIds for bulk insert
const generateBulkLeadIds = async (count) => {
  try {
    // Get all leads with pattern A\d+ and find the maximum number
    const leads = await Lead.find({ leadId: /^A\d+$/ }).select('leadId');
    let maxNum = 0;
    
    leads.forEach(lead => {
      const match = lead.leadId.match(/^A(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    });
    
    const startNum = maxNum + 1;
    const leadIds = [];
    for (let i = 0; i < count; i++) {
      leadIds.push(`A${startNum + i}`);
    }
    
    return leadIds;
  } catch (error) {
    console.error('Error generating bulk leadIds:', error);
    // Fallback: generate IDs with timestamp
    return Array.from({ length: count }, (_, i) => `A${Date.now()}${i}`);
  }
};

// Merge customFields safely (handles both object and array)
const mergeCustomFields = (existingFields, newData) => {
  if (!existingFields) return newData || {};
  if (Array.isArray(existingFields)) {
    const merged = { ...(existingFields[existingFields.length - 1] || {}) };
    return { ...merged, ...(newData || {}) };
  }
  if (typeof existingFields === 'object') {
    return { ...existingFields, ...(newData || {}) };
  }
  return newData || {};
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildAssignedToConditions = (user) => {
  if (!user) return null;

  const assignedToValueCandidates = new Set();
  const userIdStr = user._id ? user._id.toString() : null;

  if (user.email) assignedToValueCandidates.add(String(user.email));
  if (user.firstName) assignedToValueCandidates.add(String(user.firstName));
  if (user.lastName) assignedToValueCandidates.add(String(user.lastName));
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  if (fullName) assignedToValueCandidates.add(fullName);

  const possibleValues = [];
  if (userIdStr) {
    if (mongoose.Types.ObjectId.isValid(userIdStr)) {
      possibleValues.push(new mongoose.Types.ObjectId(userIdStr));
    }
    possibleValues.push(userIdStr, user._id);
  }
  assignedToValueCandidates.forEach((value) => possibleValues.push(value));

  const stringCandidates = Array.from(new Set(possibleValues.filter((value) => typeof value === 'string' && value)));
  const regexPattern = stringCandidates.length
    ? `^(?:${stringCandidates.map(escapeRegex).join('|')})$`
    : null;

  const assignedToConditions = {
    $or: [
      { assignedTo: { $in: possibleValues } },
      { 'customFields.assignedTo': { $in: possibleValues } },
      { 'data.assignedTo': { $in: possibleValues } },
      { 'assignedTo._id': { $in: possibleValues } },
      { 'assignedTo.id': { $in: possibleValues } },
      { 'assignedTo.userId': { $in: possibleValues } },
      { 'assignedTo.email': { $in: possibleValues } },
      { 'assignedTo.name': { $in: possibleValues } },
      { 'assignedTo.fullName': { $in: possibleValues } },
      { 'customFields.assignedTo._id': { $in: possibleValues } },
      { 'customFields.assignedTo.id': { $in: possibleValues } },
      { 'customFields.assignedTo.userId': { $in: possibleValues } },
      { 'customFields.assignedTo.email': { $in: possibleValues } },
      { 'customFields.assignedTo.name': { $in: possibleValues } },
      { 'customFields.assignedTo.fullName': { $in: possibleValues } },
      { 'data.assignedTo._id': { $in: possibleValues } },
      { 'data.assignedTo.id': { $in: possibleValues } },
      { 'data.assignedTo.userId': { $in: possibleValues } },
      { 'data.assignedTo.email': { $in: possibleValues } },
      { 'data.assignedTo.name': { $in: possibleValues } },
      { 'data.assignedTo.fullName': { $in: possibleValues } }
    ]
  };

  if (regexPattern) {
    assignedToConditions.$or.push(
      { assignedTo: { $regex: regexPattern, $options: 'i' } },
      { 'customFields.assignedTo': { $regex: regexPattern, $options: 'i' } },
      { 'data.assignedTo': { $regex: regexPattern, $options: 'i' } }
    );
  }
  if (userIdStr) {
    assignedToConditions.$or.push(
      { assignedTo: { $regex: escapeRegex(userIdStr), $options: 'i' } },
      { 'customFields.assignedTo': { $regex: escapeRegex(userIdStr), $options: 'i' } },
      { 'data.assignedTo': { $regex: escapeRegex(userIdStr), $options: 'i' } }
    );
  }

  return assignedToConditions;
};

// Get all leads with pagination, search, and filtering based on user preferences
exports.getAllLeads = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      priority = '',
      sortBy = 'dateAdded',
      sortOrder = 'desc',
      applyPreferences = 'false',
      includeAll = 'false'
    } = req.query;

    const usePreferences = String(applyPreferences).toLowerCase() === 'true';
    const showAllLeads = String(includeAll).toLowerCase() === 'true';

    // Get logged-in user (optional when includeAll=true and preferences disabled)
    const user = await AuthUser.findById(req.user?._id || req.userId);
    if (!user && (usePreferences || !showAllLeads)) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const query = {};
    const assignedToConditions = buildAssignedToConditions(user);

    // Filter based on user preferences (optional)
    if (usePreferences && user?.preferences) {
      const orConditions = [];

      // Geographic filtering - matches customFields.headquarters, customFields.city, customFields.plantLocations, or data.headquarters
      if (user.preferences.geographic && user.preferences.geographic.cities.length > 0) {
        orConditions.push({
          $or: user.preferences.geographic.cities.map(city => {
            // Extract city name if it contains state (e.g., "Bengaluru Karnataka" -> match "Bengaluru")
            const cityParts = city.split(/\s+/);
            const cityName = cityParts[0];
            return {
              $or: [
                { city: { $regex: city, $options: 'i' } },
                { 'customFields.city': { $regex: city, $options: 'i' } },
                { 'customFields.headquarters': { $regex: city, $options: 'i' } },
                { 'customFields.headquarters': { $regex: cityName, $options: 'i' } },
                { 'customFields.plantLocations': { $regex: city, $options: 'i' } },
                { 'data.headquarters': { $regex: city, $options: 'i' } },
                { 'data.headquarters': { $regex: cityName, $options: 'i' } },
                { 'data.plantLocations': { $regex: city, $options: 'i' } }
              ]
            };
          })
        });
      }

      // Business filtering - Industries (matches customFields.industry or data.industry)
      if (user.preferences.business && user.preferences.business.industries.length > 0) {
        orConditions.push({
          $or: user.preferences.business.industries.map(industry => ({
            $or: [
              { industry: { $regex: industry, $options: 'i' } },
              { 'customFields.industry': { $regex: industry, $options: 'i' } },
              { 'data.industry': { $regex: industry, $options: 'i' } }
            ]
          }))
        });
      }

      // Business filtering - Company Sizes (matches customFields.employeeCount or data.employeeCount)
      if (user.preferences.business && user.preferences.business.companySizes.length > 0) {
        orConditions.push({
          $or: user.preferences.business.companySizes.map(size => ({
            $or: [
              { companySize: { $regex: size, $options: 'i' } },
              { 'customFields.companySize': { $regex: size, $options: 'i' } },
              { 'customFields.employeeCount': { $regex: size, $options: 'i' } },
              { 'data.employeeCount': { $regex: size, $options: 'i' } }
            ]
          }))
        });
      }

      // Business filtering - Revenue Ranges (matches customFields.revenueRangeCr)
      if (user.preferences.business && user.preferences.business.revenueRanges.length > 0) {
        orConditions.push({
          $or: user.preferences.business.revenueRanges.map(revenue => {
            // Convert ₹ format to match revenueRangeCr format (e.g., "300-600" or "5000+")
            let cleanRevenue = revenue.replace(/₹/g, '').replace(/\s*Cr/g, '').trim();
            // Remove + sign for matching
            const cleanRevenueNoPlus = cleanRevenue.replace(/\+/g, '');
            return {
              $or: [
                { revenue: { $regex: revenue, $options: 'i' } },
                { 'customFields.revenue': { $regex: revenue, $options: 'i' } },
                { 'customFields.revenueRangeCr': { $regex: cleanRevenue, $options: 'i' } },
                { 'customFields.revenueRangeCr': { $regex: cleanRevenueNoPlus, $options: 'i' } },
                { 'data.revenueRangeCr': { $regex: cleanRevenue, $options: 'i' } },
                { 'data.revenueRangeCr': { $regex: cleanRevenueNoPlus, $options: 'i' } }
              ]
            };
          })
        });
      }

      // Triggers filtering - Events (matches customFields.triggerEvent or data.triggerEvent)
      if (user.preferences.triggers && user.preferences.triggers.events.length > 0) {
        orConditions.push({
          $or: user.preferences.triggers.events.map(event => ({
            $or: [
              { 'customFields.triggerEvent': { $regex: event, $options: 'i' } },
              { 'data.triggerEvent': { $regex: event, $options: 'i' } }
            ]
          }))
        });
      }

      // Triggers filtering - Keywords
      if (user.preferences.triggers && user.preferences.triggers.keywords.length > 0) {
        orConditions.push({
          $or: user.preferences.triggers.keywords.map(keyword => ({
            $or: [
              { description: { $regex: keyword, $options: 'i' } },
              { notes: { $regex: keyword, $options: 'i' } },
              { 'customFields.description': { $regex: keyword, $options: 'i' } }
            ]
          }))
        });
      }

      // Triggers filtering - Technologies
      if (user.preferences.triggers && user.preferences.triggers.technologies.length > 0) {
        orConditions.push({
          $or: user.preferences.triggers.technologies.map(tech => ({
            $or: [
              { technologies: { $in: [tech] } },
              { 'customFields.technologies': { $in: [tech] } }
            ]
          }))
        });
      }

      // PREFERENCES ARE COMPLETELY OPTIONAL
      // - If preferences are NOT set or all arrays are empty: query = {} matches ALL leads
      // - If preferences ARE set: use $or to match leads that satisfy ANY preference condition
      // - This ensures leads always show, preferences just help filter when set
      if (orConditions.length > 0) {
        // Use $or so leads matching ANY preference will show
        // Preferences help filter but are NOT required - leads show even if preferences don't match
        query.$or = orConditions;
      }
    }
    // If no preferences exist or all preference arrays are empty, query remains {} which matches ALL leads
    // If no preferences exist or all preference arrays are empty, query = {} matches all leads

    if (!showAllLeads && assignedToConditions) {
      if (query.$or) {
        query.$and = [{ $or: query.$or }, assignedToConditions];
        delete query.$or;
      } else {
        Object.assign(query, assignedToConditions);
      }
    }

    // Add search filter (including customFields)
    if (search) {
      const searchCondition = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { leadId: { $regex: search, $options: 'i' } },
          { 'customFields': { $regex: search, $options: 'i' } }
        ]
      };
      
      if (query.$and) {
        query.$and.push(searchCondition);
      } else {
        Object.assign(query, searchCondition);
      }
    }

    // Add status filter
    if (status) {
      if (query.$and) {
        query.$and.push({ status });
      } else {
        query.status = status;
      }
    }

    // Add priority filter
    if (priority) {
      if (query.$and) {
        query.$and.push({ priority });
      } else {
        query.priority = priority;
      }
    }

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

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
        hasPreferences: !!user?.preferences,
        preferences: user?.preferences || null,
        filteredByPreferences: usePreferences && !!(query.$and && query.$and.length > 0)
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get lead statistics
exports.getLeadStats = async (req, res) => {
  try {
    const stats = await Lead.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get lead filter options
exports.getLeadFilters = async (req, res) => {
  try {
    const statuses = await Lead.distinct('status');
    const priorities = await Lead.distinct('priority');

    res.json({
      success: true,
      data: {
        statuses,
        priorities
      }
    });
  } catch (error) {
    console.error('Error fetching lead filters:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Search leads by dynamic field
exports.searchLeadsByField = async (req, res) => {
  try {
    const { field, value } = req.params;
    const query = {};
    query[field] = { $regex: value, $options: 'i' };

    const leads = await Lead.find(query);

    res.json({
      success: true,
      data: leads
    });
  } catch (error) {
    console.error('Error searching leads:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get field statistics
exports.getFieldStatistics = async (req, res) => {
  try {
    const { fieldName } = req.params;
    const stats = await Lead.aggregate([
      {
        $group: {
          _id: `$${fieldName}`,
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching field statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single lead by ID
exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get single lead by leadId
exports.getLeadByLeadId = async (req, res) => {
  try {
    const lead = await Lead.findOne({ leadId: req.params.leadId });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error fetching lead by leadId:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create new lead
exports.createLead = async (req, res) => {
  try {
    const lead = new Lead(req.body);
    await lead.save();

    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Insert lead (alias for create)
exports.insertLead = async (req, res) => {
  try {
    const lead = new Lead(req.body);
    await lead.save();

    res.status(201).json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error inserting lead:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create lead by leadId (public, auto-generates leadId if not provided)
// Supports both formats:
// 1. Single lead: { leadId, assignedTo, data: {...} }
// 2. Bulk leads: { assignedTo, data: [{ leadId, ... }, { leadId, ... }] }
// assignedTo must be provided in request body (no token required)
exports.createLeadByLeadId = async (req, res) => {
  console.log('=== ENDPOINT HIT ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Body exists:', !!req.body);
  console.log('Body keys:', req.body ? Object.keys(req.body) : 'no body');
  
  try {
    console.log('=== INSERT LEAD REQUEST ===');
    console.log('Request body keys:', Object.keys(req.body || {}));
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    let { leadId, assignedTo = null, data = {} } = req.body || {};
    
    console.log('Extracted values:');
    console.log('  - leadId:', leadId);
    console.log('  - assignedTo:', assignedTo);
    console.log('  - data type:', Array.isArray(data) ? 'array' : typeof data);
    console.log('  - data length:', Array.isArray(data) ? data.length : 'N/A');
    console.log('  - data sample:', Array.isArray(data) && data.length > 0 ? JSON.stringify(data[0]).substring(0, 200) : JSON.stringify(data).substring(0, 200));
    
    // Validate and convert assignedTo to ObjectId if provided
    let assignedToObjectId = null;
    if (assignedTo) {
      try {
        // Validate that assignedTo is a valid user ID
        const user = await AuthUser.findById(assignedTo);
        if (!user) {
          return res.status(400).json({
            success: false,
            message: `Invalid assignedTo: User with ID "${assignedTo}" does not exist`,
            error: 'User not found'
          });
        }
        // Convert to ObjectId - ensure it's a proper ObjectId instance
        if (mongoose.Types.ObjectId.isValid(assignedTo)) {
          assignedToObjectId = new mongoose.Types.ObjectId(assignedTo);
        } else {
          return res.status(400).json({
            success: false,
            message: `Invalid assignedTo format: "${assignedTo}" is not a valid ObjectId`,
            error: 'Invalid ObjectId format'
          });
        }
        console.log('assignedTo validated - User exists:', user.email, 'ObjectId:', assignedToObjectId);
      } catch (error) {
        // Check if it's an invalid ObjectId format
        if (error.name === 'CastError' || error.kind === 'ObjectId') {
          return res.status(400).json({
            success: false,
            message: `Invalid assignedTo format: "${assignedTo}" is not a valid user ID`,
            error: 'Invalid ObjectId format'
          });
        }
        throw error;
      }
    }
    
    // Check if data is an array (bulk insert format)
    if (Array.isArray(data)) {
      console.log('Processing bulk insert with', data.length, 'leads');
      // Handle bulk insert format: { assignedTo, data: [...] }
      const createdLeads = [];
      const errors = [];
      
      // Generate sequential leadIds for all leads (ignore any leadId in data)
      const leadIds = await generateBulkLeadIds(data.length);
      console.log('Generated leadIds:', leadIds);
      
      for (let i = 0; i < data.length; i++) {
        try {
          const leadData = data[i];
          // Always use auto-generated leadId, ignore any leadId in leadData
          const currentLeadId = leadIds[i];
          
          console.log(`Processing lead ${i + 1}/${data.length}: leadId=${currentLeadId}`);
          
          // Use all fields from leadData as customFields (leadId is ignored)
          const customFields = { ...leadData };
          // Remove leadId if it exists in the data (case-insensitive check)
          delete customFields.leadId;
          delete customFields.LeadId;
          delete customFields.LEADID;
          delete customFields.LEAD_ID;
          
          console.log(`Lead ${i + 1} - customFields keys:`, Object.keys(customFields).slice(0, 10));
          console.log(`Lead ${i + 1} - assignedTo:`, assignedTo);

          // Check if lead exists (shouldn't happen with sequential IDs, but check anyway)
          const existing = await Lead.findOne({ leadId: currentLeadId.toString() });
          if (existing) {
            console.log(`Lead ${i + 1} - Already exists, updating...`);
            // Merge customFields
            const mergedFields = mergeCustomFields(existing.customFields, customFields);
            existing.customFields = mergedFields;
            if (assignedToObjectId) {
              existing.assignedTo = assignedToObjectId;
            }
            existing.dateUpdated = new Date();
            const saved = await existing.save();
            console.log(`Lead ${i + 1} - Updated successfully, _id:`, saved._id);
            createdLeads.push(existing);
          } else {
            console.log(`Lead ${i + 1} - Creating new lead...`);
            // Create new lead
            const lead = new Lead({
              leadId: currentLeadId.toString(),
              id: currentLeadId.toString(),
              primaryField: { key: 'leadId', value: currentLeadId.toString() },
              assignedTo: assignedToObjectId,
              customFields,
              dateAdded: new Date(),
              dateUpdated: new Date()
            });
            console.log(`Lead ${i + 1} - Lead object created, saving...`);
            console.log(`Lead ${i + 1} - Lead data before save:`, JSON.stringify({
              leadId: lead.leadId,
              assignedTo: lead.assignedTo,
              customFieldsKeys: Object.keys(lead.customFields || {}).slice(0, 5)
            }));
            
            const saved = await lead.save();
            console.log(`Lead ${i + 1} - Saved successfully, _id:`, saved._id);
            console.log(`Lead ${i + 1} - Saved leadId:`, saved.leadId);
            
            // Verify it was actually saved
            const verifyLead = await Lead.findById(saved._id);
            if (!verifyLead) {
              throw new Error(`Lead ${i + 1} - Verification failed: Lead not found after save`);
            }
            console.log(`Lead ${i + 1} - Verified in database:`, verifyLead.leadId);
            
            createdLeads.push(saved);
          }
        } catch (error) {
          console.error(`Error processing lead ${i + 1}:`, error);
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);
          console.error('Error code:', error.code);
          console.error('Error stack:', error.stack);
          
          // Check for specific MongoDB errors
          if (error.name === 'ValidationError') {
            console.error('Validation errors:', error.errors);
            errors.push({ 
              index: i, 
              error: error.message, 
              validationErrors: error.errors,
              leadData: leadData 
            });
          } else if (error.code === 11000) {
            console.error('Duplicate key error:', error.keyPattern);
            errors.push({ 
              index: i, 
              error: `Duplicate leadId: ${error.keyValue?.leadId || 'unknown'}`,
              duplicateKey: error.keyPattern 
            });
          } else {
            errors.push({ 
              index: i, 
              error: error.message, 
              errorName: error.name,
              errorCode: error.code,
              stack: error.stack 
            });
          }
        }
      }
      
      console.log(`Bulk insert completed: ${createdLeads.length} leads created/updated, ${errors.length} errors`);
      
      // If no leads were created and there are errors, return error response
      if (createdLeads.length === 0 && errors.length > 0) {
        console.error('=== BULK INSERT FAILED - NO LEADS CREATED ===');
        console.error('Errors:', errors);
        return res.status(400).json({
          success: false,
          message: 'Failed to create any leads',
          errors: errors,
          count: 0
        });
      }
      
      // If some leads failed but some succeeded, still return success but include errors
      if (errors.length > 0) {
        console.warn(`=== BULK INSERT PARTIAL SUCCESS ===`);
        console.warn(`${createdLeads.length} leads created, ${errors.length} errors`);
        console.warn('Errors:', errors);
      }
      
      console.log('=== BULK INSERT RESPONSE ===');
      console.log('Success:', true);
      console.log('Count:', createdLeads.length);
      console.log('Errors:', errors.length > 0 ? errors : 'none');
      console.log('Sample lead _id:', createdLeads[0]?._id);
      
      // Convert Mongoose documents to plain objects for JSON response
      const leadsData = createdLeads.map(lead => {
        try {
          const leadObj = lead.toObject ? lead.toObject() : JSON.parse(JSON.stringify(lead));
          return {
            _id: leadObj._id?.toString() || leadObj._id,
            leadId: leadObj.leadId,
            id: leadObj.id,
            assignedTo: leadObj.assignedTo,
            customFields: leadObj.customFields || {},
            dateAdded: leadObj.dateAdded,
            dateUpdated: leadObj.dateUpdated,
            createdAt: leadObj.createdAt,
            updatedAt: leadObj.updatedAt
          };
        } catch (err) {
          console.error('Error converting lead to object:', err);
          return lead;
        }
      });
      
      console.log('Leads data prepared:', leadsData.length, 'leads');
      console.log('Sample lead data:', JSON.stringify(leadsData[0] || {}).substring(0, 300));
      
      const response = {
        success: true,
        message: `Successfully inserted ${createdLeads.length} leads`,
        data: leadsData,
        count: createdLeads.length
      };
      
      if (errors.length > 0) {
        response.errors = errors;
      }
      
      console.log('Final response structure:', {
        success: response.success,
        message: response.message,
        count: response.count,
        dataLength: response.data.length,
        hasErrors: !!response.errors
      });
      
      return res.status(201).json(response);
    }

    // Handle single lead format: { leadId, assignedTo, data: {...} }
    // Auto-generate leadId if not provided
    if (!leadId) {
      leadId = await generateNextLeadId();
    }

    if (!data || typeof data !== 'object') {
      data = {};
    }

    // Check if lead exists
    const existing = await Lead.findOne({ leadId: leadId.toString() });
    if (existing) {
      // Merge customFields
      const mergedFields = mergeCustomFields(existing.customFields, data);
      existing.customFields = mergedFields;
      if (assignedToObjectId) {
        existing.assignedTo = assignedToObjectId;
      }
      existing.dateUpdated = new Date();
      await existing.save();
      return res.status(200).json({
        success: true,
        data: existing
      });
    }

    // Create new lead
    const lead = new Lead({
      leadId: leadId.toString(),
      id: leadId.toString(),
      primaryField: { key: 'leadId', value: leadId.toString() },
      assignedTo: assignedToObjectId,
      customFields: data,
      dateAdded: new Date(),
      dateUpdated: new Date()
    });
    console.log('Saving single lead...');
    const saved = await lead.save();
    console.log('Single lead saved successfully, _id:', saved._id);

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: lead
    });
  } catch (error) {
    console.error('=== ERROR CREATING LEAD ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    
    // Check if it's a MongoDB duplicate key error
    if (error.code === 11000 || error.name === 'MongoServerError') {
      console.error('MongoDB duplicate key error detected');
      return res.status(400).json({
        success: false,
        message: 'Lead with this leadId already exists',
        error: error.message,
        duplicateKey: error.keyPattern || error.keyValue
      });
    }
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      console.error('Mongoose validation error detected');
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message,
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      errorName: error.name,
      errorCode: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Bulk insert leads (public, auto-generates leadIds)
// Supports format: { assignedTo, leads: [...] } or { assignedTo, data: [...] }
exports.createBulkLeadsByLeadId = async (req, res) => {
  try {
    let { leads = [], data = [], assignedTo = null } = req.body || {};
    
    // Validate and convert assignedTo to ObjectId if provided
    let assignedToObjectId = null;
    if (assignedTo) {
      try {
        // Validate that assignedTo is a valid user ID
        const user = await AuthUser.findById(assignedTo);
        if (!user) {
          return res.status(400).json({
            success: false,
            message: `Invalid assignedTo: User with ID "${assignedTo}" does not exist`,
            error: 'User not found'
          });
        }
        // Convert to ObjectId - ensure it's a proper ObjectId instance
        if (mongoose.Types.ObjectId.isValid(assignedTo)) {
          assignedToObjectId = new mongoose.Types.ObjectId(assignedTo);
        } else {
          return res.status(400).json({
            success: false,
            message: `Invalid assignedTo format: "${assignedTo}" is not a valid ObjectId`,
            error: 'Invalid ObjectId format'
          });
        }
        console.log('assignedTo validated - User exists:', user.email, 'ObjectId:', assignedToObjectId);
      } catch (error) {
        // Check if it's an invalid ObjectId format
        if (error.name === 'CastError' || error.kind === 'ObjectId') {
          return res.status(400).json({
            success: false,
            message: `Invalid assignedTo format: "${assignedTo}" is not a valid user ID`,
            error: 'Invalid ObjectId format'
          });
        }
        throw error;
      }
    }
    
    // Support both 'leads' and 'data' array formats
    const leadDataArray = leads.length > 0 ? leads : data;
    
    if (!Array.isArray(leadDataArray) || leadDataArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'leads or data array is required'
      });
    }

    console.log('Processing bulk insert via /insert/bulk with', leadDataArray.length, 'leads');
    
    // Generate sequential leadIds for all leads (ignore any leadId in data)
    const leadIds = await generateBulkLeadIds(leadDataArray.length);
    console.log('Generated leadIds:', leadIds);

    const createdLeads = [];
    const errors = [];
    
    for (let i = 0; i < leadDataArray.length; i++) {
      try {
        const leadData = leadDataArray[i];
        // Always use auto-generated leadId, ignore any leadId in leadData
        const currentLeadId = leadIds[i];
        
        // Use all fields from leadData as customFields (leadId is ignored)
        const customFields = { ...leadData };
        // Remove leadId if it exists in the data (check all possible variations)
        delete customFields.leadId;
        delete customFields.LeadId;
        delete customFields.LEADID;
        delete customFields.LEAD_ID;
        delete customFields.lead_id;
        
        // Also check if leadData has nested 'data' field (old format support)
        let finalCustomFields = customFields;
        if (customFields.data && typeof customFields.data === 'object') {
          finalCustomFields = { ...customFields.data };
          // Remove leadId from nested data too
          delete finalCustomFields.leadId;
          delete finalCustomFields.LeadId;
          delete finalCustomFields.LEADID;
        }

        const existing = await Lead.findOne({ leadId: currentLeadId.toString() });
        if (existing) {
          const mergedFields = mergeCustomFields(existing.customFields, finalCustomFields);
          existing.customFields = mergedFields;
          if (assignedToObjectId) {
            existing.assignedTo = assignedToObjectId;
          }
          existing.dateUpdated = new Date();
          await existing.save();
          createdLeads.push(existing);
        } else {
          const lead = new Lead({
            leadId: currentLeadId.toString(),
            id: currentLeadId.toString(),
            primaryField: { key: 'leadId', value: currentLeadId.toString() },
            assignedTo: assignedToObjectId,
            customFields: finalCustomFields,
            dateAdded: new Date(),
            dateUpdated: new Date()
          });
          await lead.save();
          createdLeads.push(lead);
        }
      } catch (error) {
        console.error(`Error processing lead ${i + 1}:`, error);
        errors.push({ index: i, error: error.message });
      }
    }

    // Convert Mongoose documents to plain objects for JSON response
    const leadsData = createdLeads.map(lead => {
      try {
        const leadObj = lead.toObject ? lead.toObject() : JSON.parse(JSON.stringify(lead));
        return {
          _id: leadObj._id?.toString() || leadObj._id,
          leadId: leadObj.leadId,
          id: leadObj.id,
          assignedTo: leadObj.assignedTo,
          customFields: leadObj.customFields || {},
          dateAdded: leadObj.dateAdded,
          dateUpdated: leadObj.dateUpdated,
          createdAt: leadObj.createdAt,
          updatedAt: leadObj.updatedAt
        };
      } catch (err) {
        console.error('Error converting lead to object:', err);
        return lead;
      }
    });

    const response = {
      success: true,
      message: `Successfully inserted ${createdLeads.length} leads`,
      data: leadsData,
      count: createdLeads.length
    };
    
    if (errors.length > 0) {
      response.errors = errors;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating bulk leads:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create bulk leads
exports.createBulkLeads = async (req, res) => {
  try {
    const leads = await Lead.insertMany(req.body);

    res.status(201).json({
      success: true,
      data: leads
    });
  } catch (error) {
    console.error('Error creating bulk leads:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update lead by ID
exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update lead by leadId (supports /update with leadId param or body)
exports.updateLeadByLeadId = async (req, res) => {
  try {
    const leadId = req.params.leadId || req.body.leadId;
    let { data = {}, assignedTo = null } = req.body || {};

    if (!leadId) {
      return res.status(400).json({
        success: false,
        message: 'leadId is required'
      });
    }

    const lead = await Lead.findOne({ leadId: leadId.toString() });
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Merge customFields (accept object or single-item array)
    if (Array.isArray(data)) {
      data = data[0] || {};
    }
    if (data && typeof data === 'object') {
      lead.customFields = mergeCustomFields(lead.customFields, data);
    }
    if (assignedTo) {
      lead.assignedTo = assignedTo;
    }
    lead.dateUpdated = new Date();
    await lead.save();

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error updating lead by leadId:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update lead by leadId from body (for bulk updates)
exports.updateLeadByLeadIdFromBody = async (req, res) => {
  try {
    const { leads = [], assignedTo = null, leadId, data } = req.body || {};
    let leadsToUpdate = Array.isArray(leads) && leads.length
      ? leads
      : leadId
        ? [{ leadId, data }]
        : [];

    if (leadsToUpdate.length === 0 && Array.isArray(data) && data.length) {
      const derived = data
        .map((item) => ({
          leadId: item?.leadId || item?.leadID || item?.id || item?.Id || '',
          data: item
        }))
        .filter((item) => item.leadId);
      if (derived.length) {
        leadsToUpdate = derived;
      }
    }

    // Deduplicate by leadId (keep last entry)
    if (leadsToUpdate.length > 1) {
      const dedupedMap = new Map();
      leadsToUpdate.forEach((item) => {
        if (!item?.leadId) return;
        dedupedMap.set(String(item.leadId), item);
      });
      leadsToUpdate = Array.from(dedupedMap.values());
    }

    if (!Array.isArray(leadsToUpdate) || leadsToUpdate.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'leads array or leadId is required'
      });
    }

    const updatedLeads = [];
    for (const leadData of leadsToUpdate) {
      let { leadId, data = {} } = leadData;
      
      if (!leadId) {
        continue;
      }

      const lead = await Lead.findOne({ leadId: leadId.toString() });
      if (!lead) {
        continue;
      }

      if (Array.isArray(data)) {
        data = data[0] || {};
      }
      if (data && typeof data === 'object') {
        lead.customFields = mergeCustomFields(lead.customFields, data);
      }
      if (assignedTo) {
        lead.assignedTo = assignedTo;
      }
      lead.dateUpdated = new Date();
      await lead.save();
      updatedLeads.push(lead);
    }

    res.json({
      success: true,
      data: updatedLeads,
      count: updatedLeads.length
    });
  } catch (error) {
    console.error('Error updating leads by leadId:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Partial update lead by ID
exports.patchLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error patching lead:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete lead by ID
exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete bulk leads
exports.deleteBulkLeads = async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await Lead.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} leads successfully`
    });
  } catch (error) {
    console.error('Error deleting bulk leads:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};