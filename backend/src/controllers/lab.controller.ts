import { Request, Response } from 'express';
import LabRequest from '../models/LabRequest.model';

export const getLabRequests = async (req: Request, res: Response) => {
  try {
    const { status, patientId } = req.query;
    const query: any = {};

    if (status && status !== 'all') query.status = status;
    if (patientId) query.patient = patientId;

    const requests = await LabRequest.find(query)
      .populate('patient', 'name mrNumber age gender phone')
      .populate('doctor', 'name department')
      .sort({ isUrgent: -1, createdAt: -1 });

    res.status(200).json(requests);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createLabRequest = async (req: Request, res: Response) => {
  try {
    const { patient, doctor, tests, testDetails, isUrgent, notes } = req.body;

    if (!patient) {
      res.status(400).json({ success: false, message: 'Patient is required' });
      return;
    }

    if (!tests || tests.length === 0) {
      res.status(400).json({ success: false, message: 'Select at least one test' });
      return;
    }

    // Generate lab ID
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const count = await LabRequest.countDocuments({ createdAt: { $gte: start } });
    const paddedCount = String(count + 1).padStart(4, '0');
    const labId = `LAB-${dateStr}-${paddedCount}`;

    const requestData: any = {
      labId,
      patient,
      tests,
      testDetails: testDetails || [],
      isUrgent: isUrgent || false,
      notes,
      status: 'Pending',
      // @ts-ignore
      createdBy: req.user?.id,
    };

    // Doctor is optional
    if (doctor) requestData.doctor = doctor;

    const request = await LabRequest.create(requestData);

    const populated = await LabRequest.findById(request._id)
      .populate('patient', 'name mrNumber age gender phone')
      .populate('doctor', 'name department');

    res.status(201).json({
      success: true,
      message: `Lab request created: ${labId}`,
      data: populated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateLabStatus = async (req: Request, res: Response) => {
  try {
    const { status, results } = req.body;
    const update: any = {};

    if (status) update.status = status;

    if (results) {
      update.results = results;
      update.resultEnteredAt = new Date();
      // Auto-mark done when results are saved
      update.status = 'Done';
    }

    if (status === 'Processing') {
      update.sampleCollectedAt = new Date();
    }

    const request = await LabRequest.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    )
      .populate('patient', 'name mrNumber age gender phone')
      .populate('doctor', 'name department');

    if (!request) {
      res.status(404).json({ success: false, message: 'Lab Request not found' });
      return;
    }

    res.status(200).json({ success: true, data: request });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
