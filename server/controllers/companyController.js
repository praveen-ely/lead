const Company = require('../models/companyModel');
const mongoose = require('mongoose');

// GET all companies with pagination, search, and filtering
exports.getAllCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { search, industry, priority, city, state, sortBy = 'dateAdded', sortOrder = 'desc' } = req.query;
    
    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { keyContact: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { companyId: { $regex: search, $options: 'i' } }
      ];
    }
    if (industry) filter.industry = industry;
    if (priority) filter.priority = priority;
    if (city) filter.city = city;
    if (state) filter.state = state;
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const companies = await Company.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await Company.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: companies,
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

// GET single company by ID
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET single company by companyId
exports.getCompanyByCompanyId = async (req, res) => {
  try {
    const company = await Company.findOne({ companyId: req.params.companyId });
    
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST create new company
exports.createCompany = async (req, res) => {
  try {
    // Check if company with same companyId or email already exists
    const existingCompany = await Company.findOne({
      $or: [
        { companyId: req.body.companyId },
        { email: req.body.email }
      ]
    });
    
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        error: 'Company with this companyId or email already exists'
      });
    }
    
    const company = new Company(req.body);
    const savedCompany = await company.save();
    
    res.status(201).json({
      success: true,
      data: savedCompany,
      message: 'Company created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// PUT update company by ID
exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: company,
      message: 'Company updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// PATCH partially update company
exports.patchCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: company,
      message: 'Company patched successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// DELETE company by ID
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST bulk create companies
exports.createBulkCompanies = async (req, res) => {
  try {
    const { companies } = req.body;
    
    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of companies'
      });
    }
    
    // Check for duplicates
    const existingCompanies = await Company.find({
      $or: [
        { companyId: { $in: companies.map(c => c.companyId) } },
        { email: { $in: companies.map(c => c.email) } }
      ]
    });
    
    if (existingCompanies.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Some companies already exist',
        duplicates: existingCompanies.map(c => ({ companyId: c.companyId, email: c.email }))
      });
    }
    
    const insertedCompanies = await Company.insertMany(companies);
    
    res.status(201).json({
      success: true,
      data: insertedCompanies,
      message: `${insertedCompanies.length} companies created successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// PUT bulk update companies
exports.updateBulkCompanies = async (req, res) => {
  try {
    const { companies } = req.body;
    
    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of companies with _id'
      });
    }
    
    const updatePromises = companies.map(async (company) => {
      if (!company._id) {
        throw new Error('Each company must have an _id field');
      }
      return Company.findByIdAndUpdate(company._id, company, { new: true, runValidators: true });
    });
    
    const updatedCompanies = await Promise.all(updatePromises);
    
    res.status(200).json({
      success: true,
      data: updatedCompanies,
      message: `${updatedCompanies.length} companies updated successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// DELETE bulk companies
exports.deleteBulkCompanies = async (req, res) => {
  try {
    const { companyIds } = req.body;
    
    if (!companyIds || !Array.isArray(companyIds) || companyIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of company IDs'
      });
    }
    
    const result = await Company.deleteMany({ _id: { $in: companyIds } });
    
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} companies deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET company statistics
exports.getCompanyStats = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const total = await Company.countDocuments();
    const todayCount = await Company.countDocuments({ dateAdded: { $gte: today } });
    const lastWeekCount = await Company.countDocuments({ dateAdded: { $gte: lastWeek } });
    const lastMonthCount = await Company.countDocuments({ dateAdded: { $gte: lastMonth } });
    
    const industryStats = await Company.aggregate([
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const priorityStats = await Company.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    const companyTypeStats = await Company.aggregate([
      { $group: { _id: '$companyType', count: { $sum: 1 } } }
    ]);
    
    const cityStats = await Company.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        total,
        today: todayCount,
        lastWeek: lastWeekCount,
        lastMonth: lastMonthCount,
        byIndustry: industryStats,
        byPriority: priorityStats,
        byCompanyType: companyTypeStats,
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

// GET company filter options
exports.getCompanyFilters = async (req, res) => {
  try {
    const industries = await Company.distinct('industry');
    const priorities = await Company.distinct('priority');
    const cities = await Company.distinct('city');
    const states = await Company.distinct('state');
    const companyTypes = await Company.distinct('companyType');
    
    res.status(200).json({
      success: true,
      data: {
        industries,
        priorities,
        cities,
        states,
        companyTypes
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
