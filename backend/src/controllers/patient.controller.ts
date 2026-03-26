import { Request, Response } from 'express';
import Patient from '../models/Patient.model';
import OpdVisit from '../models/OpdVisit.model';

export const getPatients = async (req: Request, res: Response) => {
  const { search, status, doctorId, startDate, endDate } = req.query;
  const query: any = {};

  if (search) {
    query.$or = [
      { name:     { $regex: search, $options: 'i' } },
      { mrNumber: { $regex: search, $options: 'i' } },
      { cnic:     { $regex: search, $options: 'i' } },
      { phone:    { $regex: String(search).replace(/\D/g, ''), $options: 'i' } },
    ];
  }

  if (status && status !== 'All') {
    query.status = status;
  }

  // Doctor Filter
  if (doctorId && doctorId !== 'All') {
    query.doctor = doctorId;
  }

  // Date Range Filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      const start = new Date(startDate as string);
      start.setHours(0, 0, 0, 0);
      query.createdAt.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }

  const patients = await Patient.find(query)
    .populate('createdBy', 'name')
    .populate('doctor', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json(patients);
};

// Auto-generate MR number: MMH-{year}-{5digits}
const generateMRNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await Patient.countDocuments({
    mrNumber: { $regex: `^MMH-${year}-` },
  });
  const serial = String(count + 1).padStart(5, '0');
  return `MMH-${year}-${serial}`;
};

export const createPatient = async (req: Request, res: Response) => {
  const mrNumber = await generateMRNumber();

  const patientData: any = { ...req.body, mrNumber };
  if (req.body.doctorId) patientData.doctor = req.body.doctorId;

  const patient = new Patient(patientData);
  // @ts-ignore
  patient.createdBy = req.user?.id;

  await patient.save();

  // Populate doctor name for the response
  const populatedPatient = await Patient.findById(patient._id).populate('doctor', 'name');

  // If doctorId is provided, create an OpdVisit with a token
  if (req.body.doctorId) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const count = await OpdVisit.countDocuments({ visitDate: { $gte: start } });
    const tokenNumber = String(count + 1).padStart(4, '0');

    const visit = new OpdVisit({
      patient:     patient._id,
      doctor:      req.body.doctorId,
      tokenNumber,
      status:      'Waiting',
      // @ts-ignore
      createdBy:   req.user?.id,
    });
    await visit.save();
  }

  res.status(201).json({
    success: true,
    data: populatedPatient,
    mrNumber: patient.mrNumber,
  });
};

export const updatePatient = async (req: Request, res: Response) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  res.status(200).json(patient);
};

export const searchPatients = async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q || String(q).length < 2) {
    res.json({ success: true, data: [], total: 0 });
    return;
  }

  const searchTerm = String(q);
  const digitsOnly = searchTerm.replace(/\D/g, '');

  const orClauses: any[] = [
    { mrNumber: { $regex: searchTerm, $options: 'i' } },
    { name:     { $regex: searchTerm, $options: 'i' } },
  ];

  if (digitsOnly.length > 0) {
    orClauses.push({ phone: { $regex: digitsOnly, $options: 'i' } });
    orClauses.push({ cnic:  { $regex: digitsOnly, $options: 'i' } });
  }

  const patients = await Patient.find({ $or: orClauses })
    .select('name mrNumber age gender phone cnic status')
    .limit(10)
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: patients,
    total: patients.length,
  });
};
