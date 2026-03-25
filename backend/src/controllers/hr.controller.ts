import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Employee, { generateEmployeeId } from '../models/Employee.model';
import Shift from '../models/Shift.model';
import Attendance from '../models/Attendance.model';
import Patient from '../models/Patient.model';
import LeaveRequest from '../models/LeaveRequest.model';
import { Notification } from '../models/Notification.model';
import Payroll from '../models/Payroll.model';
import User from '../models/User.model';

interface AuthRequest extends Request {
  user?: { id: string; role: string; name?: string };
}

// ─── Helper: get working days in a month (excludes Sundays) ───
const getWorkingDaysInMonth = (month: number, year: number): number => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let working = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 0) working++; // 0 = Sunday
  }
  return working;
};

// ─── Helper: shift hours lookup ───
const shiftHoursMap: Record<string, number> = {
  Morning: 6,
  Evening: 6,
  Night: 12,
  Off: 0,
};

const shiftTimesMap: Record<string, { start: string; end: string }> = {
  Morning: { start: '08:00', end: '14:00' },
  Evening: { start: '14:00', end: '20:00' },
  Night: { start: '20:00', end: '08:00' },
  Off: { start: '', end: '' },
};

const getDeptByRole = (role: string): string => {
  const map: Record<string, string> = {
    receptionist: 'Reception',
    doctor:       'Medical',
    lab:          'Laboratory',
    pharmacist:   'Pharmacy',
    manager:      'Management',
    admin:        'Administration',
  };
  return map[role] || 'General';
};

// ─── Helper: generate payroll data from attendance ───
const generatePayrollData = async (employeeId: string, month: number, year: number) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) return null;

  const workingDays = getWorkingDaysInMonth(month, year);

  const attendance = await Attendance.find({
    employee: employeeId,
    date: {
      $gte: new Date(year, month - 1, 1),
      $lte: new Date(year, month, 0),
    },
  });

  const present = attendance.filter((a) => a.status === 'Present').length;
  const absent = attendance.filter((a) => a.status === 'Absent').length;
  const late = attendance.filter((a) => a.status === 'Late').length;
  const halfDay = attendance.filter((a) => a.status === 'Half-Day').length;
  const onLeave = attendance.filter((a) => a.status === 'On-Leave').length;
  const overtimeHours = attendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

  const perDayRate = employee.basicSalary / 26;
  const perHourRate = perDayRate / 8;

  const overtimePay = Math.round(overtimeHours * perHourRate * 1.5);
  const absentDeduction = Math.round(absent * perDayRate);
  const lateDeduction = late * 200;
  const halfDayDeduction = Math.round(halfDay * perDayRate / 2);
  const eobi = Math.min(Math.round(employee.basicSalary * 0.01), 160);

  const grossSalary =
    employee.basicSalary +
    employee.houseAllowance +
    employee.medicalAllowance +
    employee.transportAllowance +
    overtimePay;

  const totalDeductions = absentDeduction + lateDeduction + halfDayDeduction + eobi;

  const netSalary = grossSalary - totalDeductions;

  return {
    employee: employeeId,
    month,
    year,
    totalWorkingDays: workingDays,
    presentDays: present,
    absentDays: absent,
    lateDays: late,
    halfDays: halfDay,
    leaveDays: onLeave,
    overtimeHours,
    basicSalary: employee.basicSalary,
    houseAllowance: employee.houseAllowance,
    medicalAllowance: employee.medicalAllowance,
    transportAllowance: employee.transportAllowance,
    overtimePay,
    absentDeduction,
    lateDeduction,
    halfDayDeduction,
    eobi,
    incomeTax: 0,
    loanDeduction: 0,
    grossSalary,
    totalDeductions,
    netSalary,
    status: 'Generated',
    generatedBy: null as any,
  };
};

// ═══════════════════════════════════════════════════════════
// EMPLOYEE ENDPOINTS
// ═══════════════════════════════════════════════════════════

export const getEmployees = async (req: Request, res: Response): Promise<void> => {
  const { role, department } = req.query;
  const query: Record<string, unknown> = { isActive: true };
  if (role) query.role = role;
  if (department) query.department = department;

  const employees = await Employee.find(query)
    .populate('user', 'name email role phone')
    .sort({ employeeId: 1 });

  res.status(200).json(employees);
};

