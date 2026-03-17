import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicine extends Document {
  name: string;
  generic?: string;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  pricePerUnit: number;
  expiryDate?: Date;
  manufacturer?: string;
  isActive: boolean;
  hasStock: (requested: number) => boolean;
}

const MedicineSchema = new Schema<IMedicine>(
  {
    name: { type: String, required: true },
    generic: { type: String },
    category: { type: String, required: true },
    unit: { type: String, default: 'Tablet' },
    quantity: { 
      type: Number, 
      required: true, 
      min: [0, 'Stock cannot go below 0'],
      default: 0 
    },
    minQuantity: { type: Number, default: 20 },
    pricePerUnit: { type: Number, required: true },
    expiryDate: { type: Date },
    manufacturer: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

MedicineSchema.methods.hasStock = function(requested: number): boolean {
  return this.quantity >= requested;
};

export default mongoose.model<IMedicine>('Medicine', MedicineSchema);
