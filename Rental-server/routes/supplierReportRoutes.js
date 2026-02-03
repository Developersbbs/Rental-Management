const express = require('express');
const router = express.Router();
const supplierReportController = require('../controllers/supplierReportController');
const { protect } = require('../middlewares/authMiddlewares');

// Apply authentication middleware to all routes
router.use(protect);

// Get all suppliers with statistics
router.get('/', supplierReportController.getAllSuppliersWithStats);

// Get supplier comparison data
router.get('/comparison', supplierReportController.getSupplierComparison);

// Get detailed report for a specific supplier
router.get('/:supplierId', supplierReportController.getSupplierDetailedReport);

// Get products from a specific supplier
router.get('/:supplierId/products', supplierReportController.getSupplierProducts);

module.exports = router;
