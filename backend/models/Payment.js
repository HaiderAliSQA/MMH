const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    invoiceNo: { type: String, required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    patientName: { type: String, required: true },
    method: { type: String, required: true },
    amount: { type: Number, required: true },
    ref: { type: String },
    date: { type: String },
    time: { type: String },
    status: { type: String, default: 'Paid' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
