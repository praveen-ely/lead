const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// GET /api/settings - Get all settings
router.get('/', settingsController.getSettings);

// PUT /api/settings - Save all settings
router.put('/', settingsController.saveAllSettings);

// POST /api/settings/test-api - Test API connection
router.post('/test-api', settingsController.testApiConnection);

// POST /api/settings/:apiId/trigger - Manually trigger API execution
router.post('/:apiId/trigger', settingsController.triggerApiExecution);

// GET /api/settings/fields - Get field configurations
router.get('/fields', settingsController.getFieldConfigs);

// PUT /api/settings/fields - Update field configurations
router.put('/fields', settingsController.updateFieldConfigs);

// GET /api/settings/notifications - Get notification configurations
router.get('/notifications', settingsController.getNotificationConfigs);

// PUT /api/settings/notifications - Update notification configurations
router.put('/notifications', settingsController.updateNotificationConfigs);

module.exports = router;
