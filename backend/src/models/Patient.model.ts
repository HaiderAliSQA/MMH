import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  mrNumber: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  cnic?: string;
  phone: string;
  address?: string;
  bloodGroup?: string;
  status: 'OPD' | 'Admitted' | 'Discharged' | 'Waiting';
  createdBy?: mongoose.Types.ObjectId;
}

const PatientSchema = new Schema<IPatient>(
  {
    mrNumber:   { type: String, required: true, unique: true },
    name:       { type: String, required: true },
    age:        { type: Number, required: true },
    gender:     { type: String, enum: ['Male', 'Female', 'Other'] },
    cnic:       { type: String, required: false },       // OPTIONAL — no CNIC needed
    phone:      { type: String, required: true },        // REQUIRED — 11-digit number
    address:    { type: String },
    bloodGroup: { type: String },
    status: {
      type: String,
      enum: ['OPD', 'Admitted', 'Discharged', 'Waiting'],
      default: 'OPD',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IPatient>('Patient', PatientSchema);
