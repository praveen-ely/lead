const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const thirdPartyLeadService = require('../services/thirdPartyLeadService');
const { protect } = require('../middleware/auth');

// GET /api/leads - Get all leads with pagination, search, and filtering (protected)
router.get('/', protect, leadController.getAllLeads);

// GET /api/leads/stats - Get lead statistics
router.get('/stats', leadController.getLeadStats);

// GET /api/leads/filters - Get lead filter options
router.get('/filters', leadController.getLeadFilters);

// GET /api/leads/search/:field/:value - Search leads by dynamic field
router.get('/search/:field/:value', leadController.searchLeadsByField);

// GET /api/leads/field/:fieldName/stats - Get field statistics
router.get('/field/:fieldName/stats', leadController.getFieldStatistics);

// POST /api/leads/import/third-party - Import leads from third-party source
router.post('/import/third-party', async (req, res) => {
  try {
    const { source = 'jsonplaceholder' } = req.body;
    const result = await thirdPartyLeadService.triggerManualImport(source);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Successfully imported ${result.leadsFetched} leads from ${source}`,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: `Failed to import leads from ${source}: ${result.error}`,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in third-party import:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during import',
      error: error.message
    });
  }
});

// GET /api/leads/import/sources - Get available third-party sources
router.get('/import/sources', (req, res) => {
  try {
    const sources = thirdPartyLeadService.getAvailableSources();
    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get sources',
      error: error.message
    });
  }
});

// POST /api/leads/insert - Insert lead (public, no token required)
// assignedTo must be provided in request body
router.post('/insert', leadController.createLeadByLeadId);

// POST /api/leads/insert/bulk - Bulk insert leads (public, auto-generates leadIds)
router.post('/insert/bulk', leadController.createBulkLeadsByLeadId);

// POST /api/leads/update/leads/:leadId - Update lead by leadId (public)
router.post('/update/leads/:leadId', leadController.updateLeadByLeadId);

// POST /api/leads/update - Bulk update leads by leadId (public)
router.post('/update', leadController.updateLeadByLeadIdFromBody);

// GET /api/leads/leadId/:leadId - Get single lead by leadId
router.get('/leadId/:leadId', leadController.getLeadByLeadId);

// GET /api/leads/:id - Get single lead by ID
router.get('/:id', leadController.getLeadById);

// POST /api/leads - Create new lead
router.post('/', leadController.createLead);

// POST /api/leads/bulk - Create bulk leads
router.post('/bulk', leadController.createBulkLeads);

// PUT /api/leads/:id - Update lead by ID
router.put('/:id', leadController.updateLead);

// PATCH /api/leads/:id - Partial update lead by ID
router.patch('/:id', leadController.patchLead);

// DELETE /api/leads/:id - Delete lead by ID
router.delete('/:id', leadController.deleteLead);

// DELETE /api/leads/bulk - Delete bulk leads
router.delete('/bulk', leadController.deleteBulkLeads);

module.exports = router;
