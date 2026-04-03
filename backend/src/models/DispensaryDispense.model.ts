import mongoose, { Document, Schema } from 'mongoose';

export interface IDispensaryDispenseItem {
  medicine: mongoose.Types.ObjectId;
  medicineName: string;
  quantity: number;
  unit: string;
}

export interface IDispensaryDispense extends Document {
  patient: mongoose.Types.ObjectId;
  items: IDispensaryDispenseItem[];
  prescription?: mongoose.Types.ObjectId;
  dispensedBy: mongoose.Types.ObjectId;
  notes?: string;
  dispenseTime: Date;
  isEmergencyOverride?: boolean;
  overrideBy?: mongoose.Types.ObjectId;
}

const DispensaryDispenseSchema = new Schema<IDispensaryDispense>(
  {
    patient:      { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    items: [
      {
        medicine:     { type: Schema.Types.ObjectId, ref: 'DispensaryMedicine' },
        medicineName: { type: String },
        quantity:     { type: Number },
        unit:         { type: String },
      },
    ],
    prescription: { type: Schema.Types.ObjectId, ref: 'Prescription' },
    dispensedBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes:        { type: String },
    dispenseTime: { type: Date, default: Date.now },
    isEmergencyOverride: { type: Boolean, default: false },
    overrideBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IDispensaryDispense>('DispensaryDispense', DispensaryDispenseSchema);
