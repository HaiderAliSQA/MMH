import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model';
import Doctor from '../models/Doctor.model';
import Medicine from '../models/Medicine.model';
import Ward from '../models/Ward.model';
import Bed from '../models/Bed.model';
import connectDB from '../config/db';

dotenv.config();

const seedDB = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Doctor.deleteMany();
    await Medicine.deleteMany();
    await Ward.deleteMany();
    await Bed.deleteMany();

    // Create Users (7)
    const usersData = [
      { name: 'Admin MMH',       email: 'admin@mmh.pk',      password: 'mmh1234', role: 'admin' },
      { name: 'Zara Shahid',     email: 'reception@mmh.pk',  password: 'mmh1234', role: 'receptionist' },
      { name: 'Dr. Hamid Raza',  email: 'doctor@mmh.pk',     password: 'mmh1234', role: 'doctor' },
      { name: 'Asad Lab',        email: 'lab@mmh.pk',        password: 'mmh1234', role: 'lab' },
      { name: 'Nida Pharma',     email: 'pharmacy@mmh.pk',   password: 'mmh1234', role: 'pharmacist' },
      { name: 'Manager MMH',     email: 'manager@mmh.pk',    password: 'mmh1234', role: 'manager' },
      { name: 'Test Patient',    email: 'patient@mmh.pk',    password: 'mmh1234', role: 'patient' }
    ];

    const users = await User.insertMany(usersData.map(u => new User(u))); // Pre-save hooks aren't triggered by insertMany, but wait, the prompt doesn't say insertMany or save, let's use create which triggers save or map save. Actually, we should just use create to trigger hooks.
    // wait, I will loop and save so hooks run.
    await User.deleteMany();
    const createdUsers = [];
    for (const u of usersData) {
      const user = new User(u);
      await user.save();
      createdUsers.push(user);
    }

    // Create Doctors (6)
    const drHamid = createdUsers.find(u => u.email === 'doctor@mmh.pk');
    const doctorsData = [
      { user: drHamid?._id, name: 'Dr. Hamid Raza', department: 'Cardiology', qualification: 'MBBS FCPS', fee: 800, opdDays: ['Mon', 'Wed', 'Fri'] },
      { name: 'Dr. Sara Malik', department: 'Neurology', qualification: 'MBBS FCPS', fee: 1000, opdDays: ['Tue', 'Thu'] },
      { name: 'Dr. Usman Tariq', department: 'Orthopedics', qualification: 'MBBS MS', fee: 1200, opdDays: ['Mon', 'Tue', 'Wed'] },
      { name: 'Dr. Fatima Noor', department: 'General Medicine', qualification: 'MBBS', fee: 500, opdDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { name: 'Dr. Ali Zaman', department: 'Pediatrics', qualification: 'MBBS DCH', fee: 700, opdDays: ['Wed', 'Fri', 'Sat'] },
      { name: 'Dr. Ayesha Baig', department: 'Gynecology', qualification: 'MBBS FCPS', fee: 1000, opdDays: ['Mon', 'Thu', 'Sat'] }
    ];
    await Doctor.insertMany(doctorsData);

    // Create Wards + Beds
    const wardsData = [
      { name: 'Cardiology Ward', department: 'Cardiology', totalBeds: 10, prefix: 'C-' },
      { name: 'General Ward', department: 'General Medicine', totalBeds: 20, prefix: 'G-' },
      { name: 'Pediatrics Ward', department: 'Pediatrics', totalBeds: 8, prefix: 'P-' },
      { name: 'Gynae Ward', department: 'Gynecology', totalBeds: 10, prefix: 'GY-' },
      { name: 'ICU', department: 'Intensive Care', totalBeds: 6, prefix: 'ICU-' },
      { name: 'Emergency', department: 'Emergency', totalBeds: 10, prefix: 'E-' }
    ];

    let totalBedsCreated = 0;
    for (const w of wardsData) {
      const ward = new Ward({ name: w.name, department: w.department, totalBeds: w.totalBeds });
      await ward.save();
      
      const bedsToCreate = [];
      for (let i = 1; i <= w.totalBeds; i++) {
        bedsToCreate.push({
          bedNumber: `${w.prefix}${String(i).padStart(2, '0')}`,
          ward: ward._id,
        });
      }
      await Bed.insertMany(bedsToCreate);
      totalBedsCreated += bedsToCreate.length;
    }

    // Create Medicines (12)
    const medicinesData = [
      { name: 'Paracetamol 500mg', category: 'Painkiller', quantity: 500, minQuantity: 50, pricePerUnit: 5 },
      { name: 'Amoxicillin 500mg', category: 'Antibiotic', quantity: 240, minQuantity: 30, pricePerUnit: 25 },
      { name: 'Metformin 500mg', category: 'Antidiabetic', quantity: 360, minQuantity: 50, pricePerUnit: 18 },
      { name: 'Omeprazole 20mg', category: 'Antacid', quantity: 180, minQuantity: 30, pricePerUnit: 22 },
      { name: 'Aspirin 75mg', category: 'Painkiller', quantity: 15, minQuantity: 50, pricePerUnit: 8 },
      { name: 'Ibuprofen 400mg', category: 'Painkiller', quantity: 200, minQuantity: 40, pricePerUnit: 12 },
      { name: 'Ciprofloxacin 500mg', category: 'Antibiotic', quantity: 150, minQuantity: 30, pricePerUnit: 35 },
      { name: 'Atorvastatin 20mg', category: 'Statin', quantity: 90, minQuantity: 20, pricePerUnit: 45 },
      { name: 'Amlodipine 5mg', category: 'Antihypertensive', quantity: 120, minQuantity: 20, pricePerUnit: 30 },
      { name: 'Dexamethasone 4mg', category: 'Steroid', quantity: 80, minQuantity: 20, pricePerUnit: 55 },
      { name: 'Normal Saline 500ml', category: 'IV Fluid', unit: 'Bottle', quantity: 100, minQuantity: 20, pricePerUnit: 120 },
      { name: 'Pantoprazole 40mg', category: 'Antacid', quantity: 8, minQuantity: 30, pricePerUnit: 28 }
    ];
    await Medicine.insertMany(medicinesData);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ MMH Database Seeded!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('7 Users created');
    console.log('6 Doctors created');
    console.log(`6 Wards + ${totalBedsCreated} Beds created`);
    console.log('12 Medicines created');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Login: admin@mmh.pk / mmh1234');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
    process.exit(1);
  }
};

seedDB();
