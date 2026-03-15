import { Router } from 'express';
import { login, getMe, changePassword } from '../controllers/auth.controller';
import { getPatients, createPatient, updatePatient, searchPatients } from '../controllers/patient.controller';
import { getOpdVisits, createOpdVisit, updateOpdStatus } from '../controllers/opd.controller';
import { getAdmissions, createAdmission, dischargePatient } from '../controllers/admission.controller';
import { getLabRequests, createLabRequest, updateLabStatus } from '../controllers/lab.controller';
import { getMedicines, createMedicine, updateMedicine, dispenseMedicine } from '../controllers/pharmacy.controller';
import { getPayments, createPayment } from '../controllers/payment.controller';
import { getStats, getUsers, createUser, updateUser, getDoctors, createDoctor, getWards, getWardBeds } from '../controllers/admin.controller';

const router = Router();

// Auth / User Routes
router.post('/users/login', login);
router.get('/users/me', getMe);
router.post('/auth/change-password', changePassword);

// Admin User endpoints
router.get('/users', getUsers);
router.post('/users/register', createUser);
router.put('/users/:id', updateUser);
router.get('/doctors', getDoctors);
router.post('/doctors', createDoctor);

// Patient Routes
router.get('/patients/search', searchPatients);
router.get('/patients', getPatients);
router.post('/patients', createPatient);
router.put('/patients/:id', updatePatient);

// OPD Routes
router.get('/opd', getOpdVisits);
router.post('/opd', createOpdVisit);
router.put('/opd/:id/status', updateOpdStatus);

// Admission Routes
router.get('/admissions', getAdmissions);
router.post('/admissions', createAdmission);
router.put('/admissions/:id/discharge', dischargePatient);

// Lab Routes
router.get('/labs', getLabRequests);
router.post('/labs', createLabRequest);
router.put('/labs/:id', updateLabStatus); // Will need to combine logic in controller

// Pharmacy Routes
router.get('/medicines', getMedicines);
router.post('/medicines', createMedicine);
router.put('/medicines/:id', updateMedicine);
router.post('/dispense', dispenseMedicine);
// Need delete method

// Payment Routes
router.get('/payments', getPayments);
router.post('/payments', createPayment);

// Data Routes
router.get('/admin/stats', getStats);
router.get('/wards', getWards);
router.get('/wards/:wardId/beds', getWardBeds);

export default router;
