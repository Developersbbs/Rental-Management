const Supplier = require('../models/RentalSupplier');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    // Build filter object
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      filter.status = status;
    }

    const suppliers = await Supplier.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Supplier.countDocuments(filter);

    res.status(200).json({
      suppliers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get supplier by ID
exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.status(200).json(supplier);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Create new supplier
exports.createSupplier = async (req, res) => {
  try {
    const supplierData = req.body;

    // Check if supplier with email already exists
    const existingSupplier = await Supplier.findOne({ email: supplierData.email });
    if (existingSupplier) {
      return res.status(400).json({ message: 'Supplier with this email already exists' });
    }

    const supplier = new Supplier(supplierData);
    await supplier.save();

    res.status(201).json({
      message: 'Supplier created successfully',
      supplier
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Supplier with this email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update supplier
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If email is being updated, check if it's already taken by another supplier
    if (updates.email) {
      const existingSupplier = await Supplier.findOne({
        email: updates.email,
        _id: { $ne: id }
      });

      if (existingSupplier) {
        return res.status(400).json({ message: 'Supplier with this email already exists' });
      }
    }

    const supplier = await Supplier.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.status(200).json({
      message: 'Supplier updated successfully',
      supplier
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Supplier with this email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findByIdAndDelete(id);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.status(200).json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get supplier statistics
exports.getSuppliersStats = async (req, res) => {
  try {
    const stats = await Supplier.aggregate([
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
      inactive: 0,
      pending: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get products for a supplier
exports.getSupplierProducts = async (req, res) => {
  try {
    const { id } = req.params;

    const products = await Product.find({ supplier: id })
      .populate('category', 'name')
      .select('_id name category price quantity batchNumber manufacturingDate expiryDate')
      .sort({ name: 1 });

    const mappedProducts = products.map(product => {
      const obj = product.toObject();
      if (!obj.manufacturingDate && obj.expiryDate) {
        obj.manufacturingDate = obj.expiryDate;
      }
      return obj;
    });

    res.status(200).json({ products: mappedProducts });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Record a payment for a vendor
exports.recordVendorPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params; // Vendor ID
    const { amount, paymentDate, paymentMethod, transactionId, notes } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }

    // 1. Find all pending/partial inwards for this vendor, sorted by date (FIFO)
    // We use the Inward model directly
    const Inward = require('../models/Inward');

    // Find candidate invoices to pay
    const pendingInwards = await Inward.find({
      supplier: id,
      paymentStatus: { $in: ['pending', 'partial'] }
    }).sort({ receivedDate: 1 }).session(session);

    let remainingPayment = Number(amount);
    const affectedInwards = [];

    // 2. Distribute payment across inwards
    for (const inward of pendingInwards) {
      if (remainingPayment <= 0) break;

      const currentDue = inward.dueAmount || 0;

      // Calculate how much we can pay for this invoice
      const paymentForThisInward = Math.min(remainingPayment, currentDue);

      if (paymentForThisInward > 0) {
        // Update inward fields
        inward.paidAmount = (inward.paidAmount || 0) + paymentForThisInward;
        // dueAmount and paymentStatus will be updated by pre-save hook in Inward model
        // but we can set them explicitly here to be safe or rely on the hook if we save properly

        // Add to payment history
        inward.paymentHistory.push({
          amount: paymentForThisInward,
          paymentMethod,
          paymentDate: paymentDate || new Date(),
          transactionId,
          notes,
          recordedBy: userId
        });

        await inward.save({ session });

        remainingPayment -= paymentForThisInward;
        affectedInwards.push({
          inwardId: inward._id,
          invoiceNumber: inward.invoiceNumber,
          amountPaid: paymentForThisInward
        });
      }
    }

    // If there is still money left over, we might want to store it as credit or overpayment
    // For now, let's just log it or handle it as "overpayment" on the last invoice or a separate mechanism
    // Implementation Decision: If amount > total due, we just apply what matches and return a warning or info
    let message = 'Payment recorded successfully';
    if (remainingPayment > 0) {
      // Logic for overpayment could go here (e.g. create a credit note or apply to future)
      // For this iteration, we acknowledge the excess but don't store it as "Advance" yet unless we add fields for it.
      // We will simply note it in the response.
      message += `. Note: Payment exceeded total due by ${remainingPayment}. Excess amount not applied.`;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message,
      totalPaid: Number(amount) - remainingPayment,
      remainingAmount: remainingPayment,
      affectedInwards
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error recording vendor payment:', err);
    res.status(500).json({ message: 'Server error recording payment', error: err.message });
  }
};

// Get payment history for a vendor
exports.getVendorPaymentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const Inward = require('../models/Inward');

    // Aggregate payment history from all Inwards for this supplier
    // We unwind the paymentHistory array to get individual transactions
    const paymentHistory = await Inward.aggregate([
      { $match: { supplier: new mongoose.Types.ObjectId(id) } },
      { $unwind: '$paymentHistory' },
      { $sort: { 'paymentHistory.paymentDate': -1 } },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 0,
          inwardId: '$_id',
          invoiceNumber: '$invoiceNumber',
          grnNumber: '$grnNumber',
          amount: '$paymentHistory.amount',
          paymentMethod: '$paymentHistory.paymentMethod',
          paymentDate: '$paymentHistory.paymentDate',
          transactionId: '$paymentHistory.transactionId',
          notes: '$paymentHistory.notes',
          recordedBy: '$paymentHistory.recordedBy'
        }
      },
      // Lookup user details for recordedBy
      {
        $lookup: {
          from: 'users',
          localField: 'recordedBy',
          foreignField: '_id',
          as: 'recorder'
        }
      },
      {
        $addFields: {
          recordedBy: {
            $concat: [
              { $arrayElemAt: ['$recorder.firstName', 0] },
              ' ',
              { $arrayElemAt: ['$recorder.lastName', 0] }
            ]
          }
        }
      },
      { $unset: 'recorder' }
    ]);

    // Get total count for pagination
    const totalResult = await Inward.aggregate([
      { $match: { supplier: new mongoose.Types.ObjectId(id) } },
      { $unwind: '$paymentHistory' },
      { $count: 'total' }
    ]);

    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    res.status(200).json({
      payments: paymentHistory,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });

  } catch (err) {
    console.error('Error fetching payment history:', err);
    res.status(500).json({ message: 'Server error fetching payments', error: err.message });
  }
};

// Record a payment for a vendor
exports.recordVendorPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params; // Vendor ID
    const { amount, paymentDate, paymentMethod, transactionId, notes } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }

    // 1. Find all pending/partial inwards for this vendor, sorted by date (FIFO)
    // We use the Inward model directly
    const Inward = require('../models/Inward');

    // Find candidate invoices to pay
    const pendingInwards = await Inward.find({
      supplier: id,
      paymentStatus: { $in: ['pending', 'partial'] }
    }).sort({ receivedDate: 1 }).session(session);

    let remainingPayment = Number(amount);
    const affectedInwards = [];

    // 2. Distribute payment across inwards
    for (const inward of pendingInwards) {
      if (remainingPayment <= 0) break;

      const currentDue = inward.dueAmount || 0;

      // Calculate how much we can pay for this invoice
      const paymentForThisInward = Math.min(remainingPayment, currentDue);

      if (paymentForThisInward > 0) {
        // Update inward fields
        inward.paidAmount = (inward.paidAmount || 0) + paymentForThisInward;
        // dueAmount and paymentStatus will be updated by pre-save hook in Inward model
        // but we can set them explicitly here to be safe or rely on the hook if we save properly

        // Add to payment history
        inward.paymentHistory.push({
          amount: paymentForThisInward,
          paymentMethod,
          paymentDate: paymentDate || new Date(),
          transactionId,
          notes,
          recordedBy: userId
        });

        await inward.save({ session });

        remainingPayment -= paymentForThisInward;
        affectedInwards.push({
          inwardId: inward._id,
          invoiceNumber: inward.invoiceNumber,
          amountPaid: paymentForThisInward
        });
      }
    }

    // If there is still money left over, we might want to store it as credit or overpayment
    // For now, let's just log it or handle it as "overpayment" on the last invoice or a separate mechanism
    // Implementation Decision: If amount > total due, we just apply what matches and return a warning or info
    let message = 'Payment recorded successfully';
    if (remainingPayment > 0) {
      // Logic for overpayment could go here (e.g. create a credit note or apply to future)
      // For this iteration, we acknowledge the excess but don't store it as "Advance" yet unless we add fields for it.
      // We will simply note it in the response.
      message += `. Note: Payment exceeded total due by ${remainingPayment}. Excess amount not applied.`;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message,
      totalPaid: Number(amount) - remainingPayment,
      remainingAmount: remainingPayment,
      affectedInwards
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error recording vendor payment:', err);
    res.status(500).json({ message: 'Server error recording payment', error: err.message });
  }
};

// Get payment history for a vendor
exports.getVendorPaymentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const Inward = require('../models/Inward');

    // Aggregate payment history from all Inwards for this supplier
    // We unwind the paymentHistory array to get individual transactions
    const paymentHistory = await Inward.aggregate([
      { $match: { supplier: new mongoose.Types.ObjectId(id) } },
      { $unwind: '$paymentHistory' },
      { $sort: { 'paymentHistory.paymentDate': -1 } },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 0,
          inwardId: '$_id',
          invoiceNumber: '$invoiceNumber',
          grnNumber: '$grnNumber',
          amount: '$paymentHistory.amount',
          paymentMethod: '$paymentHistory.paymentMethod',
          paymentDate: '$paymentHistory.paymentDate',
          transactionId: '$paymentHistory.transactionId',
          notes: '$paymentHistory.notes',
          recordedBy: '$paymentHistory.recordedBy'
        }
      },
      // Lookup user details for recordedBy
      {
        $lookup: {
          from: 'users',
          localField: 'recordedBy',
          foreignField: '_id',
          as: 'recorder'
        }
      },
      {
        $addFields: {
          recordedBy: {
            $concat: [
              { $arrayElemAt: ['$recorder.firstName', 0] },
              ' ',
              { $arrayElemAt: ['$recorder.lastName', 0] }
            ]
          }
        }
      },
      { $unset: 'recorder' }
    ]);

    // Get total count for pagination
    const totalResult = await Inward.aggregate([
      { $match: { supplier: new mongoose.Types.ObjectId(id) } },
      { $unwind: '$paymentHistory' },
      { $count: 'total' }
    ]);

    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    res.status(200).json({
      payments: paymentHistory,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });

  } catch (err) {
    console.error('Error fetching payment history:', err);
    res.status(500).json({ message: 'Server error fetching payments', error: err.message });
  }
};