const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
    res.json(db.get('labs').sortBy('createdAt').reverse().value());
});

router.post('/', (req, res) => {
    const lab = { _id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
    db.get('labs').push(lab).write();
    res.status(201).json(lab);
});

router.put('/:id', (req, res) => {
    db.get('labs').find({ _id: req.params.id }).assign(req.body).write();
    res.json(db.get('labs').find({ _id: req.params.id }).value());
});

router.delete('/:id', (req, res) => {
    db.get('labs').remove({ _id: req.params.id }).write();
    res.json({ message: 'Lab request deleted' });
});

module.exports = router;
