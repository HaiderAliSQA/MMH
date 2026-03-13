const mongoose = require('mongoose');

const AdmissionSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    patientName: { type: String, required: true },
    mr: { type: String, required: true },
    wardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
    wardName: { type: String, required: true },
    bedId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed', required: true },
    bedNumber: { type: String, required: true },
    history: { type: String, required: true },
    symptoms: { type: String, required: true },
    warisName: { type: String, required: true },
    warisPhone: { type: String, required: true },
    warisRel: { type: String, required: true },
    payType: { type: String, default: 'Cash' },
    policyNo: { type: String },
    admitDate: { type: String },
    status: { type: String, default: 'Admitted' }
}, { timestamps: true });

module.exports = mongoose.model('Admission', AdmissionSchema);
