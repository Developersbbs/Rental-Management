const mongoose = require('mongoose');

const rentalInwardSchema = new mongoose.Schema({
    inwardNumber: {
        type: String,
        unique: true,
        required: true
    },
    inwardType: {
        type: String,
        enum: ['purchase', 'sub_rental'],
        default: 'purchase',
        required: true
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RentalSupplier', // Changed to RentalSupplier
        required: function () { return this.inwardType === 'sub_rental'; }
    },
    receivedDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RentalProduct',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        // For Purchase
        purchaseCost: {
            type: Number,
            min: 0,
            required: function () { return this.ownerDocument().inwardType === 'purchase'; }
        },
        // For Sub-rental
        vendorRentalRate: {
            hourly: { type: Number, min: 0, default: 0 },
            daily: { type: Number, min: 0, default: 0 },
            monthly: { type: Number, min: 0, default: 0 }
        },
        vendorReturnDate: {
            type: Date
        },
        ownershipType: {
            type: String,
            enum: ['owned', 'sub_rented'],
            default: 'owned'
        },
        batchNumber: {
            type: String,
            required: true
        },
        brand: {
            type: String,
            trim: true
        },
        modelNumber: {
            type: String,
            trim: true
        },
        purchaseDate: {
            type: Date
        },
        condition: {
            type: String,
            enum: ['new', 'good', 'fair'],
            default: 'new'
        },
        notes: {
            type: String
        }
    }],
    supplierInvoiceNumber: {
        type: String,
        trim: true
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    notes: {
        type: String
    },
    // Track all inventory items created from this inward
    inwardHistory: [{
        inventoryItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RentalInventoryItem'
        },
        uniqueIdentifier: String,
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RentalProduct'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    receivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'completed'
    }
}, {
    timestamps: true
});

// Auto-generate inward number before saving
rentalInwardSchema.pre('validate', async function (next) {
    if (!this.inwardNumber) {
        const count = await mongoose.model('RentalInward').countDocuments();
        this.inwardNumber = `RI-${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

module.exports = mongoose.model('RentalInward', rentalInwardSchema);
