const RentalCustomer = require('../models/RentalCustomer');
const xlsx = require('xlsx');

// Create rental customer
exports.createRentalCustomer = async (req, res) => {
    try {
        const { name, email, phone, alternativePhone, address, idProof, deposit, notes, referral, customerType, companyName, gstNumber } = req.body;


        const rentalCustomer = new RentalCustomer({
            name,
            email,
            phone,
            alternativePhone,
            address,
            idProof,
            deposit: deposit || 0,
            notes,
            referral,
            customerType: customerType || 'individual',
            companyName,
            gstNumber
        });

        await rentalCustomer.save();

        res.status(201).json({
            message: 'Rental customer created successfully',
            rentalCustomer
        });
    } catch (err) {
        console.error('Error creating rental customer:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get all rental customers
exports.getAllRentalCustomers = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { alternativePhone: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } }
            ];
        }

        const rentalCustomers = await RentalCustomer.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await RentalCustomer.countDocuments(filter);

        res.status(200).json({
            rentalCustomers,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (err) {
        console.error('Error fetching rental customers:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get rental customer by ID
exports.getRentalCustomerById = async (req, res) => {
    try {
        const rentalCustomer = await RentalCustomer.findById(req.params.id);

        if (!rentalCustomer) {
            return res.status(404).json({ message: 'Rental customer not found' });
        }

        res.status(200).json(rentalCustomer);
    } catch (err) {
        console.error('Error fetching rental customer:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update rental customer
exports.updateRentalCustomer = async (req, res) => {
    try {
        const { name, email, phone, alternativePhone, address, idProof, deposit, notes, status, referral, customerType, companyName, gstNumber } = req.body;

        const rentalCustomer = await RentalCustomer.findById(req.params.id);
        if (!rentalCustomer) {
            return res.status(404).json({ message: 'Rental customer not found' });
        }

        if (name) rentalCustomer.name = name;
        if (email !== undefined) rentalCustomer.email = email;
        if (phone) rentalCustomer.phone = phone;
        if (alternativePhone !== undefined) rentalCustomer.alternativePhone = alternativePhone;
        if (address !== undefined) rentalCustomer.address = address;
        if (idProof) rentalCustomer.idProof = idProof;
        if (deposit !== undefined) rentalCustomer.deposit = deposit;
        if (notes !== undefined) rentalCustomer.notes = notes;
        if (status) rentalCustomer.status = status;
        if (referral) rentalCustomer.referral = referral;
        if (customerType) rentalCustomer.customerType = customerType;
        if (companyName !== undefined) rentalCustomer.companyName = companyName;
        if (gstNumber !== undefined) rentalCustomer.gstNumber = gstNumber;

        await rentalCustomer.save();

        res.status(200).json({
            message: 'Rental customer updated successfully',
            rentalCustomer
        });
    } catch (err) {
        console.error('Error updating rental customer:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Delete rental customer
exports.deleteRentalCustomer = async (req, res) => {
    try {
        const rentalCustomer = await RentalCustomer.findByIdAndDelete(req.params.id);

        if (!rentalCustomer) {
            return res.status(404).json({ message: 'Rental customer not found' });
        }

        res.status(200).json({ message: 'Rental customer deleted successfully' });
    } catch (err) {
        console.error('Error deleting rental customer:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Block rental customer (Super Admin only)
exports.blockRentalCustomer = async (req, res) => {
    try {
        const rentalCustomer = await RentalCustomer.findByIdAndUpdate(
            req.params.id,
            { status: 'blocked' },
            { new: true }
        );

        if (!rentalCustomer) {
            return res.status(404).json({ message: 'Rental customer not found' });
        }

        res.status(200).json({
            message: 'Rental customer blocked successfully',
            rentalCustomer
        });
    } catch (err) {
        console.error('Error blocking rental customer:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Unblock rental customer (Super Admin only)
exports.unblockRentalCustomer = async (req, res) => {
    try {
        const rentalCustomer = await RentalCustomer.findByIdAndUpdate(
            req.params.id,
            { status: 'active' },
            { new: true }
        );

        if (!rentalCustomer) {
            return res.status(404).json({ message: 'Rental customer not found' });
        }

        res.status(200).json({
            message: 'Rental customer unblocked successfully',
            rentalCustomer
        });
    } catch (err) {
        console.error('Error unblocking rental customer:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Import rental customers from Excel
exports.importRentalCustomersFromExcel = async (req, res) => {
    try {
        console.log('--- STARTING CUSTOMER IMPORT ---');
        if (!req.file) {
            console.log('No file found in request');
            return res.status(400).json({ message: 'No file uploaded' });
        }
        console.log('File received:', req.file.originalname, 'Size:', req.file.size);

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);
        console.log('Data rows found:', data.length);
        if (data.length === 0) {
            console.log('Data array is empty');
            return res.status(400).json({ message: 'Excel file is empty' });
        }

        const stats = {
            created: 0,
            skipped: 0,
            errors: []
        };

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNumber = i + 2; // +1 for header, +1 for 0-index

            try {
                // Log first row for debugging
                if (i === 0) {
                    console.log('First row raw data:', JSON.stringify(row, null, 2));
                }

                // Basic validation
                const name = row['Name'] || row['name'] || row['Customer Name'] || row['Customer'] || row['NAME'];
                const phone = row['Phone'] || row['phone'] || row['Mobile'] || row['Contact'] || row['PHONE'];

                if (!name || !phone) {
                    stats.skipped++;
                    stats.errors.push(`Row ${rowNumber}: Name and Phone are required`);
                    continue;
                }

                // Check for existing customer by phone (simple avoid duplicates)
                const existing = await RentalCustomer.findOne({ phone: phone.toString().trim() });
                if (existing) {
                    stats.skipped++;
                    stats.errors.push(`Row ${rowNumber}: Customer with phone ${phone} already exists`);
                    continue;
                }

                const rentalCustomer = new RentalCustomer({
                    name: name.toString().trim(),
                    phone: phone.toString().trim(),
                    email: (row['Email'] || row['email'] || '').toString().trim(),
                    alternativePhone: (row['Alt Phone'] || row['Alternative Phone'] || row['alt_phone'] || '').toString().trim(),
                    address: {
                        street: (row['Street'] || row['Address'] || row['street'] || '').toString().trim(),
                        city: (row['City'] || row['city'] || '').toString().trim(),
                        state: (row['State'] || row['state'] || '').toString().trim(),
                        zipCode: (row['Zip Code'] || row['Pincode'] || row['zip'] || '').toString().trim(),
                        country: (row['Country'] || row['country'] || 'India').toString().trim(),
                    },
                    customerType: ['individual', 'business'].includes((row['Type'] || row['Customer Type'] || 'individual').toString().toLowerCase().trim())
                        ? (row['Type'] || row['Customer Type'] || 'individual').toString().toLowerCase().trim()
                        : 'individual',
                    companyName: (row['Company'] || row['Company Name'] || '').toString().trim(),
                    gstNumber: (row['GST'] || row['GST Number'] || '').toString().trim(),
                    idProof: {
                        type: ['aadhar', 'pan', 'driving_license', 'passport', 'voter_id'].find(t =>
                            (row['ID Type'] || row['ID Proof Type'] || '').toString().toLowerCase().replace(/[\s_-]/g, '').includes(t.replace(/_/g, ''))
                        ) || undefined,
                        number: (row['ID Number'] || row['ID Proof Number'] || '').toString().trim()
                    },
                    deposit: parseFloat(row['Deposit'] || row['Security Deposit'] || 0) || 0,
                    notes: (row['Notes'] || row['Remarks'] || '').toString().trim(),
                    referral: {
                        isGuest: (row['Is Guest'] || row['Guest'] || '').toString().toLowerCase() === 'true',
                        source: (row['Source'] || row['Referral Source'] || '').toString().trim(),
                        details: (row['Referral'] || row['Referral Details'] || '').toString().trim()
                    }
                });

                // Validation for referral if not guest
                if (!rentalCustomer.referral.isGuest && !rentalCustomer.referral.source) {
                    rentalCustomer.referral.isGuest = true; // Default to guest if no source provided
                }

                await rentalCustomer.save();
                stats.created++;

            } catch (error) {
                console.error(`Error importing row ${rowNumber}:`, error);
                stats.skipped++;
                stats.errors.push(`Row ${rowNumber}: ${error.message}`);
            }
        }

        res.status(200).json({
            message: `Import completed. Created: ${stats.created}, Skipped: ${stats.skipped}`,
            stats
        });

    } catch (err) {
        console.error('Error importing customers:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
