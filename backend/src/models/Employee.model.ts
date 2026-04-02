import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  user: mongoose.Types.ObjectId;
  employeeId: string;
  name: string;
  role: string;
  department: string;
  designation: string;
  phone: string;
  joiningDate: Date;
  basicSalary: number;
  houseAllowance: number;
  medicalAllowance: number;
  transportAllowance: number;
  annualLeaveBalance: number;
  annualLeaveTotal: number;
  sickLeaveBalance: number;
  sickLeaveTotal: number;
  emergencyLeaveBalance: number;
  emergencyLeaveTotal: number;
  maternityLeaveBalance: number;
  maternityLeaveTotal: number;
  unpaidLeaveBalance: number;
  unpaidLeaveTotal: number;
  isActive: boolean;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeId: { type: String, unique: true, index: true },
    name: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ['receptionist', 'doctor', 'lab', 'pharmacist', 'admin', 'manager', 'patient', 'dispensary'],
    },
    department: { type: String, required: true },
    designation: { type: String },
    phone: { type: String },
    joiningDate: { type: Date, required: true },
    basicSalary: { type: Number, required: true, default: 0 },
    houseAllowance: { type: Number, default: 0 },
    medicalAllowance: { type: Number, default: 0 },
    transportAllowance: { type: Number, default: 0 },
    annualLeaveBalance: { type: Number, default: 10 },
    annualLeaveTotal: { type: Number, default: 10 },
    sickLeaveBalance: { type: Number, default: 6 },
    sickLeaveTotal: { type: Number, default: 6 },
    emergencyLeaveBalance: { type: Number, default: 3 },
    emergencyLeaveTotal: { type: Number, default: 3 },
    maternityLeaveBalance: { type: Number, default: 30 },
    maternityLeaveTotal: { type: Number, default: 30 },
    unpaidLeaveBalance: { type: Number, default: 15 },
    unpaidLeaveTotal: { type: Number, default: 15 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const generateEmployeeId = async (): Promise<string> => {
  const count = await Employee.countDocuments();
  return `MMH-EMP-${String(count + 1).padStart(3, '0')}`;
};

const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);
export default Employee;
