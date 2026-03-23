import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  employee: mongoose.Types.ObjectId;
  date: Date;
  status: string;
  checkIn: string;
  checkOut: string;
  shiftType: string;
  overtimeHours: number;
  notes: string;
  markedBy: mongoose.Types.ObjectId;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Half-Day', 'On-Leave', 'Holiday', 'Substitute'],
      required: true,
    },
    checkIn: { type: String },
    checkOut: { type: String },
    shiftType: { type: String, enum: ['Morning', 'Evening', 'Night'] },
    overtimeHours: { type: Number, default: 0 },
    notes: { type: String },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
export default Attendance;
