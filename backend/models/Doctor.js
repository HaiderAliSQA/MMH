const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    dept: { type: String, required: true }, // Cardiology, Neurology, Orthopedics, General Medicine, Pediatrics, Gynecology
    specialization: { type: String },
    qualification: { type: String }, // MBBS, FCPS
    opdDays: { type: [String], default: [] }, // Mon, Tue, Wed...
    opdTiming: { type: String }, // "9:00 AM - 2:00 PM"
    fee: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', DoctorSchema);
