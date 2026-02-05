const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');

// GET /api/companies - Get all companies with pagination, search, and filtering
router.get('/', companyController.getAllCompanies);

// GET /api/companies/stats - Get company statistics
router.get('/stats', companyController.getCompanyStats);

// GET /api/companies/filters - Get company filter options
router.get('/filters', companyController.getCompanyFilters);

// GET /api/companies/:id - Get single company by ID
router.get('/:id', companyController.getCompanyById);

// GET /api/companies/companyId/:companyId - Get single company by companyId
router.get('/companyId/:companyId', companyController.getCompanyByCompanyId);

// POST /api/companies - Create new company
router.post('/', companyController.createCompany);

// POST /api/companies/bulk - Create multiple companies
router.post('/bulk', companyController.createBulkCompanies);

// PUT /api/companies/:id - Update company by ID
router.put('/:id', companyController.updateCompany);

// PATCH /api/companies/:id - Partially update company
router.patch('/:id', companyController.patchCompany);

// PUT /api/companies/bulk - Update multiple companies
router.put('/bulk', companyController.updateBulkCompanies);

// DELETE /api/companies/:id - Delete company by ID
router.delete('/:id', companyController.deleteCompany);

// DELETE /api/companies/bulk - Delete multiple companies
router.delete('/bulk', companyController.deleteBulkCompanies);

module.exports = router;
