const express = require('express');
const router = express.Router();
const userPreferenceController = require('../controllers/userPreferenceController');
const { protect, authorize } = require('../middleware/auth');

// Important: Place specific routes before /:userId to prevent route conflicts
router.get('/options', userPreferenceController.getPreferenceOptions);

// Lead model preferences routes (must be before /:userId routes to avoid matching "lead-model" as userId)
router.get('/lead-model/preferences', protect, userPreferenceController.getLeadModelPreferences);
router.post('/lead-model/preferences', protect, authorize('admin'), userPreferenceController.updateLeadModelPreferences);
router.put('/lead-model/preferences', protect, authorize('admin'), userPreferenceController.updateLeadModelPreferences);

// Test API connection
router.post('/test-api', userPreferenceController.testApiConnection);

// Trigger manual sync
router.post('/:userId/sync', userPreferenceController.triggerManualSync);
// Commented out - manualSendDummyLeads function not implemented
// router.post('/:userId/manual-send', protect, authorize('admin'), userPreferenceController.manualSendDummyLeads);

// User preference routes
router.get('/:userId', userPreferenceController.getUserPreferences);
router.post('/:userId', userPreferenceController.createOrUpdateUserPreferences);
router.put('/:userId', userPreferenceController.createOrUpdateUserPreferences);
router.delete('/:userId', protect, authorize('admin'), userPreferenceController.deleteUserPreferences);

// User leads routes
router.get('/:userId/leads', userPreferenceController.getUserLeads);

// User statistics
router.get('/:userId/stats', userPreferenceController.getUserStatistics);

// Test lead matching
router.post('/:userId/test-matching', userPreferenceController.testLeadMatching);

module.exports = router;
