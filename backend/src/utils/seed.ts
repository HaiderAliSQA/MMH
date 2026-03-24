import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model';
import Doctor from '../models/Doctor.model';
import Medicine from '../models/Medicine.model';
import Ward from '../models/Ward.model';
import Bed from '../models/Bed.model';
import Employee, { generateEmployeeId } from '../models/Employee.model';
import Attendance from '../models/Attendance.model';
import LeaveRequest from '../models/LeaveRequest.model';
import Payroll from '../models/Payroll.model';
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
    await Employee.deleteMany();
    await Attendance.deleteMany();
    await LeaveRequest.deleteMany();
    await Payroll.deleteMany();

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
      { name: 'Surgical Ward', department: 'Surgery', totalBeds: 15, prefix: 'SUR-' },
      { name: 'Orthopedic Ward', department: 'Orthopedics', totalBeds: 12, prefix: 'ORTHO-' },
      { name: 'Plastic Surgery', department: 'Plastic Surgery', totalBeds: 8, prefix: 'PL-' },
      { name: 'Cardiology Ward', department: 'Cardiology', totalBeds: 10, prefix: 'C-' },
      { name: 'General Ward', department: 'General Medicine', totalBeds: 20, prefix: 'G-' },
      { name: 'Emergency', department: 'Emergency', totalBeds: 10, prefix: 'E-' }
    ];

    let totalBedsCreated = 0;
    for (const w of wardsData) {
      const ward = new Ward({ name: w.name, department: w.department, totalBeds: w.totalBeds });
      await ward.save();
      const bedsToCreate = [];
      for (let i = 1; i <= w.totalBeds; i++) {
        bedsToCreate.push({ bedNumber: `${w.prefix}${String(i).padStart(2, '0')}`, ward: ward._id });
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

    // ═══ CREATE EMPLOYEE PROFILES ═══
    const employeeSeedData = [
      { userEmail: 'admin@mmh.pk', department: 'Administration', designation: 'Hospital Administrator', basicSalary: 120000, houseAllowance: 20000, medicalAllowance: 10000, transportAllowance: 8000, joiningDate: new Date('2020-01-01'), annualLeaveBalance: 24 },
      { userEmail: 'reception@mmh.pk', department: 'Reception', designation: 'Senior Receptionist', basicSalary: 25000, houseAllowance: 5000, medicalAllowance: 3000, transportAllowance: 2000, joiningDate: new Date('2022-06-01'), annualLeaveBalance: 20 },
      { userEmail: 'doctor@mmh.pk', department: 'Cardiology', designation: 'Senior Cardiologist', basicSalary: 80000, houseAllowance: 15000, medicalAllowance: 8000, transportAllowance: 5000, joiningDate: new Date('2021-03-15'), annualLeaveBalance: 22 },
      { userEmail: 'lab@mmh.pk', department: 'Laboratory', designation: 'Lab Technician', basicSalary: 20000, houseAllowance: 4000, medicalAllowance: 2500, transportAllowance: 1500, joiningDate: new Date('2023-01-10'), annualLeaveBalance: 18 },
      { userEmail: 'pharmacy@mmh.pk', department: 'Pharmacy', designation: 'Senior Pharmacist', basicSalary: 22000, houseAllowance: 4500, medicalAllowance: 3000, transportAllowance: 1500, joiningDate: new Date('2022-09-01'), annualLeaveBalance: 20 },
      { userEmail: 'manager@mmh.pk', department: 'Management', designation: 'Hospital Manager', basicSalary: 60000, houseAllowance: 12000, medicalAllowance: 6000, transportAllowance: 4000, joiningDate: new Date('2021-07-01'), annualLeaveBalance: 24 },
    ];

    const createdEmployees: any[] = [];
    for (const emp of employeeSeedData) {
      const user = createdUsers.find(u => u.email === emp.userEmail);
      if (user) {
        const employeeId = await generateEmployeeId();
        const employee = await Employee.create({
          user: user._id, employeeId, name: user.name, role: user.role,
          department: emp.department, designation: emp.designation,
          phone: user.phone || '', joiningDate: emp.joiningDate,
          basicSalary: emp.basicSalary, houseAllowance: emp.houseAllowance,
          medicalAllowance: emp.medicalAllowance, transportAllowance: emp.transportAllowance,
          annualLeaveBalance: emp.annualLeaveBalance,
        });
        createdEmployees.push(employee);
      }
    }

    // ═══ SEED ATTENDANCE — March 2026 ═══
    const attRecords: any[] = [];
    const statusPool = ['Present','Present','Present','Present','Late','Present'];
    for (const emp of createdEmployees) {
      for (let day = 1; day <= 20; day++) {
        const d = new Date(2026, 2, day);
        if (d.getDay() === 0) continue;
        const st = day === 10 ? 'Absent' : day === 15 ? 'Late' : statusPool[Math.floor(Math.random() * statusPool.length)];
        attRecords.push({
          employee: emp._id, date: d, status: st,
          checkIn: st === 'Present' ? '09:00' : st === 'Late' ? '09:45' : undefined,
          checkOut: st !== 'Absent' ? '17:00' : undefined,
          overtimeHours: day === 18 ? 2 : 0,
        });
      }
    }
    await Attendance.insertMany(attRecords);

    // ═══ SEED LEAVE REQUESTS ═══
    const leaveData = [
      { ei: 1, type: 'Annual', from: '2026-03-25', to: '2026-03-27', reason: 'Family wedding in Lahore', status: 'Approved', days: 3 },
      { ei: 2, type: 'Sick', from: '2026-03-10', to: '2026-03-11', reason: 'Flu and fever', status: 'Approved', days: 2 },
      { ei: 3, type: 'Emergency', from: '2026-03-20', to: '2026-03-20', reason: 'Family emergency', status: 'Pending', days: 1 },
      { ei: 4, type: 'Annual', from: '2026-04-01', to: '2026-04-03', reason: 'Personal travel', status: 'Pending', days: 3 },
      { ei: 5, type: 'Sick', from: '2026-03-05', to: '2026-03-06', reason: 'Doctor appointment', status: 'Rejected', days: 2 },
      { ei: 0, type: 'Annual', from: '2026-03-15', to: '2026-03-16', reason: 'Personal work', status: 'Approved', days: 2 },
    ];
    for (const ld of leaveData) {
      if (createdEmployees[ld.ei]) {
        await LeaveRequest.create({
          employee: createdEmployees[ld.ei]._id, leaveType: ld.type,
          fromDate: new Date(ld.from), toDate: new Date(ld.to),
          reason: ld.reason, status: ld.status, totalDays: ld.days,
          rejectedReason: ld.status === 'Rejected' ? 'Short notice, no coverage' : undefined,
        });
      }
    }

    // ═══ SEED PAYROLL — March 2026 ═══
    const adminU = createdUsers.find(u => u.email === 'admin@mmh.pk');
    for (const emp of createdEmployees) {
      const gross = (emp.basicSalary||0)+(emp.houseAllowance||0)+(emp.medicalAllowance||0)+(emp.transportAllowance||0);
      const tax = gross > 50000 ? Math.round(gross * 0.05) : 0;
      const pf = Math.round(emp.basicSalary * 0.03);
      await Payroll.create({
        employee: emp._id, month: 3, year: 2026,
        basicSalary: emp.basicSalary, houseAllowance: emp.houseAllowance,
        medicalAllowance: emp.medicalAllowance, transportAllowance: emp.transportAllowance,
        overtimePay: 0, absentDeduction: 0, lateDeduction: 0, halfDayDeduction: 0,
        eobi: pf, incomeTax: tax, loanDeduction: 0,
        grossSalary: gross,
        totalDeductions: tax + pf, netSalary: gross - tax - pf,
        status: 'Generated', generatedBy: adminU?._id,
      });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ MMH Database Seeded!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`7 Users | 6 Doctors | 6 Wards + ${totalBedsCreated} Beds | 12 Medicines`);
    console.log(`${createdEmployees.length} Employees | ${attRecords.length} Attendance | ${leaveData.length} Leaves | ${createdEmployees.length} Payroll`);
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
