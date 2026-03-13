const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'mmh_secret_key';

// ── POST /api/users/login ─────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: 'Email and password required' });

        const user = db.get('users').find({ email: email.toLowerCase() }).value();
        if (!user)
            return res.status(401).json({ message: 'Invalid email or password' });

        if (!user.active)
            return res.status(403).json({ message: 'Account deactivated. Contact admin.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(401).json({ message: 'Invalid email or password' });

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            _id:        user._id,
            name:       user.name,
            email:      user.email,
            role:       user.role,
            active:     user.active,
            doctorInfo: user.doctorInfo || null,
            token,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ── GET /api/users ────────────────────────────────────────
router.get('/', (req, res) => {
    const users = db.get('users')
        .map(u => ({ ...u, password: undefined }))
        .sortBy('createdAt')
        .reverse()
        .value();
    res.json(users);
});

// ── POST /api/users/register ──────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, active, doctorInfo } = req.body;

        const exists = db.get('users').find({ email: email.toLowerCase() }).value();
        if (exists)
            return res.status(400).json({ message: 'Email already registered' });

        const hashed = await bcrypt.hash(password, 10);
        const user = {
            _id:        uuidv4(),
            name:       name.trim(),
            email:      email.toLowerCase().trim(),
            password:   hashed,
            role:       role || 'receptionist',
            active:     active !== undefined ? active : true,
            doctorInfo: role === 'doctor' ? (doctorInfo || {}) : null,
            createdAt:  new Date().toISOString(),
        };

        db.get('users').push(user).write();
        res.status(201).json({ ...user, password: undefined });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ── PUT /api/users/:id ────────────────────────────────────
router.put('/:id', async (req, res) => {
    try {
        const { name, email, password, role, active, doctorInfo } = req.body;
        const updateData = {};
        if (name  !== undefined) updateData.name   = name.trim();
        if (email !== undefined) updateData.email  = email.toLowerCase().trim();
        if (role  !== undefined) updateData.role   = role;
        if (active !== undefined) updateData.active = active;
        if (doctorInfo !== undefined) updateData.doctorInfo = doctorInfo;
        if (password && password.trim()) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = db.get('users').find({ _id: req.params.id });
        if (!user.value())
            return res.status(404).json({ message: 'User not found' });

        user.assign(updateData).write();
        const updated = { ...user.value(), password: undefined };
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ── DELETE /api/users/:id ─────────────────────────────────
router.delete('/:id', (req, res) => {
    db.get('users').remove({ _id: req.params.id }).write();
    res.json({ message: 'User deleted' });
});

module.exports = router;
