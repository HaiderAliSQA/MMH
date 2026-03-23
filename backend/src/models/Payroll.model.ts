import mongoose, { Document, Schema } from 'mongoose';

export interface IPayroll extends Document {
  employee: mongoose.Types.ObjectId;
  month: number;
  year: number;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  leaveDays: number;
  overtimeHours: number;
  basicSalary: number;
  houseAllowance: number;
  medicalAllowance: number;
  transportAllowance: number;
  overtimePay: number;
  absentDeduction: number;
  lateDeduction: number;
  halfDayDeduction: number;
  eobi: number;
  incomeTax: number;
  loanDeduction: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  paidAt: Date;
  generatedBy: mongoose.Types.ObjectId;
}

const PayrollSchema = new Schema<IPayroll>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    totalWorkingDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    lateDays: { type: Number, default: 0 },
    halfDays: { type: Number, default: 0 },
    leaveDays: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },
    basicSalary: { type: Number, default: 0 },
    houseAllowance: { type: Number, default: 0 },
    medicalAllowance: { type: Number, default: 0 },
    transportAllowance: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },
    absentDeduction: { type: Number, default: 0 },
    lateDeduction: { type: Number, default: 0 },
    halfDayDeduction: { type: Number, default: 0 },
    eobi: { type: Number, default: 0 },
    incomeTax: { type: Number, default: 0 },
    loanDeduction: { type: Number, default: 0 },
    grossSalary: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Draft', 'Generated', 'Paid'],
      default: 'Draft',
    },
    paidAt: { type: Date },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

PayrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

const Payroll = mongoose.model<IPayroll>('Payroll', PayrollSchema);
export default Payroll;
