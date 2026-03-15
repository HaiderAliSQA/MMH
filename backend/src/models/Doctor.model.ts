import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctor extends Document {
  user?: mongoose.Types.ObjectId;
  name: string;
  department: string;
  specialization?: string;
  qualification?: string;
  phone?: string;
  opdDays: string[];
  opdTiming?: string;
  fee: number;
  isActive: boolean;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    department: { type: String, required: true },
    specialization: { type: String },
    qualification: { type: String },
    phone: { type: String },
    opdDays: [{ type: String }],
    opdTiming: { type: String },
    fee: { type: Number, default: 500 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IDoctor>('Doctor', DoctorSchema);
