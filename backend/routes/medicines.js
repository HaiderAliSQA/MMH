const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
    const meds = db.get('medicines').sortBy('name').value();
    res.json(meds);
});

router.post('/', (req, res) => {
    const med = { _id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
    db.get('medicines').push(med).write();
    res.status(201).json(med);
});

router.put('/:id', (req, res) => {
    db.get('medicines').find({ _id: req.params.id }).assign(req.body).write();
    res.json(db.get('medicines').find({ _id: req.params.id }).value());
});

router.delete('/:id', (req, res) => {
    db.get('medicines').remove({ _id: req.params.id }).write();
    res.json({ message: 'Medicine deleted' });
});

router.patch('/:id/restock', (req, res) => {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0)
        return res.status(400).json({ error: 'Valid quantity required' });
    const med = db.get('medicines').find({ _id: req.params.id });
    if (!med.value()) return res.status(404).json({ error: 'Not found' });
    const current = med.value().stock || 0;
    med.assign({ stock: current + Number(quantity) }).write();
    res.json(med.value());
});

module.exports = router;
