const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Inward = require('/home/sathish-r/Main-Peojects/Products/Rental-Management/Rental-server/models/Inward');
const RentalSupplier = require('/home/sathish-r/Main-Peojects/Products/Rental-Management/Rental-server/models/RentalSupplier');

async function check() {
    try {
        const uri = process.env.MONGODB_URI;
        console.log('URI loaded:', uri ? 'Yes' : 'No');
        if (!uri) throw new Error('MONGODB_URI is undefined check .env file');

        await mongoose.connect(uri);
        console.log('Connected to DB');

        const vendor = await RentalSupplier.findOne({ name: 'Sbbs' });
        if (!vendor) {
            console.log('Vendor "Sbbs" not found. Listing all vendors:');
            const vendors = await RentalSupplier.find({}, 'name');
            console.log(vendors.map(v => v.name));
            return;
        }
        console.log('Vendor ID:', vendor._id);
        console.log('Vendor Outstanding Balance:', vendor.statistics ? vendor.statistics.outstandingBalance : 'N/A');

        // Find all inwards for this supplier
        const inwards = await Inward.find({ supplier: vendor._id });
        console.log('Total Inwards:', inwards.length);
        inwards.forEach(i => {
            console.log(`Inward ${i.invoiceNumber}: Status=${i.paymentStatus}, Paid=${i.paidAmount}, Due=${i.dueAmount}`);
            if (i.paymentHistory && i.paymentHistory.length > 0) {
                console.log('  Payment History:', JSON.stringify(i.paymentHistory));
            }
        });

        // Check if any payment history exists aggregation style
        const paymentHistory = await Inward.aggregate([
            { $match: { supplier: vendor._id } },
            { $unwind: '$paymentHistory' }
        ]);
        console.log('Aggregated Payment History Count:', paymentHistory.length);
        if (paymentHistory.length > 0) {
            console.log('First Payment:', JSON.stringify(paymentHistory[0].paymentHistory));
        }

    } catch (e) { console.error('Error:', e); }
    finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}
check();
