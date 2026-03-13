const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// GET all users with filters
router.get('/users', async (req, res) => {
    try {
        const { search, role } = req.query;
        let query = {};
        if (role && role !== 'All') query.role = role;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        const users = await User.find(query).sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST Create User
router.post('/users', async (req, res) => {
    try {
        const { name, email, password, phone, role, isActive, doctorData, patientData } = req.body;
        
        // 1. Create User
        const newUser = new User({ name, email, password, phone, role, isActive });
        const savedUser = await newUser.save();

        if (role === 'Doctor' && doctorData) {
            const newDoctor = new Doctor({
                userId: savedUser._id,
                name: savedUser.name,
                ...doctorData
            });
            await newDoctor.save();
        }

        if (role === 'Patient' && patientData) {
            const newPatient = new Patient({
                name: savedUser.name,
                phone: savedUser.phone,
                ...patientData
            });
            await newPatient.save();
        }

        console.log(`[MOCK EMAIL] To: ${email} | Subject: Welcome to MMH | Content: Your credentials are Email: ${email}, Password: ${password}`);
        
        res.status(201).json(savedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT Update User
router.put('/users/:id', async (req, res) => {
    try {
        const { name, phone, isActive, password } = req.body;
        const updateData = { name, phone, isActive };
        if (password) updateData.password = password;

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
