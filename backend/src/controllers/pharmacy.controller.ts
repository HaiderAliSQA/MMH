import { Request, Response } from 'express';
import Medicine from '../models/Medicine.model';
import Dispense from '../models/Dispense.model';

export const getMedicines = async (req: Request, res: Response) => {
  const medicines = await Medicine.find({ isActive: true }).sort({ name: 1 });
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
  const { patient, items, notes } = req.body;

  // STEP 1 — Validate ALL stock BEFORE dispensing
  const stockErrors: string[] = [];

  for (const item of items) {
    // using medicine lookup
    const medicineId = item.medicine || item.medicineId;
    const medicine = await Medicine.findById(medicineId);

    if (!medicine) {
      res.status(404).json({
        success: false,
        message: `Medicine not found: ${medicineId}`
      });
      return;
    }

    if (!medicine.isActive) {
      res.status(400).json({
        success: false,
        message: `Medicine is inactive: ${medicine.name}`
      });
      return;
    }

    if (medicine.quantity === 0) {
      stockErrors.push(
        `${medicine.name}: Out of stock (0 remaining)`
      );
    } else if (medicine.quantity < item.quantity) {
      stockErrors.push(
        `${medicine.name}: Only ${medicine.quantity} ` +
        `${medicine.unit}(s) available, ` +
        `you requested ${item.quantity}`
      );
    }
  }

  if (stockErrors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Insufficient stock for some medicines',
      errors: stockErrors
    });
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

    await Medicine.findByIdAndUpdate(
      medicine._id,
      { $inc: { quantity: -item.quantity } }
    );
  }

  // STEP 3 — Save dispense record
  const dispense = await Dispense.create({
    patient,
    items: dispenseItems,
    totalAmount,
    dispensedBy: req.user?.id || req.body.dispensedBy,
    notes,
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