export const createEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeId = await generateEmployeeId();
    const employee = await Employee.create({ ...req.body, employeeId });
    const populated = await Employee.findById(employee._id).populate('user', 'name email role phone');
    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'Employee profile already exists for this user' });
      return;
    }
    throw error;
  }
};

export const updateEmployee = async (req: Request, res: Response): Promise<void> => {
  const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('user', 'name email role phone');

  if (!employee) {
    res.status(404).json({ success: false, message: 'Employee not found' });
    return;
  }
  res.status(200).json({ success: true, data: employee });
};

// ═══════════════════════════════════════════════════════════
// SHIFT ENDPOINTS
// ═══════════════════════════════════════════════════════════

export const getShifts = async (req: Request, res: Response): Promise<void> => {
  const { weekStart } = req.query;
  const query: Record<string, unknown> = {};
  if (weekStart) query.weekStart = new Date(weekStart as string);

  const shifts = await Shift.find(query)
    .populate({
      path: 'employee',
      select: 'name employeeId role department',
    })
    .sort({ 'employee.name': 1 });

  res.status(200).json(shifts);
};

export const saveShift = async (req: AuthRequest, res: Response): Promise<void> => {
  const { employee, weekStart, schedule } = req.body;

  // Calculate total hours
  let totalHours = 0;
  const processedSchedule = (schedule || []).map((s: any) => {
    const hours = shiftHoursMap[s.shiftType] || 0;
    totalHours += hours;
    const times = shiftTimesMap[s.shiftType] || { start: '', end: '' };
    return {
      day: s.day,
      shiftType: s.shiftType,
      startTime: s.startTime || times.start,
      endTime: s.endTime || times.end,
    };
  });

  // Upsert: update if exists, create if not
  const shift = await Shift.findOneAndUpdate(
    { employee, weekStart: new Date(weekStart) },
    {
      employee,
      weekStart: new Date(weekStart),
      schedule: processedSchedule,
      totalHours,
      createdBy: req.user?.id,
    },
    { upsert: true, new: true, runValidators: true }
  ).populate({
    path: 'employee',
    select: 'name employeeId role department',
  });

  res.status(200).json({ success: true, data: shift });
};

export const getEmployeeShifts = async (req: Request, res: Response): Promise<void> => {
  const shifts = await Shift.find({ employee: req.params.id })
    .populate({
      path: 'employee',
      select: 'name employeeId role department',
    })
    .sort({ weekStart: -1 })
    .limit(12);

  res.status(200).json(shifts);
};

// ═══════════════════════════════════════════════════════════
// ATTENDANCE ENDPOINTS
// ═══════════════════════════════════════════════════════════

export const getAttendance = async (req: Request, res: Response): Promise<void> => {
  const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  const attendance = await Attendance.find({
    date: { $gte: date, $lt: nextDay },
  })
    .populate({
      path: 'employee',
      select: 'name employeeId role department',
    })
    .sort({ 'employee.name': 1 });

  // Get summary counts
  const summary = await Attendance.aggregate([
    { $match: { date: { $gte: date, $lt: nextDay } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.status(200).json({ records: attendance, summary });
};

export const getAttendanceRange = async (req: Request, res: Response): Promise<void> => {
  const { from, to, employee } = req.query;
  const query: Record<string, unknown> = {};

  if (from && to) {
    query.date = { $gte: new Date(from as string), $lte: new Date(to as string) };
  }
  if (employee) query.employee = employee;

  const attendance = await Attendance.find(query)
    .populate({
      path: 'employee',
      select: 'name employeeId role department',
    })
    .sort({ date: -1 });

  res.status(200).json(attendance);
};

export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  const { employee, date, status, checkIn, checkOut, shiftType, overtimeHours, notes } = req.body;

  const attDate = new Date(date);
  attDate.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOneAndUpdate(
    { employee, date: attDate },
    {
      employee,
      date: attDate,
      status,
      checkIn,
      checkOut,
      shiftType,
      overtimeHours: overtimeHours || 0,
      notes,
      markedBy: req.user?.id,
    },
    { upsert: true, new: true, runValidators: true }
  ).populate({
    path: 'employee',
    select: 'name employeeId role department',
  });

  res.status(200).json({ success: true, data: attendance });
};

export const bulkAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  const { date, records } = req.body;
  const attDate = new Date(date);
  attDate.setHours(0, 0, 0, 0);

  const operations = (records || []).map((r: any) => ({
    updateOne: {
      filter: { employee: r.employee, date: attDate },
      update: {
        $set: {
          employee: r.employee,
          date: attDate,
          status: r.status,
          checkIn: r.checkIn || '',
          checkOut: r.checkOut || '',
          shiftType: r.shiftType || '',
          overtimeHours: r.overtimeHours || 0,
          notes: r.notes || '',
          markedBy: req.user?.id,
        },
      },
      upsert: true,
    },
  }));

  await Attendance.bulkWrite(operations);

  const updated = await Attendance.find({ date: attDate })
    .populate({
      path: 'employee',
      select: 'name employeeId role department',
    })
    .sort({ 'employee.name': 1 });

  res.status(200).json({ success: true, count: records.length, data: updated });
};

export const getAttendanceSummary = async (req: Request, res: Response): Promise<void> => {
  const month = parseInt(req.query.month as string);
  const year = parseInt(req.query.year as string);

  if (!month || !year) {
    res.status(400).json({ success: false, message: 'month and year are required' });
    return;
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const summary = await Attendance.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { employee: '$employee', status: '$status' },
        count: { $sum: 1 },
        totalOT: { $sum: '$overtimeHours' },
      },
    },
    {
      $group: {
        _id: '$_id.employee',
        statuses: {
          $push: { status: '$_id.status', count: '$count' },
        },
        totalOT: { $sum: '$totalOT' },
      },
    },
    {
      $lookup: {
        from: 'employees',
        localField: '_id',
        foreignField: '_id',
        as: 'employee',
      },
    },
    { $unwind: '$employee' },
    {
      $project: {
        _id: 1,
        employeeName: '$employee.name',
        employeeId: '$employee.employeeId',
        role: '$employee.role',
        department: '$employee.department',
        statuses: 1,
        totalOT: 1,
      },
    },
  ]);

  res.status(200).json(summary);
};

