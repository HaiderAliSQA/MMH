const mongoose = require('mongoose');

const WardSchema = new mongoose.Schema({
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    type: { type: String, default: 'General' }
}, { timestamps: true });

module.exports = mongoose.model('Ward', WardSchema);
