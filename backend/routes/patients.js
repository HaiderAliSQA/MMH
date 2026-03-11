const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');

// Get all
router.get('/', async (req, res) => {
    try {
        const patients = await Patient.find().sort({ createdAt: -1 });
        res.json(patients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create
router.post('/', async (req, res) => {
    try {
        const patient = new Patient(req.body);
        await patient.save();
        res.status(201).json(patient);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update
router.put('/:id', async (req, res) => {
    try {
        const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(patient);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
