import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';

const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: (process.env.JWT_EXPIRE || '7d') as any,
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  // Check if account is active
  if (user.isActive === false) {
    res.status(403).json({
      message: 'Your account has been deactivated. Please contact administrator.'
    });
    return;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  const token = generateToken(user.id, user.role);

  res.status(200).json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
    }
  });
};

export const getMe = async (req: Request, res: Response) => {
  // @ts-ignore - Assuming auth middleware sets req.user
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Not authorized' });

  const user = await User.findById(userId).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });

  res.status(200).json(user);
};

export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  // @ts-ignore
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
    return;
  }

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters'
    });
    return;
  }

  user.password = newPassword; // Pre-save hook will hash it
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
};

export const updateProfile = async (req: Request, res: Response) => {
  const { name, phone } = req.body;
  // @ts-ignore
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Not authorized'
    });
    return;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { name, phone },
    { new: true }
  ).select('-password');

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
    return;
  }

  res.json({
    success: true,
    data: user
  });
};
