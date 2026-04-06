import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import Session from '../models/Session.model';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
  file?: any;
  files?: any;
}

// ─── protect ─────────────────────────────────────────────────────────────────
// Validates JWT AND checks that the session is still active in the DB.
// This way midnight-job invalidations and "replaced" sessions are enforced
// on every API call without waiting for JWT expiry.
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      code:    'NO_TOKEN',
      message: 'Not authorized to access this route',
    });
    return;
  }

  try {
    // 1. Verify JWT signature + expiry
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as { id: string; role: string };

    // 2. Check that the session is still marked active in DB
    const session = await Session.findOne({ token, isActive: true });

    if (!session) {
      res.status(401).json({
        success: false,
        code:    'SESSION_INVALID',
        message: 'Session ended. Please login again.',
      });
      return;
    }

    // 3. Check DB-level expiry (belt-and-suspenders — JWT also checks this)
    if (new Date() > session.expiresAt) {
      await Session.findByIdAndUpdate(session._id, {
        isActive:     false,
        loggedOutAt:  new Date(),
        logoutReason: 'expired',
      });
      res.status(401).json({
        success: false,
        code:    'SESSION_EXPIRED',
        message: 'Session expired. Please login again.',
      });
      return;
    }

    // 4. Attach user info for downstream handlers
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      code:    'TOKEN_INVALID',
      message: 'Invalid token. Please login again.',
    });
  }
};

// ─── authorize ───────────────────────────────────────────────────────────────
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Role '${req.user?.role}' is not authorized to access this route`,
      });
      return;
    }
    next();
  };
};
