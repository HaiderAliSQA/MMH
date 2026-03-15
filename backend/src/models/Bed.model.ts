import mongoose, { Document, Schema } from 'mongoose';

export interface IBed extends Document {
  bedNumber: string;
  ward: mongoose.Types.ObjectId;
  status: 'Available' | 'Occupied' | 'Maintenance';
  patient?: mongoose.Types.ObjectId;
}

const BedSchema = new Schema<IBed>(
  {
    bedNumber: { type: String, required: true },
    ward: { type: Schema.Types.ObjectId, ref: 'Ward', required: true },
    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Maintenance'],
      default: 'Available',
    },
    patient: { type: Schema.Types.ObjectId, ref: 'Patient' },
  },
  { timestamps: true }
);

BedSchema.index({ ward: 1, bedNumber: 1 }, { unique: true });

export default mongoose.model<IBed>('Bed', BedSchema);
