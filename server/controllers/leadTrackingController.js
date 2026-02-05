const LeadTracking = require('../models/leadTrackingModel');
const UserPreference = require('../models/userPreferenceModel');
const Lead = require('../models/leadModel');

// Get user's tracked leads
exports.getUserTrackedLeads = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, minScore, maxScore, limit = 50, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const options = {
      status,
      minScore: minScore ? parseInt(minScore) : undefined,
      maxScore: maxScore ? parseInt(maxScore) : undefined,
      limit: parseInt(limit),
      page: parseInt(page),
      sortBy,
      sortOrder
    };

    const result = await LeadTracking.getUserTrackedLeads(userId, options);

    res.json({
      success: true,
      data: result.leads,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error getting user tracked leads:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user tracking statistics
exports.getUserTrackingStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const stats = await LeadTracking.getUserTrackingStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting user tracking stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Match leads for user based on preferences
exports.matchLeadsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100 } = req.body;

    // Get user preferences
    const userPreference = await UserPreference.findOne({ userId });
    if (!userPreference) {
      return res.status(404).json({
        success: false,
        message: 'User preferences not found. Please set up your preferences first.'
      });
    }

    // Get all leads
    const leads = await Lead.find({}).limit(limit);

    const matchedLeads = [];
    const trackings = [];

    // Use default threshold if not set
    const minimumScore = userPreference.preferences.scoring?.thresholds?.minimum || 40;

    for (const lead of leads) {
      const score = userPreference.calculateLeadScore(lead.toObject());
      
      if (score >= minimumScore) {
        // Check if already tracked
        const existingTracking = await LeadTracking.findOne({ 
          userId, 
          leadId: lead._id.toString() 
        });

        if (!existingTracking) {
          const tracking = new LeadTracking({
            userId,
            leadId: lead._id.toString(),
            preferenceId: userPreference._id.toString(),
            score,
            status: 'matched',
            matchedCriteria: {
              industry: lead.customFields?.industry && userPreference.preferences.business.industries.includes(lead.customFields.industry),
              location: lead.customFields?.city && userPreference.preferences.geographic.cities.includes(lead.customFields.city),
              size: lead.customFields?.companySize && userPreference.preferences.business.companySizes.includes(lead.customFields.companySize),
              technology: lead.customFields?.technologies && lead.customFields.technologies.some(tech => userPreference.preferences.business.technologies.includes(tech)),
              triggers: lead.customFields?.status && userPreference.preferences.triggers.events.includes(lead.customFields.status),
              revenue: lead.customFields?.revenue && userPreference.preferences.business.revenueRanges.includes(lead.customFields.revenue)
            },
            metadata: {
              source: 'auto_matching',
              matchedAt: new Date(),
              algorithm: 'v2.1'
            }
          });

          await tracking.save();
          trackings.push(tracking);
        }

        // Format lead data for response
        const formattedLead = {
          _id: lead._id,
          leadId: lead.leadId || lead._id.toString(),
          source: lead.source || 'Database',
          status: lead.status || 'New',
          priority: lead.priority || 'Medium',
          score: score,
          data: {
            name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown',
            email: lead.email || 'N/A',
            phone: lead.phone || 'N/A',
            company: lead.company || 'N/A',
            industry: lead.industry || lead.customFields?.industry || 'N/A',
            city: lead.city || lead.customFields?.city || 'N/A',
            state: lead.state || 'N/A',
            technologies: lead.technologies || lead.customFields?.technologies || []
          },
          dateAdded: lead.createdAt || new Date()
        };

        matchedLeads.push(formattedLead);
      }
    }

    res.json({
      success: true,
      data: {
        leads: matchedLeads,
        totalMatched: matchedLeads.length,
        totalProcessed: leads.length,
        minimumScore: minimumScore
      }
    });
  } catch (error) {
    console.error('Error matching leads for user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to match leads'
    });
  }
};

// Update lead tracking status
exports.updateLeadStatus = async (req, res) => {
  try {
    const { userId, trackingId } = req.params;
    const { status, details } = req.body;

    const tracking = await LeadTracking.findOne({ _id: trackingId, userId });
    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'Lead tracking not found'
      });
    }

    await tracking.updateStatus(status, details, userId);

    res.json({
      success: true,
      data: tracking
    });
  } catch (error) {
    console.error('Error updating lead status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Add action to lead tracking
exports.addLeadAction = async (req, res) => {
  try {
    const { userId, trackingId } = req.params;
    const { type, details } = req.body;

    const tracking = await LeadTracking.findOne({ _id: trackingId, userId });
    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'Lead tracking not found'
      });
    }

    await tracking.addAction(type, details, userId);

    res.json({
      success: true,
      data: tracking
    });
  } catch (error) {
    console.error('Error adding lead action:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get trending leads for user
exports.getTrendingLeads = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const trendingLeads = await LeadTracking.getTrendingLeads(userId, parseInt(limit));

    res.json({
      success: true,
      data: trendingLeads
    });
  } catch (error) {
    console.error('Error getting trending leads:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete lead tracking
exports.deleteLeadTracking = async (req, res) => {
  try {
    const { userId, trackingId } = req.params;

    const tracking = await LeadTracking.findOneAndDelete({ _id: trackingId, userId });
    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'Lead tracking not found'
      });
    }

    res.json({
      success: true,
      message: 'Lead tracking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lead tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
