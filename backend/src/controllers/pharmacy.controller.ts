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

export const dispenseMedicine = async (req: Request, res: Response) => {
  const { patient, items, totalAmount, notes } = req.body;

  // Validate stock for each item
  for (const item of items) {
    const med = await Medicine.findById(item.medicine);
    if (!med) {
      return res.status(400).json({ message: `Medicine ${item.medicineName} not found` });
    }
    if (med.quantity < item.quantity) {
      return res.status(400).json({ message: `Insufficient stock for ${med.name}. Available: ${med.quantity}` });
    }
  }

  // Create Dispense record
  const dispense = new Dispense({
    patient,
    items,
    totalAmount,
    notes,
    // @ts-ignore
    dispensedBy: req.user?.id,
  });

  await dispense.save();

  // Reduce stock
  const updatePromises = items.map((item: any) => 
    Medicine.findByIdAndUpdate(item.medicine, { $inc: { quantity: -item.quantity } })
  );

  await Promise.all(updatePromises);

  res.status(201).json(dispense);
};

export const deleteMedicine = async (req: Request, res: Response) => {
  const medicine = await Medicine.findByIdAndDelete(req.params.id);
  if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
  res.status(200).json({ message: 'Medicine deleted successfully' });
};

