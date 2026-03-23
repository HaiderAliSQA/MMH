import mongoose, { Document, Schema } from 'mongoose';

export interface IScheduleDay {
  day: string;
  shiftType: string;
  startTime: string;
  endTime: string;
}

export interface IShift extends Document {
  employee: mongoose.Types.ObjectId;
  weekStart: Date;
  schedule: IScheduleDay[];
  totalHours: number;
  createdBy: mongoose.Types.ObjectId;
}

const ScheduleDaySchema = new Schema<IScheduleDay>(
  {
    day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], required: true },
    shiftType: { type: String, enum: ['Morning', 'Evening', 'Night', 'Off'], required: true },
    startTime: { type: String },
    endTime: { type: String },
  },
  { _id: false }
);

const ShiftSchema = new Schema<IShift>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    weekStart: { type: Date, required: true },
    schedule: [ScheduleDaySchema],
    totalHours: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ShiftSchema.index({ employee: 1, weekStart: 1 }, { unique: true });

const Shift = mongoose.model<IShift>('Shift', ShiftSchema);
export default Shift;
