import { Request, Response } from 'express';
import Payment from '../models/Payment.model';

export const getPayments = async (req: Request, res: Response) => {
  const { from, to, method, patientId, search, page = 0, limit = 10 } = req.query;
  const skip = Number(page) * Number(limit);
  const query: any = {};

  if (from && to) {
    const start = new Date(from as string);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to as string);
    end.setHours(23, 59, 59, 999);
    query.createdAt = { $gte: start, $lte: end };
  } else if (!patientId && !search) {
    // Default to today ONLY if no specific patient or search is requested
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    query.createdAt = { $gte: start };
  }

  if (method) query.paymentMethod = method;
  if (patientId) query.patient = patientId;
  
  // Basic search by invoice number or notes if needed
  if (search) {
    query.$or = [
      { invoiceNumber: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
      { patientName: { $regex: search, $options: 'i' } }
    ];
  }

  const total = await Payment.countDocuments(query);
  const payments = await Payment.find(query)
    .populate('patient', 'name mrNumber')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  // For total revenue, we still need the sum of all payments matched by query
  const allPaymentsForRevenue = await Payment.find(query, 'amount');
  const totalRevenue = allPaymentsForRevenue.reduce((sum, p) => sum + p.amount, 0);

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
