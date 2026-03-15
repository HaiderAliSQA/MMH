import mongoose, { Document, Schema } from 'mongoose';

export interface IWard extends Document {
  name: string;
  department: string;
  totalBeds: number;
  isActive: boolean;
}

const WardSchema = new Schema<IWard>(
  {
    name: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    totalBeds: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IWard>('Ward', WardSchema);
