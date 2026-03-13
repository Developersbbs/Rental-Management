// controllers/customerController.js
const Customer = require('../models/Customer');
const xlsx = require('xlsx');

// Import customers from Excel
exports.importCustomersFromExcel = async (req, res) => {
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
        const email = row['Email'] || row['email'] || row['EMAIL'];

        if (!name || !phone || !email) {
          stats.skipped++;
          stats.errors.push(`Row ${rowNumber}: Name, Phone and Email are required`);
          continue;
        }

        // Check for existing customer by phone or email
        const existing = await Customer.findOne({
          $or: [
            { phone: phone.toString().trim() },
            { email: email.toString().trim().toLowerCase() }
          ]
        });

        if (existing) {
          stats.skipped++;
          const conflict = existing.phone === phone.toString().trim() ? `phone ${phone}` : `email ${email}`;
          stats.errors.push(`Row ${rowNumber}: Customer with ${conflict} already exists`);
          continue;
        }

        const customer = new Customer({
          name: name.toString().trim(),
          phone: phone.toString().trim(),
          email: email.toString().trim().toLowerCase(),
          alternativePhone: (row['Alt Phone'] || row['Alternative Phone'] || row['alt_phone'] || '').toString().trim(),
          companyName: (row['Company'] || row['Company Name'] || '').toString().trim(),
          address: {
            street: (row['Street'] || row['Address'] || row['street'] || '').toString().trim(),
            city: (row['City'] || row['city'] || '').toString().trim(),
            state: (row['State'] || row['state'] || '').toString().trim(),
            zipCode: (row['Zip Code'] || row['Pincode'] || row['zip'] || '').toString().trim(),
            country: (row['Country'] || row['country'] || 'India').toString().trim(),
          },
          gstNumber: (row['GST'] || row['GST Number'] || '').toString().trim(),
          customerType: ['individual', 'business'].includes((row['Type'] || row['Customer Type'] || 'individual').toString().toLowerCase().trim())
            ? (row['Type'] || row['Customer Type'] || 'individual').toString().toLowerCase().trim()
            : 'individual',
          creditLimit: parseFloat(row['Credit Limit'] || 0) || 0,
          notes: (row['Notes'] || row['Remarks'] || '').toString().trim(),
          idProof: {
            type: ['aadhaar', 'pan', 'driving_license', 'voter_id', 'passport', 'other'].find(t =>
              (row['ID Type'] || row['ID Proof Type'] || '').toString().toLowerCase().replace(/[\s_-]/g, '').includes(t.replace(/_/g, ''))
            ) || 'other',
            number: (row['ID Number'] || row['ID Proof Number'] || '').toString().trim()
          },
          referral: {
            isGuest: (row['Is Guest'] || row['Guest'] || '').toString().toLowerCase() === 'true',
            source: (row['Source'] || row['Referral Source'] || '').toString().trim(),
            details: (row['Referral'] || row['Referral Details'] || '').toString().trim()
          }
        });

        // Validation for referral if not guest
        if (!customer.referral.isGuest && !customer.referral.source) {
          customer.referral.isGuest = true; // Default to guest if no source provided
        }

        await customer.save();
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

exports.getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      filter.status = status;
    }

    const customers = await Customer.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Customer.countDocuments(filter);

    res.status(200).json({
      customers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    console.log(`[getCustomerById] Fetching customer with ID: ${req.params.id}`);

    // --- Populate the virtual 'bills' field ---
    // You can specify which fields to populate from the Bill model
    const customer = await Customer.findById(req.params.id)
      .populate('bills', 'billNumber totalAmount billDate paymentStatus'); // Populate only necessary fields

    if (!customer) {
      console.log(`[getCustomerById] Customer not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Customer not found' });
    }

    console.log(`[getCustomerById] Successfully fetched customer: ${customer.name}`);
    res.status(200).json(customer);
  } catch (err) {
    // Enhanced error logging
    console.error("=== ERROR in getCustomerById ===");
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    console.error("Error Stack:", err.stack);
    console.error("Request ID:", req.params.id);
    console.error("================================");

    res.status(500).json({
      message: 'Server error',
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};


exports.createCustomer = async (req, res) => {
  try {
    const customerData = req.body;

    const existingCustomer = await Customer.findOne({ email: customerData.email });
    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer with this email already exists' });
    }

    const customer = new Customer(customerData);
    await customer.save();

    res.status(201).json({
      message: 'Customer created successfully',
      customer
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({
      message: 'Customer updated successfully',
      customer
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getCustomersStats = async (req, res) => {
  try {
    const stats = await Customer.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      total: 0,
      active: 0,
      inactive: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Block customer (Super Admin only)
exports.blockCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({
      message: 'Customer blocked successfully',
      customer
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Unblock customer (Super Admin only)
exports.unblockCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { isBlocked: false },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({
      message: 'Customer unblocked successfully',
      customer
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};