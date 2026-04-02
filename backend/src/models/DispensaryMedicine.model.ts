import mongoose, { Document, Schema } from 'mongoose';

export interface IDispensaryMedicine extends Document {
  name: string;
  generic?: string;
  category: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  source: 'Donated' | 'Government' | 'Trust Funded';
  donorName?: string;
  expiryDate?: Date;
  isActive: boolean;
  addedBy?: mongoose.Types.ObjectId;
}

const DispensaryMedicineSchema = new Schema<IDispensaryMedicine>(
  {
    name:       { type: String, required: true },
    generic:    { type: String },
    category:   {
      type: String,
      enum: [
        'Antibiotic', 'Analgesic', 'Antidiabetic',
        'Antihypertensive', 'Antiparasitic',
        'Vitamin', 'Antacid', 'Antiallergic',
        'Cough & Cold', 'IV Fluid', 'Other',
      ],
      default: 'Other',
    },
    quantity:    { type: Number, default: 0 },
    minQuantity: { type: Number, default: 10 },
    unit: {
      type: String,
      enum: ['Tablets', 'Capsules', 'ml', 'Sachet', 'Vial', 'Bottles', 'Sachets', 'Units'],
      default: 'Tablets',
    },
    source: {
      type: String,
      enum: ['Donated', 'Government', 'Trust Funded'],
      default: 'Trust Funded',
    },
    donorName:  { type: String },
    expiryDate: { type: Date },
    isActive:   { type: Boolean, default: true },
    addedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IDispensaryMedicine>('DispensaryMedicine', DispensaryMedicineSchema);
