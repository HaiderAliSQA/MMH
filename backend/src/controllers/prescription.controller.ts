import { Request, Response } from 'express';
import Prescription from '../models/Prescription.model';
import Doctor from '../models/Doctor.model';
import OpdVisit from '../models/OpdVisit.model';

interface IAuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const getDoctorPrescriptions = async (req: IAuthRequest, res: Response): Promise<void> => {
  const doctor = await Doctor.findOne({ user: req.user?.id });
  if (!doctor) {
    res.json({ success: true, data: [] });
    return;
  }
  
  const prescriptions = await Prescription.find({ doctor: doctor._id })
    .populate('patient', 'name mrNumber')
    .sort({ createdAt: -1 });
    
  res.json({ success: true, data: prescriptions, total: prescriptions.length });
};

export const getPatientPrescriptions = async (req: Request, res: Response): Promise<void> => {
  const prescriptions = await Prescription.find({ patient: req.params.patientId })
    .populate('doctor', 'name department')
    .sort({ createdAt: -1 });
    
  res.json({ success: true, data: prescriptions });
};

export const createPrescription = async (req: IAuthRequest, res: Response): Promise<void> => {
  const { opdVisit, patient, items, diagnosis, notes } = req.body;
  
  const doctor = await Doctor.findOne({ user: req.user?.id });
  if (!doctor) {
    res.status(403).json({ success: false, message: 'Only registered doctors can create prescriptions.' });
    return;
  }
  
  const rx = new Prescription({
    opdVisit,
    patient,
    doctor: doctor._id,
    diagnosis,
    items,
    notes
  });
  
  await rx.save();
  await OpdVisit.findByIdAndUpdate(opdVisit, { status: 'Examined' });

  res.status(201).json({ success: true, data: rx });
};
