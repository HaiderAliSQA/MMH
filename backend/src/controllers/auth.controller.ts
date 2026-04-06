import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.model';
import Session from '../models/Session.model';

// Extend Request to carry user info set by middleware
interface IAuthRequest extends Request {
  user?: { id: string; role: string };
}

// ─── Helper: detect human-readable device info ─────────────────────────────
const getDeviceInfo = (ua: string): string => {
  if (ua.includes('Mobile'))   return 'Mobile Browser';
  if (ua.includes('Edg'))      return 'Edge Browser';
  if (ua.includes('Chrome'))   return 'Chrome Browser';
  if (ua.includes('Firefox'))  return 'Firefox Browser';
  if (ua.includes('Safari'))   return 'Safari Browser';
  return 'Web Browser';
};

// ─── Helper: create a new DB-backed session and return token ────────────────
const createSession = async (
  user: IUser,
  req: Request,
  res: Response
): Promise<void> => {
  const now      = new Date();
  const expiresAt = new Date(now.getTime() + 20 * 60 * 60 * 1000); // +20 h

  // Generate JWT valid for 20 hours
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '20h' }
  );

  // Resolve device / IP
  const userAgent  = req.headers['user-agent'] || '';
  const deviceInfo = getDeviceInfo(userAgent);
  const ipAddress  = (
    (req.headers['x-forwarded-for'] as string) ||
    req.socket.remoteAddress ||
    ''
  ).split(',')[0].trim();

  // Persist session
  await Session.create({
    user:       user._id,
    token,
    deviceInfo,
    ipAddress,
    loginAt:    now,
    expiresAt,
    isActive:   true,
  });

  res.json({
    success:   true,
    token,
    expiresAt: expiresAt.toISOString(),
    user: {
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
};

// ─── LOGIN ──────────────────────────────────────────────────────────────────
export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
    return;
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
    return;
  }

  // Check account active status
  if (user.isActive === false) {
    res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact administrator.',
    });
    return;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
    return;
  }

  // ── Check for an existing active, non-expired session ─────────────────────
  const existingSession = await Session.findOne({
    user:      user._id,
    isActive:  true,
    expiresAt: { $gt: new Date() },
  });

  if (existingSession) {
    // Return 409 — let frontend show the conflict modal
    res.status(409).json({
      success: false,
      code:    'SESSION_EXISTS',
      message: 'You are already logged in on another device.',
      existingSession: {
        deviceInfo: existingSession.deviceInfo,
        loginAt:    existingSession.loginAt,
        ipAddress:  existingSession.ipAddress,
      },
      // Short-lived opaque token so the frontend can call forceLogin
      conflictToken: Buffer.from(
        JSON.stringify({
          userId: user._id,
          email:  user.email,
          ts:     Date.now(),
        })
      ).toString('base64'),
    });
    return;
  }

  // ── No conflict — create a fresh session ──────────────────────────────────
  await createSession(user, req, res);
};

// ─── FORCE LOGIN ─────────────────────────────────────────────────────────────
// User chose "Login here" — invalidate ALL old sessions, then create a new one
export const forceLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { conflictToken } = req.body;

  if (!conflictToken) {
    res.status(400).json({ success: false, message: 'conflictToken is required' });
    return;
  }

  let userId: string;
  try {
    const decoded = JSON.parse(
      Buffer.from(conflictToken, 'base64').toString()
    );

    // Token must be < 5 minutes old
    if (Date.now() - decoded.ts > 5 * 60 * 1000) {
      res.status(400).json({
        success: false,
        message: 'Token expired. Please try again.',
      });
      return;
    }

    userId = decoded.userId;
  } catch {
    res.status(400).json({ success: false, message: 'Invalid token' });
    return;
  }

  // Deactivate ALL existing sessions for this user
  await Session.updateMany(
    { user: userId, isActive: true },
    {
      isActive:     false,
      loggedOutAt:  new Date(),
      logoutReason: 'replaced',
    }
  );

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  await createSession(user, req, res);
};

// ─── LOGOUT ─────────────────────────────────────────────────────────────────
export const logout = async (
  req: IAuthRequest,
  res: Response
): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    await Session.findOneAndUpdate(
      { token },
      {
        isActive:     false,
        loggedOutAt:  new Date(),
        logoutReason: 'manual',
      }
    );
  }

  res.json({ success: true, message: 'Logged out' });
};

// ─── VERIFY SESSION ──────────────────────────────────────────────────────────
// Called by frontend on every page load / every 5 minutes via useSessionGuard
export const verifySession = async (
  req: IAuthRequest,
  res: Response
): Promise<void> => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ success: false, code: 'NO_TOKEN' });
    return;
  }

  const session = await Session.findOne({ token, isActive: true });

  if (!session) {
    res.status(401).json({
      success: false,
      code:    'SESSION_INVALID',
      message: 'Your session has ended. Please log in again.',
    });
    return;
  }

  if (new Date() > session.expiresAt) {
    await Session.findByIdAndUpdate(session._id, {
      isActive:     false,
      loggedOutAt:  new Date(),
      logoutReason: 'expired',
    });
    res.status(401).json({
      success: false,
      code:    'SESSION_EXPIRED',
      message: 'Your session expired. Please log in again.',
    });
    return;
  }

  res.json({
    success:   true,
    expiresAt: session.expiresAt,
    user:      req.user,
  });
};

// ─── GET ME ──────────────────────────────────────────────────────────────────
export const getMe = async (req: IAuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Not authorized' });

  const user = await User.findById(userId).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });

  res.status(200).json(user);
};

// ─── CHANGE PASSWORD ─────────────────────────────────────────────────────────
export const changePassword = async (req: IAuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Not authorized' });
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    res.status(400).json({ success: false, message: 'Current password is incorrect' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters',
    });
    return;
  }

  user.password = newPassword; // Pre-save hook hashes it
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
};

// ─── UPDATE PROFILE ──────────────────────────────────────────────────────────
export const updateProfile = async (req: IAuthRequest, res: Response) => {
  const { name, phone } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Not authorized' });
    return;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { name, phone },
    { new: true }
  ).select('-password');

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  res.json({ success: true, data: user });
};