// ═══════════════════════════════════════════════════════════
// LEAVE ENDPOINTS
// ═══════════════════════════════════════════════════════════

export const getLeaves = async (req: Request, res: Response): Promise<void> => {
  const { status, leaveType, search, employee } = req.query;
  const query: Record<string, any> = {};

  if (status) query.status = status;
  if (leaveType) query.leaveType = leaveType;

  // Shortcut for exact ID: Prioritize 'employee' ID if provided, as it is lightning fast
  if (employee) {
    query.employee = employee;
  } else if (search && typeof search === 'string') {
    // Only perform the regex search if we don't already have an exact ID
    const matchingEmployees = await Employee.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ],
    })
    .select('_id')
    .lean();
    
    query.employee = { $in: matchingEmployees.map((e) => e._id) };
  }

  const leaves = await LeaveRequest.find(query)
    .populate({
      path: 'employee',
      select: 'name employeeId role department annualLeaveBalance sickLeaveBalance emergencyLeaveBalance',
    })
    .populate({
      path: 'substituteEmployee',
      select: 'name employeeId',
    })
    .sort({ createdAt: -1 })
    .lean(); // Faster responses

  res.status(200).json(leaves);
};

export const applyLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    leaveType, fromDate, toDate,
    totalDays, reason,
    needsSubstitute, substituteEmployee,
  } = req.body;

  let employee = await Employee.findOne({ user: req.user?.id });
  let employeeId = employee?._id;

  // Auto-create employee profile if missing
  if (!employee) {
    const user = await User.findById(req.user?.id);
    employee = await Employee.create({
      user: req.user?.id,
      employeeId: await generateEmployeeId(),
      name: user?.name || 'Unknown',
      role: user?.role || 'staff',
      department: getDeptByRole(user?.role || ''),
      basicSalary: 0,
      joiningDate: new Date(),
      annualLeaveBalance: 24,
      sickLeaveBalance: 10,
      emergencyLeaveBalance: 3,
    });
    employeeId = employee._id;
  }

  // Balance checks
  const days = Number(totalDays);
  if (employee && days > 0) {
    if (leaveType === 'Annual Leave' && days > (employee.annualLeaveBalance || 0)) {
      res.status(400).json({ success: false, message: 'Not enough Annual Leave balance.' });
      return;
    }
    if (leaveType === 'Sick Leave' && days > (employee.sickLeaveBalance || 0)) {
      res.status(400).json({ success: false, message: 'Not enough Sick Leave balance.' });
      return;
    }
    if (leaveType === 'Emergency Leave' && days > (employee.emergencyLeaveBalance || 0)) {
      res.status(400).json({ success: false, message: 'Not enough Emergency Leave balance.' });
      return;
    }
  }

  // Build leave data
  const leaveData: any = {
    employee: employeeId,
    leaveType,
    fromDate: new Date(fromDate),
    toDate: new Date(toDate),
    totalDays: days || 0,
    reason,
    needsSubstitute: needsSubstitute === 'true' || needsSubstitute === true,
    substituteEmployee: substituteEmployee || null,
    substituteStatus: (needsSubstitute === 'true' || needsSubstitute === true) ? 'Pending' : 'Not Required',
    status: 'Pending',
  };

  // If file was uploaded (multer adds to req.file)
  if (req.file) {
    leaveData.document = {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date(),
    };
  }

  const leave = await LeaveRequest.create(leaveData);

  // Create admin notification
  const empName = employee?.name || 'Employee';
  
  await Notification.create({
    type: 'leave_request',
    title: 'New Leave Request',
    message: `${empName} applied for ${leaveType} from ${new Date(fromDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })} to ${new Date(toDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}` + (req.file ? ' (with document)' : ''),
    forRole: 'admin',
    fromUser: req.user?.id,
    relatedId: leave._id,
    isRead: false,
  });

  const populated = await LeaveRequest.findById(leave._id)
    .populate({ path: 'employee', select: 'name employeeId role department' })
    .populate({ path: 'substituteEmployee', select: 'name employeeId' });

  res.status(201).json({ success: true, message: 'Leave request submitted successfully', data: populated });
};

