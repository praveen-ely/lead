const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/create-test-users', authController.createTestUsers);

// Protected routes
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);

// Admin routes
router.get('/users', protect, authorize('admin'), authController.getAllUsers);
router.get('/stats', protect, authorize('admin'), authController.getUserStats);
router.put('/users/:userId/status', protect, authorize('admin'), authController.updateUserStatus);
router.put('/users/:userId', protect, authorize('admin'), authController.updateUserByAdmin);
router.delete('/users/:userId', protect, authorize('admin'), authController.deleteUserByAdmin);

module.exports = router;
