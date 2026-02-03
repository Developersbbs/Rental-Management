
const mongoose = require('mongoose');
const RentalSupplier = require('./models/RentalSupplier');
const Product = require('./models/Product');
require('dotenv').config();

async function assignProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const vendor = await RentalSupplier.findOne({ name: 'Sbbs' });
        if (!vendor) {
            console.log('Vendor "Sbbs" not found');
            return;
        }
        console.log(`Vendor Found: ${vendor.name} (${vendor._id})`);

        // Find products without a supplier or specifically the 'Sample' product
        // updating up to 3 products
        const productsToUpdate = await Product.find({ supplier: { $exists: false } }).limit(3);

        if (productsToUpdate.length === 0) {
            console.log('No products found to update. Checking all products...');
            const allProducts = await Product.find().limit(3);
            if (allProducts.length > 0) {
                for (const p of allProducts) {
                    p.supplier = vendor._id;
                    await p.save();
                    console.log(`Updated Product: ${p.name} assigned to Sbbs`);
                }
            }
        } else {
            for (const p of productsToUpdate) {
                p.supplier = vendor._id;
                await p.save();
                console.log(`Updated Product: ${p.name} assigned to Sbbs`);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

assignProducts();
