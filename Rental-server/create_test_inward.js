const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Inward = require('/home/sathish-r/Main-Peojects/Products/Rental-Management/Rental-server/models/Inward');
const RentalSupplier = require('/home/sathish-r/Main-Peojects/Products/Rental-Management/Rental-server/models/RentalSupplier');
const User = require('/home/sathish-r/Main-Peojects/Products/Rental-Management/Rental-server/models/User');

async function createInward() {
    try {
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log('Connected to DB');

        const vendor = await RentalSupplier.findOne({ name: 'Sbbs' });
        if (!vendor) throw new Error('Vendor Sbbs not found');

        const user = await User.findOne({ role: 'superadmin' }) || await User.findOne({});
        if (!user) throw new Error('No user found');

        // Cleanup old test data
        await Inward.deleteMany({ supplier: vendor._id, invoiceNumber: 'INV-TEST-001' });

        const inward = new Inward({
            supplier: vendor._id,
            invoiceNumber: 'INV-TEST-001',
            grnNumber: 'GRN-TEST-001',
            receivedDate: new Date(),
            items: [{
                product: new mongoose.Types.ObjectId(), // Fake ID
                productName: 'Test Product',
                orderedQuantity: 10,
                receivedQuantity: 10,
                unitCost: 100,
                total: 1000,
                batchNumber: 'BATCH-001',
                manufacturingDate: new Date()
            }],
            totalAmount: 1000,
            paidAmount: 0,
            dueAmount: 1000,
            paymentStatus: 'pending',
            paymentHistory: [],
            status: 'pending',
            createdBy: user._id
        });

        await inward.save();
        console.log('Created test Inward with Items:', inward._id);
        console.log('Total:', inward.totalAmount, 'Due:', inward.dueAmount);

    } catch (e) { console.error('Error:', e); }
    finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}
createInward();
