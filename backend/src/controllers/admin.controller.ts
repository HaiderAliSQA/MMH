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

export const getUsers = async (req: Request, res: Response) => {
  const { role } = req.query;
  const query = role ? { role } : {};
  const users = await User.find(query).select('-password').sort({ createdAt: -1 });
  res.status(200).json(users);
};

export const createUser = async (req: Request, res: Response) => {
  const { name, email, password, role, phone } = req.body;
  
  try {
    const user = new User({ name, email, password, role, phone });
    await user.save();

    if (role === 'doctor') {
      const doctor = new Doctor({ 
        user: user._id, 
        name, 
        department: req.body.department || 'General',
        phone
      });
      await doctor.save();
    }

    const userObj = user.toObject();
    delete userObj.password;
    
    res.status(201).json(userObj);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email address is already in use by another member.' });
    }
    throw error;
  }


};

export const updateUser = async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Update fields
  if (req.body.name) user.name = req.body.name;
  if (req.body.email) user.email = req.body.email;
  if (req.body.role) user.role = req.body.role;
  if (req.body.phone) user.phone = req.body.phone;
  if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
  if (req.body.password) {
    user.password = req.body.password; // hook will hash it
  }

  await user.save();
  
  const userObj = user.toObject();
  delete userObj.password;
  res.status(200).json(userObj);
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
