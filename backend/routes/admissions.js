const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
    res.json(db.get('admissions').sortBy('createdAt').reverse().value());
});

router.post('/', (req, res) => {
    const admission = { _id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
    db.get('admissions').push(admission).write();
    res.status(201).json(admission);
});

router.put('/:id', (req, res) => {
    db.get('admissions').find({ _id: req.params.id }).assign(req.body).write();
    res.json(db.get('admissions').find({ _id: req.params.id }).value());
});

module.exports = router;
