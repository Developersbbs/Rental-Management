// controllers/supplierReportController.js
const Supplier = require('../models/RentalSupplier');
const Product = require('../models/Product');
const Inward = require('../models/Inward');
const mongoose = require('mongoose');

/**
 * Get all suppliers with aggregate statistics
 * GET /api/supplier-reports
 */
exports.getAllSuppliersWithStats = async (req, res) => {
    try {
        // Get all active suppliers
        const suppliers = await Supplier.find({ status: 'active' }).lean();

        // Get statistics for each supplier
        const suppliersWithStats = await Promise.all(
            suppliers.map(async (supplier) => {
                // Get all products from this supplier
                const products = await Product.find({ supplier: supplier._id })
                    .populate('category', 'name')
                    .lean();

                // Calculate statistics
                const totalProducts = products.length;
                const outOfStock = products.filter(p => p.quantity === 0).length;
                const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.reorderLevel).length;

                // Calculate total stock value
                const totalStockValue = products.reduce((sum, product) => {
                    return sum + (product.price * product.quantity);
                }, 0);

                // Get inward statistics for this supplier
                const inwards = await Inward.find({ supplier: supplier._id }).lean();

                const totalInwardValue = inwards.reduce((sum, inward) => sum + (inward.totalAmount || 0), 0);
                const totalPaidAmount = inwards.reduce((sum, inward) => sum + (inward.paidAmount || 0), 0);
                const outstandingBalance = totalInwardValue - totalPaidAmount;

                // Get latest inward date
                const latestInward = await Inward.findOne({ supplier: supplier._id })
                    .sort({ receivedDate: -1 })
                    .select('receivedDate')
                    .lean();

                return {
                    ...supplier,
                    statistics: {
                        totalProducts,
                        outOfStock,
                        lowStock,
                        inStock: totalProducts - outOfStock,
                        totalStockValue,
                        lastInwardDate: latestInward?.receivedDate || null,
                        totalInwardValue,
                        totalPaidAmount,
                        outstandingBalance
                    }
                };
            })
        );

        // Sort by total stock value (highest first)
        suppliersWithStats.sort((a, b) => b.statistics.totalStockValue - a.statistics.totalStockValue);

        res.json({
            success: true,
            count: suppliersWithStats.length,
            suppliers: suppliersWithStats
        });
    } catch (error) {
        console.error('Error fetching supplier reports:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch supplier reports',
            error: error.message
        });
    }
};

/**
 * Get detailed report for a specific supplier
 * GET /api/supplier-reports/:supplierId
 */
exports.getSupplierDetailedReport = async (req, res) => {
    try {
        const { supplierId } = req.params;

        // Validate supplier ID
        if (!mongoose.Types.ObjectId.isValid(supplierId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid supplier ID'
            });
        }

        // Get supplier details
        const supplier = await Supplier.findById(supplierId).lean();
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }

        // Get all products from this supplier
        const products = await Product.find({ supplier: supplierId })
            .populate('category', 'name')
            .lean();

        // Get inward history for this supplier
        const inwardHistory = await Inward.find({ supplier: supplierId })
            .populate('items.product', 'name productId')
            .populate('supplier', 'name email phone')
            .populate('createdBy', 'username email')
            .sort({ receivedDate: -1 })
            .limit(50)
            .lean();

        // Calculate detailed statistics
        const totalProducts = products.length;
        const outOfStock = products.filter(p => p.quantity === 0).length;
        const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.reorderLevel).length;
        const inStock = totalProducts - outOfStock;

        const totalStockValue = products.reduce((sum, product) => {
            return sum + (product.price * product.quantity);
        }, 0);

        const totalInwardValue = inwardHistory.reduce((sum, inward) => {
            return sum + (inward.totalAmount || 0);
        }, 0);

        // Payment calculations
        const totalPaidAmount = inwardHistory.reduce((sum, inward) => {
            return sum + (inward.paidAmount || 0);
        }, 0);

        const outstandingBalance = totalInwardValue - totalPaidAmount;

        // Payment status breakdown
        const paymentBreakdown = {
            pending: inwardHistory.filter(inv => inv.paymentStatus === 'pending').length,
            partial: inwardHistory.filter(inv => inv.paymentStatus === 'partial').length,
            paid: inwardHistory.filter(inv => inv.paymentStatus === 'paid').length
        };

        // Category-wise breakdown
        const categoryBreakdown = products.reduce((acc, product) => {
            const categoryName = product.category?.name || 'Uncategorized';
            if (!acc[categoryName]) {
                acc[categoryName] = {
                    count: 0,
                    totalValue: 0,
                    quantity: 0
                };
            }
            acc[categoryName].count++;
            acc[categoryName].totalValue += product.price * product.quantity;
            acc[categoryName].quantity += product.quantity;
            return acc;
        }, {});

        res.json({
            success: true,
            supplier,
            statistics: {
                totalProducts,
                outOfStock,
                lowStock,
                inStock,
                totalStockValue,
                totalInwardValue,
                totalInwards: inwardHistory.length,
                averageInwardValue: inwardHistory.length > 0 ? totalInwardValue / inwardHistory.length : 0,
                // Payment statistics
                totalPaidAmount,
                outstandingBalance,
                paymentBreakdown
            },
            products,
            inwardHistory,
            categoryBreakdown
        });
    } catch (error) {
        console.error('Error fetching supplier detailed report:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch supplier detailed report',
            error: error.message
        });
    }
};

