import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  user: mongoose.Types.ObjectId;
  token: string;
  deviceInfo: string;
  ipAddress: string;
  loginAt: Date;
  expiresAt: Date;
  isActive: boolean;
  loggedOutAt?: Date;
  logoutReason?: 'manual' | 'expired' | 'midnight' | 'replaced';
}

const SessionSchema = new Schema<ISession>(
  {
    user:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token:      { type: String, required: true, unique: true },
    deviceInfo: { type: String, default: '' },
    ipAddress:  { type: String, default: '' },
    loginAt:    { type: Date, default: Date.now },
    expiresAt:  { type: Date, required: true },
    isActive:   { type: Boolean, default: true },
    loggedOutAt:  { type: Date },
    logoutReason: {
      type: String,
      enum: ['manual', 'expired', 'midnight', 'replaced'],
    },
  },
  { timestamps: true }
);

// Index for fast cleanup via MongoDB TTL
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Index for fast lookup by user + active status
SessionSchema.index({ user: 1, isActive: 1 });

export default mongoose.model<ISession>('Session', SessionSchema);
