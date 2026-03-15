import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  invoiceNumber: string;
  patient: mongoose.Types.ObjectId;
  amount: number;
  paymentMethod: 'Cash' | 'Card' | 'Insurance' | 'JazzCash' | 'EasyPaisa' | 'Bank Transfer';
  referenceNumber?: string;
  purpose: 'OPD' | 'Admission' | 'Lab' | 'Pharmacy' | 'Other';
  status: 'Paid' | 'Pending' | 'Refunded';
  collectedBy?: mongoose.Types.ObjectId;
  notes?: string;
}

const PaymentSchema = new Schema<IPayment>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    patient: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card', 'Insurance', 'JazzCash', 'EasyPaisa', 'Bank Transfer'],
    },
    referenceNumber: { type: String },
    purpose: {
      type: String,
      enum: ['OPD', 'Admission', 'Lab', 'Pharmacy', 'Other'],
    },
    status: {
      type: String,
      enum: ['Paid', 'Pending', 'Refunded'],
      default: 'Paid',
    },
    collectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IPayment>('Payment', PaymentSchema);
