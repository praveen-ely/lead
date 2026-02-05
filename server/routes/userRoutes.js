const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET /api/users - Get all users with pagination, search, and filtering
router.get('/', userController.getAllUsers);

// GET /api/users/stats - Get user statistics
router.get('/stats', userController.getUserStats);

// GET /api/users/filters - Get user filter options
router.get('/filters', userController.getUserFilters);

// GET /api/users/:id - Get single user by ID
router.get('/:id', userController.getUserById);

// GET /api/users/userId/:userId - Get single user by userId
router.get('/userId/:userId', userController.getUserByUserId);

// POST /api/users - Create new user
router.post('/', userController.createUser);

// POST /api/users/bulk - Create multiple users
router.post('/bulk', userController.createBulkUsers);

// PUT /api/users/:id - Update user by ID
router.put('/:id', userController.updateUser);

// PATCH /api/users/:id - Partially update user
router.patch('/:id', userController.patchUser);

// PUT /api/users/bulk - Update multiple users
router.put('/bulk', userController.updateBulkUsers);

// DELETE /api/users/:id - Delete user by ID
router.delete('/:id', userController.deleteUser);

// DELETE /api/users/bulk - Delete multiple users
router.delete('/bulk', userController.deleteBulkUsers);

module.exports = router;
