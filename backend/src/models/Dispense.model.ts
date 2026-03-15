import mongoose, { Document, Schema } from 'mongoose';

export interface IDispenseItem {
  medicine: mongoose.Types.ObjectId;
  medicineName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface IDispense extends Document {
  patient: mongoose.Types.ObjectId;
  items: IDispenseItem[];
  totalAmount: number;
  dispensedBy?: mongoose.Types.ObjectId;
  notes?: string;
}

const DispenseItemSchema = new Schema<IDispenseItem>({
  medicine: { type: Schema.Types.ObjectId, ref: 'Medicine', required: true },
  medicineName: { type: String, required: true },
  quantity: { type: Number, required: true },
  pricePerUnit: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
});

const DispenseSchema = new Schema<IDispense>(
  {
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    items: [DispenseItemSchema],
    totalAmount: { type: Number, required: true },
    dispensedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IDispense>('Dispense', DispenseSchema);
