import { Request, Response } from 'express';
import Admission from '../models/Admission.model';
import Bed from '../models/Bed.model';
import Patient from '../models/Patient.model';

export const getAdmissions = async (req: Request, res: Response) => {
  const admissions = await Admission.find({ status: 'Active' })
    .populate('patient', 'name mrNumber age gender phone')
    .populate('doctor',  'name department')
    .populate('ward',    'name')
    .populate('bed',     'bedNumber');

  res.status(200).json(admissions);
};

export const createAdmission = async (req: Request, res: Response) => {
  const {
    patient, doctor, ward, bed,
    symptoms, history,
    warisName, warisPhone, warisRelation,
    paymentType, policyNumber,
  } = req.body;

  // Only patient and doctor are required
  if (!patient || !doctor) {
    res.status(400).json({
      success: false,
      message: 'Patient and Doctor are required',
    });
    return;
  }

  // Build admission data — only include optional fields if provided
  const admissionData: any = {
    patient,
    doctor,
    status:      'Active',
    paymentType: paymentType || 'Cash',
    // @ts-ignore
    createdBy: req.user?.id,
  };

  if (ward)          admissionData.ward          = ward;
  if (bed)           admissionData.bed           = bed;
  if (symptoms)      admissionData.symptoms      = symptoms;
  if (history)       admissionData.history       = history;
  if (warisName)     admissionData.warisName     = warisName;
  if (warisPhone)    admissionData.warisPhone    = warisPhone;
  if (warisRelation) admissionData.warisRelation = warisRelation;
  if (policyNumber)  admissionData.policyNumber  = policyNumber;

  const admission = await Admission.create(admissionData);

  // Update patient status to Admitted
  await Patient.findByIdAndUpdate(patient, { status: 'Admitted' });

  // Update bed status only if a bed was assigned
  if (bed) {
    await Bed.findByIdAndUpdate(bed, { status: 'Occupied', patient });
  }

  const populated = await Admission.findById(admission._id)
    .populate('patient', 'name mrNumber age gender phone')
    .populate('doctor',  'name department')
    .populate('ward',    'name')
    .populate('bed',     'bedNumber');

  res.status(201).json({
    success: true,
    message: 'Patient admitted successfully',
    data: populated,
  });
};

export const dischargePatient = async (req: Request, res: Response) => {
  const admission = await Admission.findById(req.params.id);

  if (!admission) {
    res.status(404).json({ message: 'Admission not found' });
    return;
  }

  admission.status      = 'Discharged';
  admission.dischargeDate = new Date();
  await admission.save();

  if (admission.bed) {
    await Bed.findByIdAndUpdate(admission.bed, {
      status: 'Available',
      $unset: { patient: 1 },
    });
  }

  await Patient.findByIdAndUpdate(admission.patient, { status: 'Discharged' });

  res.status(200).json(admission);
};
