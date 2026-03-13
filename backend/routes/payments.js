const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
    res.json(db.get('payments').sortBy('createdAt').reverse().value());
});

router.post('/', (req, res) => {
    const payment = { _id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
    db.get('payments').push(payment).write();
    res.status(201).json(payment);
});

module.exports = router;
