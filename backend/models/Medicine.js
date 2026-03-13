const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    generic: { type: String },
    category: { type: String },
    unit: { type: String },
    qty: { type: Number, required: true },
    minLevel: { type: Number, default: 20 },
    pricePerUnit: { type: Number, default: 0 },
    expiry: { type: String },
    status: { type: String, default: 'In Stock' }
}, { timestamps: true });

module.exports = mongoose.model('Medicine', MedicineSchema);
