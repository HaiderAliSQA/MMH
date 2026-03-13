/**
 * db.js — Pure-JS JSON file database using lowdb v1
 * Zero MongoDB dependency, zero binary downloads required.
 * Data persists in ./data/db.json
 */
const low      = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt   = require('bcryptjs');
const path     = require('path');
const fs       = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const adapter = new FileSync(path.join(dataDir, 'db.json'));
const db      = low(adapter);

// ── Seed default users if first run ───────────────────────
const existingUsers = db.get('users').value();
if (!existingUsers || existingUsers.length === 0) {
    const hashed = bcrypt.hashSync('mmh1234', 10);
    db.defaults({
        users: [
            { _id: uuidv4(), name: 'Admin MMH',      email: 'admin@mmh.pk',     password: hashed, role: 'admin',        active: true, doctorInfo: null, createdAt: new Date().toISOString() },
            { _id: uuidv4(), name: 'Dr. Hamid Raza', email: 'doctor@mmh.pk',    password: hashed, role: 'doctor',       active: true, doctorInfo: { department: 'Cardiology', fee: 1500, timing: '09:00-14:00', days: ['Mon','Tue','Wed','Thu','Fri'], roomNo: '12A' }, createdAt: new Date().toISOString() },
            { _id: uuidv4(), name: 'Zara Shahid',    email: 'reception@mmh.pk', password: hashed, role: 'receptionist', active: true, doctorInfo: null, createdAt: new Date().toISOString() },
            { _id: uuidv4(), name: 'Asad Lab',       email: 'lab@mmh.pk',       password: hashed, role: 'lab',          active: true, doctorInfo: null, createdAt: new Date().toISOString() },
            { _id: uuidv4(), name: 'Nida Pharma',    email: 'pharmacy@mmh.pk',  password: hashed, role: 'pharmacist',   active: true, doctorInfo: null, createdAt: new Date().toISOString() },
            { _id: uuidv4(), name: 'Manager Sb.',    email: 'manager@mmh.pk',   password: hashed, role: 'manager',      active: true, doctorInfo: null, createdAt: new Date().toISOString() },
            { _id: uuidv4(), name: 'Muhammad Ali',   email: 'patient@mmh.pk',   password: hashed, role: 'patient',      active: true, doctorInfo: null, createdAt: new Date().toISOString() },
        ],
        patients:   [],
        medicines:  [],
        wards:      [],
        beds:       [],
        admissions: [],
        labs:       [],
        payments:   [],
    }).write();
    console.log('✅ Default users seeded (password: mmh1234 for all accounts)');
} else {
    db.defaults({
        patients: [], medicines: [], wards: [], beds: [],
        admissions: [], labs: [], payments: [],
    }).write();
}

console.log('✅ Database ready (JSON store: ./data/db.json)');
module.exports = db;
