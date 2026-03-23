import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  type: 'leave_request' | 'leave_approved' | 'leave_rejected' | 'substitute_request' | 'substitute_accepted' | 'substitute_declined';
  title: string;
  message: string;
  forRole: 'admin' | 'doctor' | 'receptionist' | 'lab' | 'pharmacist' | 'manager';
  forUser?: mongoose.Types.ObjectId;
  fromUser?: mongoose.Types.ObjectId;
  relatedId?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  type: {
    type: String,
    enum: [
      'leave_request',
      'leave_approved',
      'leave_rejected',
      'substitute_request',
      'substitute_accepted',
      'substitute_declined'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  forRole: {
    type: String,
    enum: ['admin', 'doctor', 'receptionist', 'lab', 'pharmacist', 'manager'],
    required: true
  },
  forUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  fromUser: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedId: {
    type: Schema.Types.ObjectId
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // adds createdAt and updatedAt
});

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
