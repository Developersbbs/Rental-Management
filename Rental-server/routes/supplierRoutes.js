// routes/supplierRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSuppliersStats,
  getSupplierProducts,
  recordVendorPayment,
  getVendorPaymentHistory
} = require('../controllers/supplierController');
const { protect, allowRoles } = require('../middlewares/authMiddlewares');

// All routes require authentication
router.use(protect);

// GET /api/suppliers/stats - Get supplier statistics
router.get('/stats', getSuppliersStats);

// GET /api/suppliers/:id/products - Get products for a supplier
router.get('/:id/products', allowRoles('superadmin', 'staff'), getSupplierProducts);

// GET /api/suppliers - Get all suppliers
router.get('/', allowRoles('superadmin', 'staff'), getAllSuppliers);

// GET /api/suppliers/:id - Get supplier by ID
router.get('/:id', allowRoles('superadmin', 'staff'), getSupplierById);

// POST /api/suppliers - Create new supplier
router.post('/', allowRoles('superadmin'), createSupplier);

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', allowRoles('superadmin'), updateSupplier);

// POST /api/suppliers/:id/payments - Record vendor payment
router.post('/:id/payments', allowRoles('superadmin'), recordVendorPayment);

// GET /api/suppliers/:id/payments - Get vendor payment history
router.get('/:id/payments', allowRoles('superadmin', 'staff'), getVendorPaymentHistory);

// DELETE /api/suppliers/:id - Delete supplier
router.delete('/:id', allowRoles('superadmin'), deleteSupplier);

module.exports = router;