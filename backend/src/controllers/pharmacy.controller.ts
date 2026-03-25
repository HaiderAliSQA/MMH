import { Request, Response } from 'express';
import Medicine from '../models/Medicine.model';
import Dispense from '../models/Dispense.model';
import Payment from '../models/Payment.model';

export const getMedicines = async (req: Request, res: Response) => {
  const { search } = req.query;
  const query: any = { isActive: true };

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const medicines = await Medicine.find(query).sort({ name: 1 }).limit( search ? 15 : 100);
  res.status(200).json(medicines);
};

export const createMedicine = async (req: Request, res: Response) => {
  const medicine = new Medicine(req.body);
  await medicine.save();
  res.status(201).json(medicine);
};

export const updateMedicine = async (req: Request, res: Response) => {
  const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
  res.status(200).json(medicine);
};

export const dispenseMedicine = async (req: any, res: Response): Promise<void> => {
  const { patient, items, notes, paymentMethod = 'Cash' } = req.body;

  // STEP 1 — Validate ALL stock BEFORE dispensing
  const stockErrors: string[] = [];

  for (const item of items) {
    const medicineId = item.medicine || item.medicineId;
    const medicine = await Medicine.findById(medicineId);

    if (!medicine) {
      res.status(404).json({ success: false, message: `Medicine not found: ${medicineId}` });
      return;
    }

    if (!medicine.isActive) {
      res.status(400).json({ success: false, message: `Medicine is inactive: ${medicine.name}` });
      return;
    }

    if (medicine.quantity === 0) {
      stockErrors.push(`${medicine.name}: Out of stock (0 remaining)`);
    } else if (medicine.quantity < item.quantity) {
      stockErrors.push(`${medicine.name}: Only ${medicine.quantity} ${medicine.unit}(s) available, but requested ${item.quantity}`);
    }
  }

  if (stockErrors.length > 0) {
    res.status(400).json({ success: false, message: 'Insufficient stock for some medicines', errors: stockErrors });
    return;
  }

  // STEP 2 — Dispense and reduce stock
  let totalAmount = 0;
  const dispenseItems = [];

  for (const item of items) {
    const medicineId = item.medicine || item.medicineId;
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) continue;

    const totalPrice = medicine.pricePerUnit * item.quantity;
    totalAmount += totalPrice;

    dispenseItems.push({
      medicine: medicine._id,
      medicineName: medicine.name,
      quantity: item.quantity,
      unit: medicine.unit,
      pricePerUnit: medicine.pricePerUnit,
      totalPrice,
    });

    await Medicine.findByIdAndUpdate(medicine._id, { $inc: { quantity: -item.quantity } });
  }

  // STEP 3 — Save dispense record
  const dispense = await Dispense.create({
    patient,
    items: dispenseItems,
    totalAmount,
    dispensedBy: req.user?.id || req.body.dispensedBy,
    notes,
  });

  // STEP 4 — Create formal Payment record for the ledger
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Payment.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } });
  const invoiceNumber = `INV-PH-${dateStr}-${String(count + 1).padStart(4, '0')}`;

  await Payment.create({
    invoiceNumber,
    patient,
    amount: totalAmount,
    paymentMethod: paymentMethod,
    purpose: 'Pharmacy',
    status: 'Paid',
    collectedBy: req.user?.id || req.body.dispensedBy,
    notes: `Pharmacy Dispense — ${dispenseItems.length} item(s)`,
    relatedDispense: dispense._id,
  });

  const populated = await Dispense.findById(dispense._id)
    .populate('patient', 'name mrNumber age gender phone cnic')
    .populate('dispensedBy', 'name role');

  res.status(201).json({
    success: true,
    message: `Dispensed successfully! Total: PKR ${totalAmount}`,
    data: populated,
  });
};

export const deleteMedicine = async (req: Request, res: Response) => {
  const medicine = await Medicine.findByIdAndDelete(req.params.id);
  if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
  res.status(200).json({ message: 'Medicine deleted successfully' });
};

