const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    cat: { type: String },
    qty: { type: Number, required: true },
    min: { type: Number, default: 20 },
    price: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Medicine', MedicineSchema);
