import mongoose, { Document, Schema } from 'mongoose';

export interface ILabResult {
  testName?: string;
  value?: string;
  normalRange?: string;
  unit?: string;
  flag: 'Normal' | 'High' | 'Low' | 'Critical';
}

export interface ILabRequest extends Document {
  labId: string;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  tests: string[];
  isUrgent: boolean;
  status: 'Pending' | 'Processing' | 'Done';
  results: ILabResult[];
  sampleCollectedAt?: Date;
  resultEnteredAt?: Date;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
}

const ResultSchema = new Schema<ILabResult>({
  testName: { type: String },
  value: { type: String },
  normalRange: { type: String },
  unit: { type: String },
  flag: {
    type: String,
    enum: ['Normal', 'High', 'Low', 'Critical'],
    default: 'Normal',
  },
});

const LabRequestSchema = new Schema<ILabRequest>(
  {
    labId: { type: String, required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    tests: [{ type: String }],
    isUrgent: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Done'],
      default: 'Pending',
    },
    results: [ResultSchema],
    sampleCollectedAt: { type: Date },
    resultEnteredAt: { type: Date },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<ILabRequest>('LabRequest', LabRequestSchema);
