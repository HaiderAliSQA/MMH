import { Request, Response } from 'express';
import LabRequest from '../models/LabRequest.model';

export const getLabRequests = async (req: Request, res: Response) => {
  const { status } = req.query;
  const query: any = {};
  
  if (status) query.status = status;

  const requests = await LabRequest.find(query)
    .populate('patient')
    .populate('doctor')
    .sort({ isUrgent: -1, createdAt: 1 });
    
  res.status(200).json(requests);
};

export const createLabRequest = async (req: Request, res: Response) => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  
  const count = await LabRequest.countDocuments({
    createdAt: { $gte: start },
  });
  
  const paddedCount = String(count + 1).padStart(4, '0');
  const labId = `LAB-${dateStr}-${paddedCount}`;

  const request = new LabRequest({
    ...req.body,
    labId,
    // @ts-ignore
    createdBy: req.user?.id,
  });

  await request.save();
  res.status(201).json(request);
};

export const updateLabStatus = async (req: Request, res: Response) => {
  const { status, results } = req.body;
  const update: any = {};
  
  if (status) update.status = status;
  if (results) {
    update.results = results;
    update.resultEnteredAt = new Date();
  }
  
  if (status === 'Processing') {
    update.sampleCollectedAt = new Date();
  }

  const request = await LabRequest.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!request) return res.status(404).json({ message: 'Lab Request not found' });
  
  res.status(200).json(request);
};
