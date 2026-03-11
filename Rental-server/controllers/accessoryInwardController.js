const AccessoryInward = require('../models/AccessoryInward');
const Product = require('../models/Product');
const Category = require('../models/Category');
const XLSX = require('xlsx');
const mongoose = require('mongoose');

// @desc    Create new accessory inward
// @route   POST /api/accessory-inward
// @access  Private
const createAccessoryInward = async (req, res) => {
    try {
        const {
            receivedDate,
            items,
            supplierInvoiceNumber,
            totalAmount,
            notes,
            supplier
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in inward' });
        }

        // 1. Create Inward Record first (to get ID) - initially without product links
        const inward = new AccessoryInward({
            receivedDate,
            items: [], // Will populate after product creation
            supplierInvoiceNumber,
            totalAmount,
            notes,
            supplier,
            receivedBy: req.user._id,
            status: 'completed'
        });

        const processedItems = [];

        // 2. Process each item (Create or Update Product)
        for (const item of items) {
            let product;

            // Try to find existing product by Name or SKU (if provided)
            const query = { $or: [{ name: item.name }] };
            if (item.sku) query.$or.push({ sku: item.sku });

            // Filter to only look for Selling Accessories to avoid conflict with Rental Products
            // (Assuming names/SKUs might overlap, but usually shouldn't)

            let existingProduct = await Product.findOne({
                ...query,
                isSellingAccessory: true
            });

            if (existingProduct) {
                // UPDATE existing product
                existingProduct.quantity += parseInt(item.quantity);
                existingProduct.price = parseFloat(item.sellingPrice); // Update selling price to latest
                // You might optionally update purchase cost stored on product if you had a field for it
                // existingProduct.purchaseCost = parseFloat(item.purchaseCost); 

                await existingProduct.save();
                product = existingProduct;
            } else {
                // CREATE new product
                // Ensure 'Accessories' category exists
                let categoryId = item.category; // If passed from frontend

                if (!categoryId) {
                    // Fallback: Find 'Accessories' category
                    const accCategory = await Category.findOne({
                        name: { $regex: /^accessories$/i }
                    });
                    if (accCategory) {
                        categoryId = accCategory._id;
                    } else {
                        // Create if not exists (fail-safe)
                        const newCat = await Category.create({ name: 'Accessories', status: 'active' });
                        categoryId = newCat._id;
                    }
                }

                product = await Product.create({
                    name: item.name,
                    sku: item.sku,
                    category: categoryId,
                    quantity: parseInt(item.quantity),
                    price: parseFloat(item.sellingPrice),
                    minStockLevel: item.minStockLevel || 5,
                    location: item.location,
                    supplier: supplier,
                    isSellingAccessory: true,
                    isRental: false,
                    addedDate: new Date()
                });
            }

            // Add to processed items list for the Inward Record
            processedItems.push({
                productName: item.name,
                productSku: item.sku,
                product: product._id, // Link to the actual Product
                quantity: parseInt(item.quantity),
                purchaseCost: parseFloat(item.purchaseCost),
                sellingPrice: parseFloat(item.sellingPrice),
                minStockLevel: item.minStockLevel,
                location: item.location
            });
        }

        // 3. Update Inward Record with processed items
        inward.items = processedItems;
        await inward.save();

        res.status(201).json(inward);

    } catch (error) {
        console.error('Error creating accessory inward:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all accessory inwards
// @route   GET /api/accessory-inward
// @access  Private
const getAllAccessoryInwards = async (req, res) => {
    try {
        const { page = 1, limit = 10, startDate, endDate, supplier, status } = req.query;
        const query = {};

        if (startDate && endDate) {
            query.receivedDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (supplier) {
            query.supplier = supplier;
        }

        if (status) {
            query.status = status;
        }

        const inwards = await AccessoryInward.find(query)
            .populate('supplier', 'name')
            .populate('receivedBy', 'name')
            .sort({ receivedDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await AccessoryInward.countDocuments(query);

        res.status(200).json({
            accessoryInwards: inwards,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Import accessory inwards from Excel
// @route   POST /api/accessory-inward/import
// @access  Private
const importAccessoryInwardsFromExcel = async (req, res) => {
    try {
        console.log('📥 Received accessory inward import request');

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an Excel file' });
        }

        const { receivedDate, supplier, notes, supplierInvoiceNumber } = req.body;

        // Parse Excel file from buffer
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (!data || data.length === 0) {
            return res.status(400).json({ message: 'Excel file is empty or invalid format' });
        }

        console.log(`📊 Parsed ${data.length} rows from Excel`);

        // Map Excel rows to accessory inward items
        const items = [];
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const name = (row['Product Name'] || row['name'] || row['Product'] || row['Item'] || '').toString().trim();
            const sku = (row['SKU'] || row['sku'] || '').toString().trim();
            const quantity = parseInt(row['Quantity'] || row['quantity'] || row['Qty'] || 1) || 1;
            const purchaseCost = parseFloat(row['Purchase Cost'] || row['purchaseCost'] || row['Cost'] || 0) || 0;
            const sellingPrice = parseFloat(row['Selling Price'] || row['sellingPrice'] || row['Price'] || 0) || 0;
            const minStockLevel = parseInt(row['Min Stock'] || row['minStockLevel'] || 5) || 5;
            const location = (row['Location'] || row['location'] || '').toString().trim();

            if (!name) {
                return res.status(400).json({ message: `Row ${i + 1}: Product Name is missing` });
            }

            items.push({
                name,
                sku,
                quantity,
                purchaseCost,
                sellingPrice,
                minStockLevel,
                location
            });
        }

        // Construct body for createAccessoryInward
        req.body = {
            receivedDate: receivedDate || new Date(),
            supplier: supplier && supplier !== 'undefined' ? supplier : undefined,
            items,
            notes: notes || '',
            supplierInvoiceNumber: supplierInvoiceNumber || '',
            totalAmount: items.reduce((sum, item) => sum + (item.quantity * item.purchaseCost), 0)
        };

        // Call the internal creation logic
        return await createAccessoryInward(req, res);

    } catch (error) {
        console.error('Error importing accessory inward:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createAccessoryInward,
    getAllAccessoryInwards,
    importAccessoryInwardsFromExcel
};
