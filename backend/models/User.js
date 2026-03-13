const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name:       { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:   { type: String, required: true },
    role:       { type: String, required: true, enum: ['admin','doctor','receptionist','lab','pharmacist','manager','patient'], default: 'receptionist' },
    active:     { type: Boolean, default: true },
    doctorInfo: {
        department: { type: String, default: '' },
        fee:        { type: Number, default: 0 },
        timing:     { type: String, default: '' },
        days:       [{ type: String }],
        roomNo:     { type: String, default: '' },
    },
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password helper
UserSchema.methods.matchPassword = async function(entered) {
    return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', UserSchema);
