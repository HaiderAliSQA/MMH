const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
    const patients = db.get('patients').sortBy('createdAt').reverse().value();
    res.json(patients);
});

router.post('/', (req, res) => {
    const patient = { _id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
    db.get('patients').push(patient).write();
    res.status(201).json(patient);
});

router.put('/:id', (req, res) => {
    db.get('patients').find({ _id: req.params.id }).assign(req.body).write();
    res.json(db.get('patients').find({ _id: req.params.id }).value());
});

router.delete('/:id', (req, res) => {
    db.get('patients').remove({ _id: req.params.id }).write();
    res.json({ message: 'Patient deleted' });
});

module.exports = router;
