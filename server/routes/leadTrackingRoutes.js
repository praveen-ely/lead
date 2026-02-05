const express = require('express');
const router = express.Router();
const leadTrackingController = require('../controllers/leadTrackingController');

// User lead tracking routes
router.get('/user/:userId', leadTrackingController.getUserTrackedLeads);
router.get('/user/:userId/stats', leadTrackingController.getUserTrackingStats);
router.get('/user/:userId/trending', leadTrackingController.getTrendingLeads);

// Lead matching and management
router.post('/user/:userId/match', leadTrackingController.matchLeadsForUser);
router.put('/user/:userId/tracking/:trackingId/status', leadTrackingController.updateLeadStatus);
router.post('/user/:userId/tracking/:trackingId/actions', leadTrackingController.addLeadAction);
router.delete('/user/:userId/tracking/:trackingId', leadTrackingController.deleteLeadTracking);

module.exports = router;
