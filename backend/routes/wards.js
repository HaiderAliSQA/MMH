const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Get all wards
router.get('/', (req, res) => {
    res.json(db.get('wards').value());
});

// Create ward + auto-create beds
router.post('/', (req, res) => {
    const { name, capacity, type } = req.body;
    const ward = { _id: uuidv4(), name, capacity, type, createdAt: new Date().toISOString() };
    db.get('wards').push(ward).write();

    // Auto-create beds
    const beds = [];
    for (let i = 1; i <= capacity; i++) {
        beds.push({
            _id:      uuidv4(),
            wardId:   ward._id,
            wardName: ward.name,
            number:   `${ward.name.substring(0, 3).toUpperCase()}-${i.toString().padStart(2, '0')}`,
            status:   'Available',
        });
    }
    beds.forEach(b => db.get('beds').push(b).write());

    res.status(201).json(ward);
});

// Get beds by ward
router.get('/:wardId/beds', (req, res) => {
    const beds = db.get('beds').filter({ wardId: req.params.wardId }).value();
    res.json(beds);
});

router.delete('/:id', (req, res) => {
    db.get('wards').remove({ _id: req.params.id }).write();
    db.get('beds').remove({ wardId: req.params.id }).write();
    res.json({ message: 'Ward deleted' });
});

module.exports = router;
