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
  sickLeaveBalance: number;
  emergencyLeaveBalance: number;
  maternityLeaveBalance: number;
  unpaidLeaveBalance: number;
  isActive: boolean;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    employeeId: { type: String, unique: true, index: true },
    name: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ['receptionist', 'doctor', 'lab', 'pharmacist', 'admin', 'manager', 'patient'],
    },
    department: { type: String, required: true },
    designation: { type: String },
    phone: { type: String },
    joiningDate: { type: Date, required: true },
    basicSalary: { type: Number, required: true, default: 0 },
    houseAllowance: { type: Number, default: 0 },
    medicalAllowance: { type: Number, default: 0 },
    transportAllowance: { type: Number, default: 0 },
    annualLeaveBalance: { type: Number, default: 24 },
    sickLeaveBalance: { type: Number, default: 10 },
    emergencyLeaveBalance: { type: Number, default: 3 },
    maternityLeaveBalance: { type: Number, default: 90 },
    unpaidLeaveBalance: { type: Number, default: 30 },
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