/**
 * Get products from a specific supplier
 * GET /api/supplier-reports/:supplierId/products
 */
exports.getSupplierProducts = async (req, res) => {
    try {
        const { supplierId } = req.params;
        const {
            page = 1,
            limit = 10,
            search = '',
            category = '',
            stockStatus = '' // 'all', 'inStock', 'lowStock', 'outOfStock'
        } = req.query;

        // Validate supplier ID
        if (!mongoose.Types.ObjectId.isValid(supplierId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid supplier ID'
            });
        }

        // Build query
        const query = { supplier: supplierId };

        // Add search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { productId: { $regex: search, $options: 'i' } }
            ];
        }

        // Add category filter
        if (category) {
            query.category = category;
        }

        // Add stock status filter
        if (stockStatus === 'outOfStock') {
            query.quantity = 0;
        } else if (stockStatus === 'lowStock') {
            query.$expr = {
                $and: [
                    { $gt: ['$quantity', 0] },
                    { $lte: ['$quantity', '$reorderLevel'] }
                ]
            };
        } else if (stockStatus === 'inStock') {
            query.$expr = { $gt: ['$quantity', '$reorderLevel'] };
        }

        // Get total count
        const total = await Product.countDocuments(query);

        // Get products with pagination
        const products = await Product.find(query)
            .populate('category', 'name')
            .populate('supplier', 'name email phone')
            .sort({ name: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            products,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching supplier products:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch supplier products',
            error: error.message
        });
    }
};

/**
 * Get supplier comparison data
 * GET /api/supplier-reports/comparison
 */
exports.getSupplierComparison = async (req, res) => {
    try {
        // Get all active suppliers
        const suppliers = await Supplier.find({ status: 'active' }).lean();

        const comparison = await Promise.all(
            suppliers.map(async (supplier) => {
                const productCount = await Product.countDocuments({ supplier: supplier._id });
                const products = await Product.find({ supplier: supplier._id }).lean();

                const totalStockValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
                const outOfStock = products.filter(p => p.quantity === 0).length;
                const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.reorderLevel).length;

                return {
                    supplierId: supplier._id,
                    name: supplier.name,
                    productCount,
                    totalStockValue,
                    outOfStock,
                    lowStock,
                    averageProductValue: productCount > 0 ? totalStockValue / productCount : 0
                };
            })
        );

        res.json({
            success: true,
            comparison
        });
    } catch (error) {
        console.error('Error fetching supplier comparison:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch supplier comparison',
            error: error.message
        });
    }
};

/**
 * Download products CSV for a specific supplier
 * GET /api/supplier-reports/:supplierId/products/csv
 */
exports.getSupplierProductsCSV = async (req, res) => {
    try {
        const { supplierId } = req.params;

        // Validate supplier ID
        if (!mongoose.Types.ObjectId.isValid(supplierId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid supplier ID'
            });
        }

        // Get supplier details
        const supplier = await Supplier.findById(supplierId).select('name').lean();
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Supplier not found'
            });
        }

        // Get all products for this supplier
        const products = await Product.find({ supplier: supplierId })
            .populate('category', 'name')
            .sort({ name: 1 })
            .lean();

        // Define CSV headers
        const headers = [
            'Product ID',
            'Name',
            'Category',
            'Description',
            'HSN Code',
            'Unit',
            'Price',
            'Quantity',
            'Reorder Level',
            'Batch Number',
            'Mfg Date',
            'Exp Date',
            'Status'
        ];

        // Create CSV content
        let csvContent = headers.join(',') + '\n';

        products.forEach(product => {
            const status = product.quantity === 0 ? 'Out of Stock' :
                product.quantity <= product.reorderLevel ? 'Low Stock' : 'In Stock';

            // Escape fields containing commas
            const escape = (text) => {
                if (!text && text !== 0) return '';
                const stringText = String(text);
                if (stringText.includes(',') || stringText.includes('"') || stringText.includes('\n')) {
                    return `"${stringText.replace(/"/g, '""')}"`;
                }
                return stringText;
            };

            const row = [
                escape(product.productId),
                escape(product.name),
                escape(product.category?.name || 'Uncategorized'),
                escape(product.description),
                escape(product.hsnNumber),
                escape(product.unit),
                escape(product.price),
                escape(product.quantity),
                escape(product.reorderLevel),
                escape(product.batchNumber),
                escape(product.manufacturingDate ? new Date(product.manufacturingDate).toISOString().split('T')[0] : ''),
                escape(product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : ''),
                escape(status)
            ];

            csvContent += row.join(',') + '\n';
        });

        // Set headers for download
        const fileName = `${supplier.name.replace(/[^a-zA-Z0-9]/g, '_')}_products_${new Date().toISOString().split('T')[0]}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        res.status(200).send(csvContent);

    } catch (error) {
        console.error('Error generating supplier products CSV:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate CSV report',
            error: error.message
        });
    }
};
