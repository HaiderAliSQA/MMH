const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');

router.get('/', async (req, res) => {
    try {
        const meds = await Medicine.find().sort({ name: 1 });
        res.json(meds);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const med = new Medicine(req.body);
        await med.save();
        res.status(201).json(med);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const med = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(med);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
