import { Router } from 'express';
import { login, getMe, changePassword, updateProfile } from '../controllers/auth.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { getPatients, createPatient, updatePatient, searchPatients } from '../controllers/patient.controller';
import { getAdmissions, createAdmission, dischargePatient } from '../controllers/admission.controller';
import { getTodayOPD, createOpdVisit, updateOPDStatus, getDoctorAllVisits, getPatientOPD } from '../controllers/opd.controller';
import { getDoctorPrescriptions, getPatientPrescriptions, createPrescription, updateRoutingStatus } from '../controllers/prescription.controller';
import { getLabRequests, createLabRequest, updateLabStatus } from '../controllers/lab.controller';
import { getMedicines, createMedicine, updateMedicine, dispenseMedicine, restockMedicine } from '../controllers/pharmacy.controller';
import { getPayments, createPayment } from '../controllers/payment.controller';
import { getStats, getUsers, createUser, updateUser, getDoctors, createDoctor, getWards, getWardBeds } from '../controllers/admin.controller';
import {
  getEmployees, createEmployee, updateEmployee,
  getShifts, saveShift, getEmployeeShifts,
  getAttendance, getAttendanceRange, markAttendance, bulkAttendance, getAttendanceSummary,
  getLeaves, applyLeave, approveLeave, rejectLeave, substituteResponse, cancelLeave, updateLeaveStatus,
  getPayroll, generateAllPayroll, generateOnePayroll, markPaid, getPayrollSlip,
  getMyLeaves, getMyBalance,
} from '../controllers/hr.controller';
import { uploadMiddleware } from '../config/upload';
import { getNotifications, markRead, markAllRead } from '../controllers/notification.controller';
import {
  getStatus as getDispensaryStatus,
  getStats as getDispensaryStats,
  getMedicines as getDispensaryMedicines,
  addMedicine as addDispensaryMedicine,
  updateMedicine as updateDispensaryMedicine,
  dispenseMedicine as dispenseFreeMedicine,
  getHistory as getDispensaryHistory,
  restockDispensary,
} from '../controllers/dispensary.controller';
import {
  dispensarySummary,
  beneficiariesReport,
  fundUtilization,
  pharmacyRevenue as pharmacyRevenueReport,
  boardSummary,
} from '../controllers/reports.controller';

const router = Router();

// Auth / User Routes
router.post('/users/login', login);
router.get('/users/me', protect, getMe);
router.put('/auth/profile', protect, updateProfile);
router.post('/auth/change-password', protect, changePassword);

// Admin User endpoints
router.get('/users', protect, getUsers);
router.post('/users/register', protect, createUser);
router.put('/users/:id', protect, updateUser);
router.get('/doctors', getDoctors);
router.post('/doctors', createDoctor);

// Patient Routes
router.get('/patients/search', searchPatients);
router.get('/patients', getPatients);
router.post('/patients', createPatient);
router.put('/patients/:id', updatePatient);

// OPD Routes
router.get('/opd/doctor/all', protect, authorize('doctor', 'admin'), getDoctorAllVisits);
router.get('/opd/patient/:patientId', protect, getPatientOPD);
router.get('/opd', protect, getTodayOPD);
router.post('/opd', protect, authorize('receptionist', 'admin'), createOpdVisit);
router.put('/opd/:id/status', protect, authorize('receptionist', 'doctor', 'admin'), updateOPDStatus);

// Prescription Routes
router.get('/prescriptions/doctor', protect, authorize('doctor', 'admin'), getDoctorPrescriptions);
router.get('/prescriptions/patient/:patientId', protect, getPatientPrescriptions);
router.post('/prescriptions', protect, authorize('doctor'), createPrescription);
router.put('/prescriptions/:id/routing-status', protect, updateRoutingStatus);

// Admission Routes
router.get('/admissions', getAdmissions);
router.post('/admissions', createAdmission);
router.put('/admissions/:id/discharge', dischargePatient);

// Lab Routes
router.get('/labs', getLabRequests);
router.post('/labs', createLabRequest);
router.put('/labs/:id', updateLabStatus);

// Pharmacy Routes (Secured)
router.get('/medicines', protect, getMedicines);
router.post('/medicines', protect, authorize('pharmacist', 'admin'), createMedicine);
router.put('/medicines/:id', protect, authorize('pharmacist', 'admin'), updateMedicine);
router.put('/medicines/:id/restock', protect, authorize('admin', 'pharmacist'), restockMedicine);
router.post('/dispense', protect, authorize('pharmacist', 'admin'), dispenseMedicine);

