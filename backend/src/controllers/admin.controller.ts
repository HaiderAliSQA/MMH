import { Request, Response } from 'express';
import User from '../models/User.model';
import Patient from '../models/Patient.model';
import Doctor from '../models/Doctor.model';
import OpdVisit from '../models/OpdVisit.model';
import LabRequest from '../models/LabRequest.model';
import Medicine from '../models/Medicine.model';
import Payment from '../models/Payment.model';
import Ward from '../models/Ward.model';
import Bed from '../models/Bed.model';

export const getStats = async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalPatients,
    todayOPD,
    admitted,
    totalDoctors,
    pendingLabs,
    lowStock,
    todayPayments
  ] = await Promise.all([
    Patient.countDocuments(),
    OpdVisit.countDocuments({ visitDate: { $gte: today } }),
    Patient.countDocuments({ status: 'Admitted' }),
    Doctor.countDocuments({ isActive: true }),
    LabRequest.countDocuments({ status: { $in: ['Pending', 'Processing'] } }),
    Medicine.countDocuments({ $expr: { $lte: ['$quantity', '$minQuantity'] } }),
    Payment.find({ createdAt: { $gte: today } })
  ]);

  const todayRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);

  res.status(200).json({
    totalPatients,
    todayOPD,
    admitted,
    totalDoctors,
    pendingLabs,
    lowStock,
    todayRevenue
  });
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const { role, status } = req.query;
  const query: Record<string, unknown> = {};

  if (role) query.role = role;
  if (status === 'active') query.isActive = true;
  if (status === 'inactive') query.isActive = false;

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 });

  // Add department info per user
  const deptMap: Record<string, string> = {
    admin: 'Administration',
    receptionist: 'Reception',
    lab: 'Laboratory',
    pharmacist: 'Pharmacy',
    manager: 'Management',
    patient: 'Patient',
  };

  const usersWithDept = await Promise.all(
    users.map(async (user) => {
      const userData = user.toObject() as unknown as Record<string, unknown>;

      if (user.role === 'doctor') {
        const doctor = await Doctor.findOne(
          { user: user._id },

          'department specialization fee'
        );
        userData.department = doctor?.department || 'Medical';
        userData.specialization = doctor?.specialization || '';
        userData.fee = doctor?.fee || 0;
      } else {
        userData.department = deptMap[user.role] || 'General';
      }

      return userData;
    })
  );

  res.status(200).json(usersWithDept);
};

export const createUser = async (req: any, res: Response): Promise<void> => {
  const {
    name, email, role, phone, isActive,
    department, specialization, qualification, fee, opdDays, opdTiming,
  } = req.body;

  try {
    // Check email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
      return;
    }

    // ALWAYS use mmh1234 as default password
    const DEFAULT_PASSWORD = 'mmh1234';

    const user = await User.create({
      name,
      email,
      password: DEFAULT_PASSWORD,
      role,
      phone,
      isActive: isActive ?? true,
    });

    // If doctor, create Doctor record too
    if (role === 'doctor') {
      await Doctor.create({
        user: user._id,
        name,
        department: department || 'General',
        specialization: specialization || '',
        qualification: qualification || '',
        fee: fee || 500,
        opdDays: opdDays || [],
        opdTiming: opdTiming || '9:00 AM - 2:00 PM',
        isActive: true,
      });
    }

    // Log credentials to server logs
    console.log(`
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📧 NEW USER CREATED
  Name:     ${name}
  Email:    ${email}
  Password: ${DEFAULT_PASSWORD}
  Role:     ${role}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    const userData = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      message: `User created! Default password: ${DEFAULT_PASSWORD}`,
      data: userData,
      defaultPassword: DEFAULT_PASSWORD,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Email address is already in use by another member.' });
      return;
    }
    throw error;
  }
};

export const updateUser = async (req: any, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, phone, role, isActive, active } = req.body;

  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  // Support both `isActive` and legacy `active` field names
  const activeValue = isActive !== undefined ? isActive : active;

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (role !== undefined) user.role = role;
  if (req.body.password) user.password = req.body.password;
  if (activeValue !== undefined) user.isActive = activeValue;

  await user.save();

  // If role doctor and isActive changed, sync Doctor record too
  if (role === 'doctor' || user.role === 'doctor') {
    await Doctor.findOneAndUpdate(
      { user: id },
      { isActive: activeValue ?? user.isActive }
    );
  }

  const updated = await User.findById(id).select('-password');

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: updated,
  });
};

export const getDoctors = async (req: Request, res: Response) => {
  const doctors = await Doctor.find({ isActive: true }).sort({ name: 1 });
  res.status(200).json(doctors);
};

export const createDoctor = async (req: Request, res: Response) => {
  const doctor = new Doctor(req.body);
  await doctor.save();
  res.status(201).json(doctor);
};

export const getWards = async (req: Request, res: Response) => {
  const wards = await Ward.find().sort({ name: 1 });
  res.status(200).json(wards);
};

export const getWardBeds = async (req: Request, res: Response) => {
  const beds = await Bed.find({ ward: req.params.wardId }).populate('patient', 'name mrNumber status');
  res.status(200).json(beds);
};
