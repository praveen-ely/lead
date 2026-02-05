const User = require('../models/userModel');
const mongoose = require('mongoose');

// GET all users with pagination, search, and filtering
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { search, department, status, workType, city, state, sortBy = 'dateAdded', sortOrder = 'desc' } = req.query;
    
    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (workType) filter.workType = workType;
    if (city) filter.city = city;
    if (state) filter.state = state;
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const users = await User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET single user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET single user by userId
exports.getUserByUserId = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST create new user
exports.createUser = async (req, res) => {
  try {
    // Check if user with same email or userId already exists
    const existingUser = await User.findOne({
      $or: [
        { email: req.body.email },
        { userId: req.body.userId },
        { employeeId: req.body.employeeId }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email, userId, or employeeId already exists'
      });
    }
    
    const user = new User(req.body);
    const savedUser = await user.save();
    
    res.status(201).json({
      success: true,
      data: savedUser,
      message: 'User created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// PUT update user by ID
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// PATCH partially update user
exports.patchUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user,
      message: 'User patched successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// DELETE user by ID
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST bulk create users
exports.createBulkUsers = async (req, res) => {
  try {
    const { users } = req.body;
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of users'
      });
    }
    
    // Check for duplicates
    const existingUsers = await User.find({
      $or: [
        { email: { $in: users.map(u => u.email) } },
        { userId: { $in: users.map(u => u.userId) } },
        { employeeId: { $in: users.map(u => u.employeeId) } }
      ]
    });
    
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Some users already exist',
        duplicates: existingUsers.map(u => ({ email: u.email, userId: u.userId }))
      });
    }
    
    const insertedUsers = await User.insertMany(users);
    
    res.status(201).json({
      success: true,
      data: insertedUsers,
      message: `${insertedUsers.length} users created successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// PUT bulk update users
exports.updateBulkUsers = async (req, res) => {
  try {
    const { users } = req.body;
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of users with _id'
      });
    }
    
    const updatePromises = users.map(async (user) => {
      if (!user._id) {
        throw new Error('Each user must have an _id field');
      }
      return User.findByIdAndUpdate(user._id, user, { new: true, runValidators: true });
    });
    
    const updatedUsers = await Promise.all(updatePromises);
    
    res.status(200).json({
      success: true,
      data: updatedUsers,
      message: `${updatedUsers.length} users updated successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// DELETE bulk users
exports.deleteBulkUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of user IDs'
      });
    }
    
    const result = await User.deleteMany({ _id: { $in: userIds } });
    
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} users deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET user statistics
exports.getUserStats = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const total = await User.countDocuments();
    const todayCount = await User.countDocuments({ dateAdded: { $gte: today } });
    const lastWeekCount = await User.countDocuments({ dateAdded: { $gte: lastWeek } });
    const lastMonthCount = await User.countDocuments({ dateAdded: { $gte: lastMonth } });
    
    const departmentStats = await User.aggregate([
      { 
        $group: { 
          _id: { 
            $ifNull: ['$department', 'Not Set'] 
          }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } }
    ]);
    
    const statusStats = await User.aggregate([
      { 
        $group: { 
          _id: { 
            $ifNull: ['$status', 'Not Set'] 
          }, 
          count: { $sum: 1 } 
        } 
      }
    ]);
    
    const workTypeStats = await User.aggregate([
      { 
        $group: { 
          _id: { 
            $ifNull: ['$workType', 'Not Set'] 
          }, 
          count: { $sum: 1 } 
        } 
      }
    ]);
    
    const cityStats = await User.aggregate([
      { 
        $group: { 
          _id: { 
            $ifNull: ['$city', 'Not Set'] 
          }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        total,
        today: todayCount,
        lastWeek: lastWeekCount,
        lastMonth: lastMonthCount,
        byDepartment: departmentStats,
        byStatus: statusStats,
        byWorkType: workTypeStats,
        byCity: cityStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET user filter options
exports.getUserFilters = async (req, res) => {
  try {
    const departments = await User.distinct('department');
    const statuses = await User.distinct('status');
    const workTypes = await User.distinct('workType');
    const cities = await User.distinct('city');
    const states = await User.distinct('state');
    const companies = await User.distinct('company');
    
    res.status(200).json({
      success: true,
      data: {
        departments,
        statuses,
        workTypes,
        cities,
        states,
        companies
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
