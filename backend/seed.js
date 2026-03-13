const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Ward = require('./models/Ward');
const Bed = require('./models/Bed');
const Medicine = require('./models/Medicine');

dotenv.config();

const seedData = async () => {
    try {
        await connectDB();

        // Clear existing data
        await User.deleteMany();
        await Ward.deleteMany();
        await Bed.deleteMany();
        await Medicine.deleteMany();

        console.log('Data Cleared...');

        // Users
        const users = [
            { name: 'Admin User', role: 'admin', password: 'password123', avClass: 'av-adm' },
            { name: 'Dr. Ahmad', role: 'doctor', password: 'password123', avClass: 'av-doc' },
            { name: 'Receptionist Ali', role: 'receptionist', password: 'password123', avClass: 'av-rec' },
            { name: 'Lab Tech Sana', role: 'lab', password: 'password123', avClass: 'av-lab' },
            { name: 'Pharmacist Bilal', role: 'pharmacist', password: 'password123', avClass: 'av-pha' },
            { name: 'Manager Raza', role: 'manager', password: 'password123', avClass: 'av-mgr' },
            { name: 'Patient Hamza', role: 'patient', password: 'password123', avClass: 'av-pat' }
        ];
        await User.insertMany(users);
        console.log('Users Seeded...');

        // Wards & Beds
        const wards = [
            { name: 'Cardiology', capacity: 10, type: 'Specialized' },
            { name: 'Neurology', capacity: 8, type: 'Specialized' },
            { name: 'Orthopedic', capacity: 12, type: 'General' },
            { name: 'General Medicine', capacity: 20, type: 'General' },
            { name: 'Pediatrics', capacity: 8, type: 'Specialized' },
            { name: 'Gynae', capacity: 10, type: 'Specialized' },
            { name: 'ICU', capacity: 6, type: 'Critical' },
            { name: 'Emergency', capacity: 10, type: 'Emergency' }
        ];

        for (const w of wards) {
            const ward = new Ward(w);
            await ward.save();
            const beds = [];
            for (let i = 1; i <= w.capacity; i++) {
                beds.push({
                    wardId: ward._id,
                    wardName: ward.name,
                    number: `${ward.name.substring(0, 3).toUpperCase()}-${i.toString().padStart(2, '0')}`,
                    status: 'Available'
                });
            }
            await Bed.insertMany(beds);
        }
        console.log('Wards & Beds Seeded...');

        // Medicines
        const medicines = [
            { name: 'Panadol', generic: 'Paracetamol', category: 'Analgesic', unit: 'Tablet', qty: 500, minLevel: 100, pricePerUnit: 5, expiry: '2026-12-01' },
            { name: 'Amoxicillin', generic: 'Amoxicillin', category: 'Antibiotic', unit: 'Capsule', qty: 50, minLevel: 100, pricePerUnit: 15, expiry: '2025-06-01' },
            { name: 'Brufen', generic: 'Ibuprofen', category: 'NSAID', unit: 'Syrup', qty: 30, minLevel: 50, pricePerUnit: 120, expiry: '2026-01-15' },
            { name: 'Insulin', generic: 'Insulin Glargine', category: 'Antidiabetic', unit: 'Vial', qty: 10, minLevel: 20, pricePerUnit: 1500, expiry: '2025-03-01' }
        ];
        await Medicine.insertMany(medicines);
        console.log('Medicines Seeded...');

        console.log('Database Seeded Successfully!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