// Payment Routes (Secured)
router.get('/payments', protect, getPayments);
router.post('/payments', protect, createPayment);

// Data Routes
router.get('/admin/stats', getStats);
router.get('/wards', getWards);
router.get('/wards/:wardId/beds', getWardBeds);

// ═══ HR MANAGEMENT ROUTES ═══════════════════════════════
// Employees
router.get('/hr/employees', protect, authorize('admin', 'manager', 'doctor', 'pharmacist', 'receptionist', 'lab'), getEmployees);
router.post('/hr/employees', protect, authorize('admin'), createEmployee);
router.put('/hr/employees/:id', protect, authorize('admin'), updateEmployee);

// Shifts
router.get('/hr/shifts', protect, authorize('admin', 'manager'), getShifts);
router.post('/hr/shifts', protect, authorize('admin'), saveShift);
router.get('/hr/shifts/employee/:id', protect, getEmployeeShifts);

// Attendance
router.get('/hr/attendance', protect, authorize('admin', 'manager', 'doctor', 'pharmacist', 'receptionist', 'lab'), getAttendance);
router.get('/hr/attendance/range', protect, authorize('admin', 'manager', 'doctor', 'pharmacist', 'receptionist', 'lab'), getAttendanceRange);
router.post('/hr/attendance/mark', protect, authorize('admin'), markAttendance);
router.post('/hr/attendance/bulk', protect, authorize('admin'), bulkAttendance);
router.get('/hr/attendance/summary', protect, authorize('admin', 'manager', 'doctor', 'pharmacist', 'receptionist', 'lab'), getAttendanceSummary);

// Leaves
router.get('/hr/leaves', protect, authorize('admin', 'manager'), getLeaves);
router.post('/hr/leaves', protect, uploadMiddleware.single('document'), applyLeave);
router.put('/hr/leaves/:id/approve', protect, authorize('admin'), approveLeave);
router.put('/hr/leaves/:id/reject', protect, authorize('admin'), rejectLeave);
router.put('/hr/leaves/:id/cancel', protect, cancelLeave);
router.put('/hr/leaves/:id/status', protect, authorize('admin'), updateLeaveStatus);
router.put('/hr/leaves/:id/substitute-response', protect, substituteResponse);

// Payroll
router.get('/hr/payroll', protect, authorize('admin', 'manager'), getPayroll);
router.post('/hr/payroll/generate', protect, authorize('admin'), generateAllPayroll);
router.post('/hr/payroll/generate/:id', protect, authorize('admin'), generateOnePayroll);
router.put('/hr/payroll/:id/mark-paid', protect, authorize('admin'), markPaid);
router.get('/hr/payroll/slip/:id', protect, getPayrollSlip);

// My Portal endpoints (for any logged-in employee)
router.get('/hr/leaves/my', protect, getMyLeaves);
router.get('/hr/employees/my-balance', protect, getMyBalance);

// Notification endpoints
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read-all', protect, markAllRead);
router.put('/notifications/:id/read', protect, markRead);

// ═══ DISPENSARY ROUTES ═══════════════════════════════════════════════════
router.get('/dispensary/status', protect, getDispensaryStatus);
router.get('/dispensary/stats', protect, authorize('admin', 'manager'), getDispensaryStats);
router.get('/dispensary/medicines', protect, authorize('dispensary', 'admin'), getDispensaryMedicines);
router.post('/dispensary/medicines', protect, authorize('admin'), addDispensaryMedicine);
router.put('/dispensary/medicines/:id', protect, authorize('admin', 'dispensary'), updateDispensaryMedicine);
router.post('/dispensary/medicines/restock', protect, authorize('admin', 'dispensary'), restockDispensary);
router.post('/dispensary/dispense', protect, authorize('dispensary', 'admin'), dispenseFreeMedicine);
router.get('/dispensary/history', protect, authorize('dispensary', 'admin'), getDispensaryHistory);

// ═══ REPORTS ROUTES ═══════════════════════════════════════════════════════
router.get('/reports/dispensary-summary', protect, authorize('admin', 'manager'), dispensarySummary);
router.get('/reports/beneficiaries',      protect, authorize('admin', 'manager'), beneficiariesReport);
router.get('/reports/fund-utilization',   protect, authorize('admin', 'manager'), fundUtilization);
router.get('/reports/pharmacy-revenue',   protect, authorize('admin', 'manager'), pharmacyRevenueReport);
router.get('/reports/board-summary',      protect, authorize('admin', 'manager'), boardSummary);

export default router;