export const getLeaveDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  const { leaveId } = req.params;

  const leave = await LeaveRequest.findById(leaveId).populate('employee');

  if (!leave || !leave.document?.fileName) {
    res.status(404).json({ success: false, message: 'Document not found' });
    return;
  }

  const filePath = path.join(__dirname, '../../uploads/leave-docs', leave.document.fileName);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ success: false, message: 'File not found on server' });
    return;
  }

  // Set headers
  const isDownload = req.query.download === 'true';
  res.setHeader('Content-Disposition', `${isDownload ? 'attachment' : 'inline'}; filename="${leave.document.originalName}"`);
  res.setHeader('Content-Type', leave.document.mimeType);

  res.sendFile(filePath);
};

export const approveLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) {
    res.status(404).json({ success: false, message: 'Leave request not found' });
    return;
  }

  if (leave.status !== 'Pending') {
    res.status(400).json({ success: false, message: 'Leave is not pending' });
    return;
  }

  leave.status = 'Approved';
  leave.approvedBy = new mongoose.Types.ObjectId(req.user?.id);
  leave.approvedAt = new Date();
  await leave.save();

  // Deduct from leave balance
  const employee = await Employee.findById(leave.employee).populate('user');
  if (employee && leave.totalDays) {
    if (leave.leaveType === 'Annual Leave') {
      employee.annualLeaveBalance = Math.max(0, employee.annualLeaveBalance - leave.totalDays);
    } else if (leave.leaveType === 'Sick Leave') {
      employee.sickLeaveBalance = Math.max(0, employee.sickLeaveBalance - leave.totalDays);
    } else if (leave.leaveType === 'Emergency Leave') {
      employee.emergencyLeaveBalance = Math.max(0, employee.emergencyLeaveBalance - leave.totalDays);
    }
    await employee.save();
  }

  if (employee && (employee as any).user) {
    await Notification.create({
      type: 'leave_approved',
      title: 'Leave Approved',
      message: `Your ${leave.leaveType} from ${(leave.fromDate as Date).toISOString().split('T')[0]} to ${(leave.toDate as Date).toISOString().split('T')[0]} has been approved.`,
      forUser: (employee as any).user,
      fromUser: req.user?.id,
      relatedId: leave._id,
      isRead: false
    });
  }

  const populated = await LeaveRequest.findById(leave._id)
    .populate({ path: 'employee', select: 'name employeeId role department' })
    .populate({ path: 'substituteEmployee', select: 'name employeeId' });

  res.status(200).json({ success: true, data: populated });
};

