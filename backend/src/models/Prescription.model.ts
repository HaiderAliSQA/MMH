import mongoose, { Document, Schema } from 'mongoose';

export interface IPrescriptionItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  notes?: string;
}

export interface IPrescription extends Document {
  opdVisit: mongoose.Types.ObjectId;
  patient: mongoose.Types.ObjectId;
  doctor: mongoose.Types.ObjectId;
  diagnosis: string;
  items: IPrescriptionItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const prescriptionItemSchema = new Schema<IPrescriptionItem>({
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  quantity: { type: Number, required: true },
  notes: { type: String },
});

const prescriptionSchema = new Schema<IPrescription>(
  {
    opdVisit: { type: Schema.Types.ObjectId, ref: 'OpdVisit', required: true },
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
    diagnosis: { type: String, required: true },
    items: [prescriptionItemSchema],
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IPrescription>('Prescription', prescriptionSchema);
