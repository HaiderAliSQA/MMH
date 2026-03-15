import { Request, Response } from 'express';
import Admission from '../models/Admission.model';
import Bed from '../models/Bed.model';
import Patient from '../models/Patient.model';

export const getAdmissions = async (req: Request, res: Response) => {
  const admissions = await Admission.find({ status: 'Active' })
    .populate('patient')
    .populate('doctor')
    .populate('ward')
    .populate('bed');
    
  res.status(200).json(admissions);
};

export const createAdmission = async (req: Request, res: Response) => {
  const admission = new Admission({
    ...req.body,
    // @ts-ignore
    createdBy: req.user?.id,
  });

  await admission.save();

  // Update Bed and Patient status
  await Bed.findByIdAndUpdate(req.body.bed, { status: 'Occupied', patient: req.body.patient });
  await Patient.findByIdAndUpdate(req.body.patient, { status: 'Admitted' });

  await admission.populate(['patient', 'doctor', 'ward', 'bed']);
  res.status(201).json(admission);
};

export const dischargePatient = async (req: Request, res: Response) => {
  const admission = await Admission.findById(req.params.id);
  
  if (!admission) return res.status(404).json({ message: 'Admission not found' });
  
  admission.status = 'Discharged';
  admission.dischargeDate = new Date();
  await admission.save();

  await Bed.findByIdAndUpdate(admission.bed, { status: 'Available', $unset: { patient: 1 } });
  await Patient.findByIdAndUpdate(admission.patient, { status: 'Discharged' });

  res.status(200).json(admission);
};
