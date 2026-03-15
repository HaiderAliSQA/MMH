import { Request, Response } from 'express';
import OpdVisit from '../models/OpdVisit.model';

export const getOpdVisits = async (req: Request, res: Response) => {
  const { date } = req.query;
  const query: any = {};

  if (date) {
    const start = new Date(date as string);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    
    query.visitDate = { $gte: start, $lt: end };
  } else {
    // Default to today
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    query.visitDate = { $gte: start };
  }

  const visits = await OpdVisit.find(query)
    .populate('patient')
    .populate('doctor');
    
  res.status(200).json(visits);
};

export const createOpdVisit = async (req: Request, res: Response) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  
  const count = await OpdVisit.countDocuments({
    visitDate: { $gte: start },
  });
  
  const tokenNumber = String(count + 1).padStart(4, '0');

  const visit = new OpdVisit({
    ...req.body,
    tokenNumber,
    // @ts-ignore
    createdBy: req.user?.id,
  });

  await visit.save();
  await visit.populate(['patient', 'doctor']);
  
  res.status(201).json(visit);
};

export const updateOpdStatus = async (req: Request, res: Response) => {
  const visit = await OpdVisit.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );

  if (!visit) return res.status(404).json({ message: 'Visit not found' });
  res.status(200).json(visit);
};
