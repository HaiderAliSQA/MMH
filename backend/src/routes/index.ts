import { Router } from 'express';
import { login, getMe, changePassword } from '../controllers/auth.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { getPatients, createPatient, updatePatient, searchPatients } from '../controllers/patient.controller';
import { getAdmissions, createAdmission, dischargePatient } from '../controllers/admission.controller';
import { getTodayOPD, createOpdVisit, updateOPDStatus, getDoctorAllVisits, getPatientOPD } from '../controllers/opd.controller';
import { getDoctorPrescriptions, getPatientPrescriptions, createPrescription } from '../controllers/prescription.controller';
import { getLabRequests, createLabRequest, updateLabStatus } from '../controllers/lab.controller';
import { getMedicines, createMedicine, updateMedicine, dispenseMedicine } from '../controllers/pharmacy.controller';
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
import { getNotifications, markRead, markAllRead } from '../controllers/notification.controller';

const router = Router();

// Auth / User Routes
router.post('/users/login', login);
router.get('/users/me', protect, getMe);
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

// Admission Routes
router.get('/admissions', getAdmissions);
router.post('/admissions', createAdmission);
router.put('/admissions/:id/discharge', dischargePatient);

// Lab Routes
router.get('/labs', getLabRequests);
router.post('/labs', createLabRequest);
router.put('/labs/:id', updateLabStatus);

// Pharmacy Routes
router.get('/medicines', getMedicines);
router.post('/medicines', createMedicine);
router.put('/medicines/:id', updateMedicine);
router.post('/dispense', dispenseMedicine);

// Payment Routes
router.get('/payments', getPayments);
router.post('/payments', createPayment);

// Data Routes
router.get('/admin/stats', getStats);
router.get('/wards', getWards);
router.get('/wards/:wardId/beds', getWardBeds);

// ═══ HR MANAGEMENT ROUTES ═══════════════════════════════
// Employees
router.get('/hr/employees', protect, authorize('admin', 'manager'), getEmployees);
router.post('/hr/employees', protect, authorize('admin'), createEmployee);
router.put('/hr/employees/:id', protect, authorize('admin'), updateEmployee);

// Shifts
router.get('/hr/shifts', protect, authorize('admin', 'manager'), getShifts);
router.post('/hr/shifts', protect, authorize('admin'), saveShift);
router.get('/hr/shifts/employee/:id', protect, getEmployeeShifts);

// Attendance
router.get('/hr/attendance', protect, authorize('admin', 'manager'), getAttendance);
router.get('/hr/attendance/range', protect, authorize('admin', 'manager'), getAttendanceRange);
router.post('/hr/attendance/mark', protect, authorize('admin'), markAttendance);
router.post('/hr/attendance/bulk', protect, authorize('admin'), bulkAttendance);
router.get('/hr/attendance/summary', protect, authorize('admin', 'manager'), getAttendanceSummary);

// Leaves
router.get('/hr/leaves', protect, authorize('admin', 'manager'), getLeaves);
router.post('/hr/leaves', protect, applyLeave);
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

export default router;
