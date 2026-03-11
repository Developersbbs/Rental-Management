const RentalInward = require('../models/RentalInward');
const RentalProduct = require('../models/RentalProduct');
const RentalCategory = require('../models/RentalCategory');
const RentalInventoryItem = require('../models/RentalInventoryItem');
const XLSX = require('xlsx');
const mongoose = require('mongoose');

// Create rental inward
exports.createRentalInward = async (req, res) => {
    try {
        console.log('🔍 Creating rental inward - User:', req.user);

        // Validate that user is authenticated
        if (!req.user || !req.user._id) {
            console.error('❌ No authenticated user found');
            return res.status(401).json({
                message: 'Authentication required. Please log in again.',
                code: 'NO_USER'
            });
        }

        const { receivedDate, items, notes, inwardType, supplier, supplierInvoiceNumber } = req.body;

        // Validate items and calculate total
        let totalAmount = 0;
        const validatedItems = [];
        const inwardHistory = [];

        for (const item of items) {
            const product = await RentalProduct.findById(item.product);
            if (!product) {
                return res.status(404).json({ message: `Rental product not found: ${item.product}` });
            }

            // Calculate total based on inward type
            let itemTotal = 0;
            if (inwardType === 'purchase') {
                if (item.purchaseCost === undefined || item.purchaseCost === null) {
                    return res.status(400).json({ message: 'Purchase cost is required for purchase inward' });
                }
                itemTotal = item.quantity * item.purchaseCost;
            } else if (inwardType === 'sub_rental') {
                // For sub-rental, total amount might be calculated differently or just tracked
                // Here we might want to track expected cost, but for now we can set it to 0 or
                // calculate based on estimated duration if provided.
                // For simplicity, we'll store 0 as immediate cost, but track rental rates
                itemTotal = 0;
            }

            totalAmount += itemTotal;

            validatedItems.push({
                product: item.product,
                quantity: item.quantity,
                purchaseCost: item.purchaseCost,
                vendorRentalRate: item.vendorRentalRate,
                vendorReturnDate: item.vendorReturnDate,
                ownershipType: inwardType === 'sub_rental' ? 'sub_rented' : 'owned',
                batchNumber: item.batchNumber,
                purchaseDate: item.purchaseDate,
                condition: item.condition || 'new',
                notes: item.notes
            });
        }

        // Generate inward number
        const count = await RentalInward.countDocuments();
        const inwardNumber = `RI-${String(count + 1).padStart(6, '0')}`;

        // Create rental inward record first
        const rentalInward = new RentalInward({
            inwardNumber,
            inwardType: inwardType || 'purchase',
            supplier: inwardType === 'sub_rental' ? supplier : undefined,
            receivedDate: receivedDate || Date.now(),
            items: validatedItems,
            supplierInvoiceNumber,
            totalAmount,
            notes,
            receivedBy: req.user._id,
            status: 'completed',
            inwardHistory: [] // Will be populated after creating items
        });

        await rentalInward.save();

        // Create rental inventory items for each quantity
        for (const item of validatedItems) {
            for (let i = 0; i < item.quantity; i++) {
                // Generate unique identifier with duplicate checking
                const product = await RentalProduct.findById(item.product);
                const productName = product ? product.name.replace(/\s+/g, '-').substring(0, 20) : 'RENTAL';

                // Find a unique identifier by checking existing ones
                let uniqueIdentifier;
                let counter = await RentalInventoryItem.countDocuments({ rentalProductId: item.product }) + 1;
                let isUnique = false;

                while (!isUnique) {
                    uniqueIdentifier = `RI-${productName}-${String(counter).padStart(4, '0')}`;
                    const existing = await RentalInventoryItem.findOne({ uniqueIdentifier });
                    if (!existing) {
                        isUnique = true;
                    } else {
                        counter++;
                    }
                }

                const rentalInventoryItem = new RentalInventoryItem({
                    rentalProductId: item.product,
                    uniqueIdentifier,
                    status: 'available',
                    condition: item.condition || 'new',
                    purchaseDate: item.purchaseDate || Date.now(),
                    purchaseCost: item.purchaseCost,
                    // Sub-rental fields
                    ownershipType: item.ownershipType,
                    vendorId: inwardType === 'sub_rental' ? supplier : undefined,
                    vendorRentalRate: item.vendorRentalRate,
                    vendorReturnDate: item.vendorReturnDate,

                    inwardId: rentalInward._id,
                    batchNumber: item.batchNumber,
                    notes: item.notes,
                    history: [{
                        action: 'received',
                        details: `Received via Rental Inward ${rentalInward.inwardNumber}. Batch: ${item.batchNumber}`,
                        performedBy: req.user._id
                    }]
                });

                await rentalInventoryItem.save();

                // Add to inward history
                inwardHistory.push({
                    inventoryItemId: rentalInventoryItem._id,
                    uniqueIdentifier: rentalInventoryItem.uniqueIdentifier,
                    productId: item.product,
                    createdAt: Date.now()
                });

                // Update product quantities
                await updateProductQuantities(item.product);
            }
        }

        // Update inward with history
        rentalInward.inwardHistory = inwardHistory;
        await rentalInward.save();

        // Populate references
        await rentalInward.populate('items.product');
        await rentalInward.populate('receivedBy', 'username');
        await rentalInward.populate('inwardHistory.inventoryItemId');

        res.status(201).json({
            message: 'Rental inward created successfully',
            rentalInward
        });
    } catch (err) {
        console.error('❌ Error creating rental inward:', err);
        console.error('Error stack:', err.stack);
        console.error('Request body:', req.body);
        console.error('Request user:', req.user);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get all rental inwards
exports.getAllRentalInwards = async (req, res) => {
    try {
        const { page = 1, limit = 10, startDate, endDate, status } = req.query;

        const filter = {};
        if (startDate && endDate) {
            filter.receivedDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        if (status) filter.status = status;

        const rentalInwards = await RentalInward.find(filter)
            .populate('items.product', 'name')
            .populate('receivedBy', 'username')
            .populate('inwardHistory.inventoryItemId', 'uniqueIdentifier status')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await RentalInward.countDocuments(filter);

        res.status(200).json({
            rentalInwards,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (err) {
        console.error('Error fetching rental inwards:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get rental inward by ID
exports.getRentalInwardById = async (req, res) => {
    try {
        const rentalInward = await RentalInward.findById(req.params.id)
            .populate('items.product')
            .populate('receivedBy', 'username')
            .populate('inwardHistory.inventoryItemId')
            .populate('inwardHistory.productId', 'name');

        if (!rentalInward) {
            return res.status(404).json({ message: 'Rental inward not found' });
        }

        res.status(200).json(rentalInward);
    } catch (err) {
        console.error('Error fetching rental inward:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update rental inward
exports.updateRentalInward = async (req, res) => {
    try {
        const { receivedDate, notes, status } = req.body;

        const rentalInward = await RentalInward.findById(req.params.id);
        if (!rentalInward) {
            return res.status(404).json({ message: 'Rental inward not found' });
        }

        if (receivedDate) rentalInward.receivedDate = receivedDate;
        if (notes) rentalInward.notes = notes;
        if (status) rentalInward.status = status;

        await rentalInward.save();
        await rentalInward.populate('items.product');
        await rentalInward.populate('receivedBy', 'username');

        res.status(200).json({
            message: 'Rental inward updated successfully',
            rentalInward
        });
    } catch (err) {
        console.error('Error updating rental inward:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Delete rental inward
exports.deleteRentalInward = async (req, res) => {
    try {
        const rentalInward = await RentalInward.findByIdAndDelete(req.params.id);

        if (!rentalInward) {
            return res.status(404).json({ message: 'Rental inward not found' });
        }

        res.status(200).json({ message: 'Rental inward deleted successfully' });
    } catch (err) {
        console.error('Error deleting rental inward:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Import rental inwards from Excel
exports.importRentalInwardsFromExcel = async (req, res) => {
    try {
        console.log('📥 Received rental inward import request');

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an Excel file' });
        }

        const { receivedDate, inwardType, supplier, notes, supplierInvoiceNumber } = req.body;

        if (inwardType === 'sub_rental' && !supplier) {
            return res.status(400).json({ message: 'Supplier is required for sub-rental. Please select one in the main form.' });
        }

        // Parse Excel file from buffer
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
            return res.status(400).json({ message: 'Excel file is empty or invalid format' });
        }

        console.log(`📊 Parsed ${data.length} rows from Excel`);

        // Ensure "General" category exists for auto-created products
        let generalCategory = await RentalCategory.findOne({ name: { $regex: /^General$/i } });
        if (!generalCategory) {
            generalCategory = await RentalCategory.create({
                name: 'General',
                description: 'Auto-created category for imported products'
            });
            console.log('✅ Created "General" category');
        }

        // Map Excel rows to rental inward items
        const items = [];
        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            // Flexible column mapping
            const productInput = (
                row['Product ID'] || row['product'] || row['Product'] || row['Product Name'] ||
                row['ITEM'] || row['Item Name'] || row['Name'] || ''
            ).toString().trim();

            const quantity = parseInt(row['Quantity'] || row['quantity'] || row['QTY'] || row['Qty'] || 1) || 1;

            const purchaseCost = parseFloat(
                row['Purchase Cost'] || row['purchaseCost'] || row['Cost'] ||
                row['Price'] || row['Unit Cost'] || row['PURCHASE COST'] || 0
            );

            const batchNumber = (
                row['Batch Number'] || row['batchNumber'] || row['Batch'] ||
                row['Serial Number'] || row['Sl No'] || `AUTO-${Date.now()}-${i}`
            ).toString();

            const brand = row['Brand'] || row['brand'] || row['BRAND'] || '';
            const modelNumber = row['Model Number'] || row['modelNumber'] || row['Model'] || row['MODEL'] || '';
            const condition = row['Condition'] || row['condition'] || row['Status'] || 'new';
            const itemNotes = row['Notes'] || row['notes'] || row['REMARKS'] || '';

            if (!productInput) {
                return res.status(400).json({ message: `Row ${i + 1}: Product (ID or Name) is missing` });
            }

            // Resolve product
            let productDoc;
            if (mongoose.Types.ObjectId.isValid(productInput)) {
                productDoc = await RentalProduct.findById(productInput);
            }

            if (!productDoc) {
                // Find by name (case-insensitive) - escape regex special characters
                const escapedName = productInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                productDoc = await RentalProduct.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') } });
            }

            if (!productDoc) {
                // Auto-create product if it doesn't exist
                console.log(`📦 Auto-creating product: "${productInput}"`);
                productDoc = await RentalProduct.create({
                    name: productInput,
                    category: generalCategory._id,
                    createdBy: req.user._id,
                    status: 'active'
                });
                console.log(`✅ Product created with ID: ${productDoc._id}`);
            }

            items.push({
                product: productDoc._id,
                quantity,
                purchaseCost: inwardType === 'purchase' ? purchaseCost : undefined,
                vendorRentalRate: inwardType === 'sub_rental' ? {
                    daily: parseFloat(row['Daily Rate'] || 0),
                    hourly: parseFloat(row['Hourly Rate'] || 0),
                    monthly: parseFloat(row['Monthly Rate'] || 0)
                } : undefined,
                batchNumber,
                brand,
                modelNumber,
                condition,
                notes: itemNotes
            });
        }

        // Construct body for createRentalInward
        req.body = {
            receivedDate: receivedDate || new Date(),
            inwardType: inwardType || 'purchase',
            supplier: supplier && supplier !== 'undefined' ? supplier : undefined,
            items,
            notes: notes || '',
            supplierInvoiceNumber: supplierInvoiceNumber || ''
        };

        // Call the internal creation logic
        return exports.createRentalInward(req, res);

    } catch (err) {
        console.error('❌ Error in rental inward import:', err);
        res.status(500).json({ message: 'Import failed', error: err.message });
    }
};

// Helper function to update product quantities
async function updateProductQuantities(rentalProductId) {
    const totalItems = await RentalInventoryItem.countDocuments({ rentalProductId });
    const availableItems = await RentalInventoryItem.countDocuments({
        rentalProductId,
        status: 'available'
    });

    await RentalProduct.findByIdAndUpdate(rentalProductId, {
        totalQuantity: totalItems,
        availableQuantity: availableItems
    });
}
