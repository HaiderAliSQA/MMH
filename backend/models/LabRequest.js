const mongoose = require('mongoose');

const LabRequestSchema = new mongoose.Schema({
    labId: { type: String, required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    patientName: { type: String, required: true },
    mr: { type: String, required: true },
    tests: [{ type: String }],
    urgent: { type: Boolean, default: false },
    date: { type: String },
    time: { type: String },
    status: { type: String, default: 'Pending' },
    results: [{
        test: { type: String },
        value: { type: String },
        normal: { type: String },
        flag: { type: String, default: 'Normal' }
    }]
}, { timestamps: true });

module.exports = mongoose.model('LabRequest', LabRequestSchema);