export const rejectLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) {
    res.status(404).json({ success: false, message: 'Leave request not found' });
    return;
  }

  if (leave.status !== 'Pending') {
    res.status(400).json({ success: false, message: 'Leave is not pending' });
    return;
  }

  leave.status = 'Rejected';
  leave.rejectedReason = req.body.reason || '';
  leave.approvedBy = new mongoose.Types.ObjectId(req.user?.id);
  await leave.save();

  const employee = await Employee.findById(leave.employee).populate('user');
  if (employee && (employee as any).user) {
    await Notification.create({
      type: 'leave_rejected',
      title: 'Leave Rejected',
      message: `Your ${leave.leaveType} from ${(leave.fromDate as Date).toISOString().split('T')[0]} to ${(leave.toDate as Date).toISOString().split('T')[0]} was rejected. Reason: ${leave.rejectedReason}`,
      forUser: (employee as any).user,
      fromUser: req.user?.id,
      relatedId: leave._id,
      isRead: false
    });
  }

  const populated = await LeaveRequest.findById(leave._id)
    .populate({ path: 'employee', select: 'name employeeId role department' })
    .populate({ path: 'substituteEmployee', select: 'name employeeId' });

  res.status(200).json({ success: true, data: populated });
};

export const updateLeaveStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, reason } = req.body;
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) {
    res.status(404).json({ success: false, message: 'Leave request not found' });
    return;
  }

  if (leave.leaveType === 'Maternity') {
    leave.leaveType = 'Maternity Leave';
  }

  const oldStatus = leave.status;
  if (oldStatus === status) {
    res.status(200).json({ success: true, message: `Status is already ${status}` });
    return;
  }

  const employee = await Employee.findById(leave.employee).populate('user');

  leave.status = status;
  if (status === 'Rejected') {
    leave.rejectedReason = reason || '';
  }
  if (['Approved', 'Rejected'].includes(status)) {
    leave.approvedBy = new mongoose.Types.ObjectId(req.user?.id);
    leave.approvedAt = new Date();
  }
  await leave.save(); // Save leave first to ensure validation passes before touching employee balance

  // If changing FROM Approved to something else, restore balance
  if (oldStatus === 'Approved' && status !== 'Approved') {
    if (employee && leave.totalDays) {
      if (leave.leaveType === 'Annual Leave') employee.annualLeaveBalance += leave.totalDays;
      else if (leave.leaveType === 'Sick Leave') employee.sickLeaveBalance += leave.totalDays;
      else if (leave.leaveType === 'Emergency Leave') employee.emergencyLeaveBalance += leave.totalDays;
      await employee.save();
    }
  }

  // If changing TO Approved from something else, deduct balance
  if (oldStatus !== 'Approved' && status === 'Approved') {
    if (employee && leave.totalDays) {
      if (leave.leaveType === 'Annual Leave') employee.annualLeaveBalance = Math.max(0, employee.annualLeaveBalance - leave.totalDays);
      else if (leave.leaveType === 'Sick Leave') employee.sickLeaveBalance = Math.max(0, employee.sickLeaveBalance - leave.totalDays);
      else if (leave.leaveType === 'Emergency Leave') employee.emergencyLeaveBalance = Math.max(0, employee.emergencyLeaveBalance - leave.totalDays);
      await employee.save();
    }
  }


  if (employee && (employee as any).user) {
    if (['Approved', 'Rejected'].includes(status)) {
      await Notification.create({
        type: `leave_${status.toLowerCase()}`,
        title: `Leave ${status}`,
        message: `Your ${leave.leaveType} from ${(leave.fromDate as Date).toISOString().split('T')[0]} to ${(leave.toDate as Date).toISOString().split('T')[0]} is now ${status}.${status === 'Rejected' && reason ? ' Reason: ' + reason : ''}`,
        forRole: employee.role || 'admin',
        forUser: (employee as any).user._id || (employee as any).user,
        fromUser: req.user?.id,
        relatedId: leave._id,
        isRead: false
      });
    }
  }

  const populated = await LeaveRequest.findById(leave._id)
    .populate({ path: 'employee', select: 'name employeeId role department' })
    .populate({ path: 'substituteEmployee', select: 'name employeeId' });

  res.status(200).json({ success: true, data: populated });
};

export const cancelLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) {
    res.status(404).json({ success: false, message: 'Leave request not found' });
    return;
  }
  if (leave.status !== 'Pending') {
    res.status(400).json({ success: false, message: 'Cannot cancel a leave that is not pending' });
    return;
  }
  leave.status = 'Cancelled';
  await leave.save();
  res.status(200).json({ success: true, message: 'Leave request cancelled' });
};

export const substituteResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  const { response } = req.body; // 'Accepted' or 'Declined'

  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) {
    res.status(404).json({ success: false, message: 'Leave request not found' });
    return;
  }

  leave.substituteStatus = response;
  await leave.save();

  res.status(200).json({ success: true, data: leave });
};

