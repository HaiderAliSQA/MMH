import { Request, Response } from 'express';
import Patient from '../models/Patient.model';
import OpdVisit from '../models/OpdVisit.model';

export const getPatients = async (req: Request, res: Response) => {
  const { search, status } = req.query;
  const query: any = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { mrNumber: { $regex: search, $options: 'i' } },
      { cnic: { $regex: search, $options: 'i' } },
    ];
  }

  if (status) {
    query.status = status;
  }

  const patients = await Patient.find(query)
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
    
  res.status(200).json(patients);
};

export const createPatient = async (req: Request, res: Response) => {
  // Auto-generate MR number: MMH-{year}-{5digits}
  const year = new Date().getFullYear();
  const count = await Patient.countDocuments({ mrNumber: new RegExp(`^MMH-${year}-`) });
  const paddedCount = String(count + 1).padStart(5, '0');
  const mrNumber = `MMH-${year}-${paddedCount}`;

  const patient = new Patient({
    ...req.body,
    mrNumber,
    // @ts-ignore
    createdBy: req.user?.id,
  });

  await patient.save();

  // If visit-related data is present, create an OpdVisit
  if (req.body.doctorId) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const count = await OpdVisit.countDocuments({ visitDate: { $gte: start } });
    const tokenNumber = String(count + 1).padStart(4, '0');

    const visit = new OpdVisit({
      patient: patient._id,
      doctor: req.body.doctorId,
      tokenNumber, // Use auto-generated or req.body.token
      status: 'Waiting',
      // @ts-ignore
      createdBy: req.user?.id,
    });
    await visit.save();
  }

  res.status(201).json(patient);
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
  if (!q) return res.status(200).json([]);

  const patients = await Patient.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { mrNumber: { $regex: q, $options: 'i' } },
      { cnic: { $regex: q, $options: 'i' } },
    ],
  } as any).limit(10);

  res.status(200).json(patients);
};
