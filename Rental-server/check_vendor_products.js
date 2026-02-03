
const mongoose = require('mongoose');
const RentalSupplier = require('./models/RentalSupplier');
const Product = require('./models/Product');
require('dotenv').config();

async function checkVendorProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const vendor = await RentalSupplier.findOne({ name: 'Sbbs' });
        if (!vendor) {
            console.log('Vendor "Sbbs" not found');
            return;
        }
        console.log(`Vendor Found: ${vendor.name} (${vendor._id})`);

        // Check for products with this supplier ID
        const products = await Product.find({ supplier: vendor._id });
        console.log(`Found ${products.length} products for this vendor.`);

        if (products.length > 0) {
            console.log('Sample Product:', JSON.stringify(products[0], null, 2));
        } else {
            // Try to find ANY product and see its structure
            const anyProduct = await Product.findOne();
            console.log('Any Random Product Structure:', JSON.stringify(anyProduct, null, 2));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

checkVendorProducts();