// ═══════════════════════════════════════════════════════════
// PAYROLL ENDPOINTS
// ═══════════════════════════════════════════════════════════

export const getPayroll = async (req: Request, res: Response): Promise<void> => {
  const month = parseInt(req.query.month as string);
  const year = parseInt(req.query.year as string);

  if (!month || !year) {
    res.status(400).json({ success: false, message: 'month and year are required' });
    return;
  }

  const payrolls = await Payroll.find({ month, year })
    .populate({
      path: 'employee',
      select: 'name employeeId role department designation joiningDate',
    })
    .sort({ 'employee.name': 1 });

  // Aggregate totals
  const totals = await Payroll.aggregate([
    { $match: { month, year } },
    {
      $group: {
        _id: null,
        totalGross: { $sum: '$grossSalary' },
        totalDeductions: { $sum: '$totalDeductions' },
        totalNet: { $sum: '$netSalary' },
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    payrolls,
    totals: totals[0] || { totalGross: 0, totalDeductions: 0, totalNet: 0, count: 0 },
  });
};

export const generateAllPayroll = async (req: AuthRequest, res: Response): Promise<void> => {
  const { month, year } = req.body;

  if (!month || !year) {
    res.status(400).json({ success: false, message: 'month and year are required' });
    return;
  }

  const employees = await Employee.find({ isActive: true });
  let count = 0;

  for (const emp of employees) {
    const data = await generatePayrollData(String(emp._id), month, year);
    if (data) {
      data.generatedBy = req.user?.id as any;
      // Upsert: idempotent
      await Payroll.findOneAndUpdate(
        { employee: emp._id, month, year },
        { $set: data },
        { upsert: true, new: true }
      );
      count++;
    }
  }

  res.status(200).json({
    success: true,
    message: `Payroll generated for ${count} employees`,
    count,
  });
};

export const generateOnePayroll = async (req: AuthRequest, res: Response): Promise<void> => {
  const { month, year } = req.body;
  const employeeId = req.params.id;

  const data = await generatePayrollData(employeeId, month, year);
  if (!data) {
    res.status(404).json({ success: false, message: 'Employee not found' });
    return;
  }

  data.generatedBy = req.user?.id as any;

  const payroll = await Payroll.findOneAndUpdate(
    { employee: employeeId, month, year },
    { $set: data },
    { upsert: true, new: true }
  ).populate({
    path: 'employee',
    select: 'name employeeId role department designation joiningDate',
  });

  res.status(200).json({ success: true, data: payroll });
};

export const markPaid = async (req: AuthRequest, res: Response): Promise<void> => {
  const payroll = await Payroll.findByIdAndUpdate(
    req.params.id,
    { status: 'Paid', paidAt: new Date() },
    { new: true }
  ).populate({
    path: 'employee',
    select: 'name employeeId role department designation joiningDate',
  });

  if (!payroll) {
    res.status(404).json({ success: false, message: 'Payroll record not found' });
    return;
  }

  res.status(200).json({ success: true, data: payroll });
};

export const getPayrollSlip = async (req: Request, res: Response): Promise<void> => {
  const payroll = await Payroll.findById(req.params.id).populate({
    path: 'employee',
    select: 'name employeeId role department designation joiningDate',
  });

  if (!payroll) {
    res.status(404).json({ success: false, message: 'Payroll slip not found' });
    return;
  }

  res.status(200).json(payroll);
};

// ═══════════════════════════════════════════════════════════
// MY LEAVE / MY BALANCE (for logged-in employee's portal)
// ═══════════════════════════════════════════════════════════

export const getMyLeaves = async (req: AuthRequest, res: Response): Promise<void> => {
  const employee = await Employee.findOne({ user: req.user?.id });
  if (!employee) {
    res.json({ success: true, data: [] });
    return;
  }
  const leaves = await LeaveRequest.find({ employee: employee._id })
    .populate('substituteEmployee', 'name employeeId')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: leaves });
};

export const getMyBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  const employee = await Employee.findOne(
    { user: req.user?.id },
    'annualLeaveBalance sickLeaveBalance emergencyLeaveBalance name employeeId department role'
  );
  if (!employee) {
    res.json({
      success: true, data: {
        annualLeaveBalance: 24,
        sickLeaveBalance: 10,
        emergencyLeaveBalance: 3,
      }
    });
    return;
  }
  res.json({ success: true, data: employee });
};
