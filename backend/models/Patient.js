const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    mr: { type: String, required: true },
    token: { type: String, required: true },
    name: { type: String, required: true },
    age: { type: String, required: true },
    gender: { type: String, required: true },
    cnic: { type: String, required: true },
    phone: { type: String },
    doctor: { type: String, required: true },
    dept: { type: String, required: true },
    doctorId: { type: String, required: true },
    date: { type: String },
    time: { type: String },
    status: { type: String, default: 'OPD' },
    admitted: { type: Boolean, default: false },
    ward: { type: String },
    bed: { type: String },
    history: { type: String },
    warisName: { type: String },
    warisRel: { type: String },
    warisPhone: { type: String },
    payType: { type: String },
    policyNo: { type: String },
    admitDate: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);
