const express = require('express');
const cors    = require('cors');

// Load env vars
require('dotenv').config();

// Initialize database (synchronous — must be first)
require('./config/db');

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── API Routes ─────────────────────────────────────────────
app.use('/api/users',      require('./routes/users'));
app.use('/api/patients',   require('./routes/patients'));
app.use('/api/labs',       require('./routes/labs'));
app.use('/api/medicines',  require('./routes/medicines'));
app.use('/api/payments',   require('./routes/payments'));
app.use('/api/wards',      require('./routes/wards'));
app.use('/api/admissions', require('./routes/admissions'));

// ── 404 Catch-all ──────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: `${req.method} ${req.path} not found` });
});

// ── Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    console.error('[Error]', err.message);
    res.status(500).json({ message: 'Internal server error' });
});

// ── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n🏥 MMH Backend running → http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
