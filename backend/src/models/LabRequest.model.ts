import mongoose, { Document, Schema } from 'mongoose';

export interface ILabResult {
  testName?: string;
  value?: string;
  normalRange?: string;
  unit?: string;
  flag: 'Normal' | 'High' | 'Low' | 'Critical';
}

export interface ITestDetail {
  name: string;
  price: number;
}

export interface ILabRequest extends Document {
  labId: string;
  patient: mongoose.Types.ObjectId;
  doctor?: mongoose.Types.ObjectId;
  tests: string[];
  testDetails: ITestDetail[];
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

const TestDetailSchema = new Schema<ITestDetail>({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
});

const LabRequestSchema = new Schema<ILabRequest>(
  {
    labId: { type: String, required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    tests: [{ type: String }],
    testDetails: [TestDetailSchema],
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
