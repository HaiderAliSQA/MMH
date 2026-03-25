import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Payment from '../models/Payment.model';

export const getPayments = async (req: Request, res: Response) => {
  const { from, to, method, patientId, search, source, collector, page = 0, limit = 10 } = req.query;
  const skip = Number(page) * Number(limit);
  const query: any = {};

  if (from && to) {
    const start = new Date(from as string);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to as string);
    end.setHours(23, 59, 59, 999);
    query.createdAt = { $gte: start, $lte: end };
  } else if (!patientId && !search && !source && !collector) {
    // Default to today ONLY if no specific filter is requested
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    query.createdAt = { $gte: start };
  }

  if (method) query.paymentMethod = method;
  if (patientId && mongoose.Types.ObjectId.isValid(patientId as string)) {
    query.patient = new mongoose.Types.ObjectId(patientId as string);
  }
  if (collector && mongoose.Types.ObjectId.isValid(collector as string)) {
    query.collectedBy = new mongoose.Types.ObjectId(collector as string);
  }

  // Source filtering
  if (source === 'reception') {
    query.purpose = { $in: ['OPD', 'Admission', 'Lab', 'Other'] };
  } else if (source === 'pharmacy') {
    query.purpose = 'Pharmacy';
  }
  
  // Basic search by invoice number or patient name (if stored directly) or notes
  if (search) {
    query.$or = [
      { invoiceNumber: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
      // Patient name search is done via populate usually, but if stored in payment:
      { patientName: { $regex: search, $options: 'i' } }
    ];
  }

  const total = await Payment.countDocuments(query);
  const payments = await Payment.find(query)
    .populate('patient', 'name mrNumber')
    .populate('collectedBy', 'name role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  // For total revenue, we still need the sum of all payments matched by query
  // Efficient aggregation for total amount
  const revenueResult = await Payment.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  res.status(200).json({
    payments,
    total,
    totalRevenue,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit)),
  });
};

export const createPayment = async (req: Request, res: Response) => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const count = await Payment.countDocuments({
    createdAt: { $gte: start },
  });

  const paddedCount = String(count + 1).padStart(4, '0');
  const invoiceNumber = `INV-${dateStr}-${paddedCount}`;

  const payment = new Payment({
    ...req.body,
    invoiceNumber,
    // @ts-ignore
    collectedBy: req.user?.id,
  });

  await payment.save();
  await payment.populate('patient');
  res.status(201).json(payment);
};
