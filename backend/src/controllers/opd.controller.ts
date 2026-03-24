import { Request, Response } from 'express';
import OpdVisit from '../models/OpdVisit.model';
import Doctor from '../models/Doctor.model';
import Patient from '../models/Patient.model';

interface IAuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const getTodayOPD = async (req: IAuthRequest, res: Response): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const query: any = {
    $or: [
      { visitDate: { $gte: today, $lt: tomorrow } },
      { createdAt: { $gte: today, $lt: tomorrow } }
    ]
  };

  if (req.user?.role === 'doctor') {
    // MUST find Doctor record first using User._id
    const doctorRecord = await Doctor.findOne({ user: req.user.id });
    if (!doctorRecord) {
      // No doctor profile linked — return empty
      res.json({ success: true, data: [], total: 0 });
      return;
    }
    // Use Doctor._id (or User._id as fallback for legacy data) for OPD query
    query.doctor = { $in: [doctorRecord._id, doctorRecord.user] };
  }

  const visits = await OpdVisit.find(query)
    .populate('patient', 'name mrNumber age gender phone cnic bloodGroup')
    .populate('doctor', 'name department')
    .sort({ tokenNumber: 1 });

  res.json({
    success: true,
    data: visits,
    total: visits.length
  });
};

export const getDoctorAllVisits = async (req: IAuthRequest, res: Response): Promise<void> => {
  const doctorRecord = await Doctor.findOne({ user: req.user?.id });
  if (!doctorRecord) {
    res.json({ success: true, data: [] });
    return;
  }

  const { from, to, search, tab } = req.query;
  const query: any = { doctor: { $in: [doctorRecord._id, doctorRecord.user] } };

  if (tab === 'history') {
    query.status = { $in: ['Examined', 'Done'] };
  }

  if (from && to) {
    const startDate = new Date(String(from));
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(String(to));
    endDate.setHours(23, 59, 59, 999);
    
    query.$or = [
      { visitDate: { $gte: startDate, $lte: endDate } },
      { createdAt: { $gte: startDate, $lte: endDate } }
    ];
  }

  let visits = await OpdVisit.find(query)
    .populate('patient', 'name mrNumber age gender phone')
    .populate('doctor', 'name department')
    .sort({ createdAt: -1 });

  // Filter by patient name or MR number
  if (search) {
    const s = String(search).toLowerCase();
    visits = visits.filter((v: any) =>
      v.patient?.name?.toLowerCase().includes(s) ||
      v.patient?.mrNumber?.toLowerCase().includes(s)
    );
  }

  res.json({
    success: true,
    data: visits,
    total: visits.length
  });
};

export const createOpdVisit = async (req: IAuthRequest, res: Response): Promise<void> => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  
  const count = await OpdVisit.countDocuments({
    visitDate: { $gte: start },
  });
  
  const tokenNumber = String(count + 1).padStart(4, '0');

  const visit = new OpdVisit({
    ...req.body,
    tokenNumber,
    createdBy: req.user?.id,
  });

  await visit.save();
  await visit.populate(['patient', 'doctor']);
  
  res.status(201).json(visit);
};

export const updateOPDStatus = async (req: Request, res: Response): Promise<void> => {
  const visit = await OpdVisit.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );

  if (!visit) {
    res.status(404).json({ message: 'Visit not found' });
    return;
  }

  if (req.body.status === 'Done') {
    const patientObj = await Patient.findById(visit.patient);
    if (patientObj && patientObj.status !== 'Admitted') {
      patientObj.status = 'OPD'; // Reset patient status
      await patientObj.save();
    }
  }

  res.status(200).json(visit);
};

export const getPatientOPD = async (req: Request, res: Response): Promise<void> => {
  const visits = await OpdVisit.find({ patient: req.params.patientId })
    .populate('doctor', 'name department')
    .sort({ createdAt: -1 });
    
  res.json({ success: true, data: visits });
};
