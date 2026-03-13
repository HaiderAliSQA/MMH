const mongoose = require('mongoose');

const BedSchema = new mongoose.Schema({
    wardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
    wardName: { type: String, required: true },
    number: { type: String, required: true },
    status: { type: String, enum: ['Available', 'Occupied', 'Maintenance'], default: 'Available' },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
    patientName: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Bed', BedSchema);
