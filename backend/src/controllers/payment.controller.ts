import { Request, Response } from 'express';
import Payment from '../models/Payment.model';

export const getPayments = async (req: Request, res: Response) => {
  const { from, to } = req.query;
  const query: any = {};

  if (from && to) {
    const start = new Date(from as string);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to as string);
    end.setHours(23, 59, 59, 999);
    query.createdAt = { $gte: start, $lte: end };
  } else {
    // Default: today only
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    query.createdAt = { $gte: start };
  }

  const payments = await Payment.find(query).populate('patient').sort({ createdAt: -1 });

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  res.status(200).json({
    payments,
    totalRevenue,
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
