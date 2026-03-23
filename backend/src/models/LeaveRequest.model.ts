import mongoose, { Document, Schema } from 'mongoose';

export interface ILeaveRequest extends Document {
  employee: mongoose.Types.ObjectId;
  leaveType: string;
  fromDate: Date;
  toDate: Date;
  totalDays: number;
  reason: string;
  status: string;
  needsSubstitute: boolean;
  substituteEmployee: mongoose.Types.ObjectId;
  substituteStatus: string;
  approvedBy: mongoose.Types.ObjectId;
  approvedAt: Date;
  rejectedReason: string;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    leaveType: {
      type: String,
      enum: ['Annual', 'Sick', 'Emergency', 'Maternity', 'Unpaid'],
      required: true,
    },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    totalDays: { type: Number },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      default: 'Pending',
    },
    needsSubstitute: { type: Boolean, default: false },
    substituteEmployee: { type: Schema.Types.ObjectId, ref: 'Employee' },
    substituteStatus: {
      type: String,
      enum: ['Not Required', 'Pending', 'Accepted', 'Declined'],
      default: 'Not Required',
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectedReason: { type: String },
  },
  { timestamps: true }
);

// Auto-calculate totalDays before save
LeaveRequestSchema.pre('save', function () {
  if (this.fromDate && this.toDate) {
    const diffTime = Math.abs(this.toDate.getTime() - this.fromDate.getTime());
    this.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
});

const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);
export default LeaveRequest;
