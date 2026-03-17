import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmission extends Document {
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  ward?: mongoose.Types.ObjectId;
  bed?: mongoose.Types.ObjectId;
  admitDate: Date;
  dischargeDate?: Date;
  history?: string;
  symptoms?: string;
  diagnosis?: string;
  warisName?: string;
  warisPhone?: string;
  warisRelation?: string;
  paymentType?: 'Cash' | 'Card' | 'Insurance' | 'JazzCash' | 'EasyPaisa' | 'Bank Transfer';
  policyNumber?: string;
  status: 'Active' | 'Discharged';
  createdBy?: mongoose.Types.ObjectId;
}

const AdmissionSchema = new Schema<IAdmission>(
  {
    patient:       { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor:        { type: Schema.Types.ObjectId, ref: 'Doctor',  required: true },
    ward:          { type: Schema.Types.ObjectId, ref: 'Ward',    required: false },
    bed:           { type: Schema.Types.ObjectId, ref: 'Bed',     required: false },
    admitDate:     { type: Date, default: Date.now },
    dischargeDate: { type: Date },
    history:       { type: String, required: false },
    symptoms:      { type: String, required: false },
    diagnosis:     { type: String },
    warisName:     { type: String, required: false },
    warisPhone:    { type: String, required: false },
    warisRelation: { type: String, required: false },
    paymentType: {
      type: String,
      enum: ['Cash', 'Card', 'Insurance', 'JazzCash', 'EasyPaisa', 'Bank Transfer'],
      default: 'Cash',
    },
    policyNumber: { type: String },
    status: {
      type: String,
      enum: ['Active', 'Discharged'],
      default: 'Active',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IAdmission>('Admission', AdmissionSchema);
