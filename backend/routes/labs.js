const express = require('express');
const router = express.Router();
const LabRequest = require('../models/LabRequest');

router.get('/', async (req, res) => {
    try {
        const labs = await LabRequest.find().sort({ createdAt: -1 });
        res.json(labs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const lab = new LabRequest(req.body);
        await lab.save();
        res.status(201).json(lab);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const lab = await LabRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(lab);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
