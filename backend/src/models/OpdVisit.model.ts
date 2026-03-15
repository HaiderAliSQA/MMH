import mongoose, { Document, Schema } from 'mongoose';

export interface IOpdVisit extends Document {
  patient: mongoose.Types.ObjectId;
  tokenNumber: string;
  doctor: mongoose.Types.ObjectId;
  department?: string;
  chiefComplaint?: string;
  visitDate: Date;
  status: 'Waiting' | 'In Progress' | 'Done';
  createdBy?: mongoose.Types.ObjectId;
}

const OpdVisitSchema = new Schema<IOpdVisit>(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    tokenNumber: { type: String, required: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    department: { type: String },
    chiefComplaint: { type: String },
    visitDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Waiting', 'In Progress', 'Done'],
      default: 'Waiting',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IOpdVisit>('OpdVisit', OpdVisitSchema);
