import { Response } from 'express';
import { Request } from 'express';
import DispensaryMedicine from '../models/DispensaryMedicine.model';
import DispensaryDispense from '../models/DispensaryDispense.model';
import Patient from '../models/Patient.model';
import { isDispensaryOpen } from '../utils/dispensaryHours';

// Extend Request to include user
interface IAuthRequest extends Request {
  user?: { id: string; role: string };
}

// ─── GET /api/dispensary/status ─────────────────────────────────────────────
export const getStatus = async (req: IAuthRequest, res: Response): Promise<void> => {
  const status = isDispensaryOpen();
  res.json({ success: true, data: status });
};

// ─── GET /api/dispensary/stats ──────────────────────────────────────────────
export const getStats = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [
      totalDispensedToday,
      lowStockCount,
      outOfStockCount,
      dispensaryStatus,
    ] = await Promise.all([
      DispensaryDispense.countDocuments({
        dispenseTime: { $gte: startOfDay, $lt: endOfDay },
      }),
      DispensaryMedicine.countDocuments({
        isActive: true,
        quantity: { $gt: 0 },
        $expr: { $lte: ['$quantity', '$minQuantity'] },
      }),
      DispensaryMedicine.countDocuments({ isActive: true, quantity: 0 }),
      Promise.resolve(isDispensaryOpen()),
    ]);

    // Unique patients today
    const todayDispenses = await DispensaryDispense.find({
      dispenseTime: { $gte: startOfDay, $lt: endOfDay },
    }).distinct('patient');

    res.json({
      success: true,
      data: {
        totalDispensedToday,
        totalPatientsToday: todayDispenses.length,
        lowStockCount,
        outOfStockCount,
        isOpen: dispensaryStatus.isOpen,
        statusMessage: dispensaryStatus.message,
        opensAt: dispensaryStatus.opensAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dispensary stats' });
  }
};

import { getDispensaryStockStatus, getStockPercent, getDaysToExpiry, getExpiryStatus } from '../utils/stockUtils';

// ─── GET /api/dispensary/medicines ──────────────────────────────────────────
export const getMedicines = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { search, category, stock, source } = req.query;
    const query: any = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { generic: { $regex: String(search), $options: 'i' } },
      ];
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (source && source !== 'All') {
      query.source = source;
    }

    const medicines = await DispensaryMedicine.find(query).sort({ name: 1 });

    const enriched = medicines.map((m) => {
      const obj = m.toObject() as any;
      const status = getDispensaryStockStatus(m.quantity, m.maxQuantity);
      obj.stockStatus = status;
      obj.stockPercent = getStockPercent(m.quantity, m.maxQuantity);
      obj.lowStockThreshold = Math.ceil(m.maxQuantity * 0.20);
      const daysLeft = getDaysToExpiry(m.expiryDate);
      obj.daysToExpiry = daysLeft;
      obj.expiryStatus = getExpiryStatus(daysLeft);
      return obj;
    });

    // Apply stock filter after enrichment
    let filtered = enriched;
    if (stock === 'critical') {
      filtered = enriched.filter((m: any) => m.stockStatus === 'critical');
    } else if (stock === 'low') {
      filtered = enriched.filter(
        (m: any) => m.stockStatus === 'low' || m.stockStatus === 'critical'
      );
    } else if (stock === 'out') {
      filtered = enriched.filter((m: any) => m.stockStatus === 'out');
    }

    const summary = {
      total: enriched.length,
      ok: enriched.filter((m: any) => m.stockStatus === 'ok').length,
      low: enriched.filter((m: any) => m.stockStatus === 'low').length,
      critical: enriched.filter((m: any) => m.stockStatus === 'critical').length,
      out: enriched.filter((m: any) => m.stockStatus === 'out').length,
      expiring: enriched.filter((m: any) => m.expiryStatus === 'critical').length,
      bySource: {
        donated: enriched.filter((m: any) => m.source === 'Donated').length,
        government: enriched.filter((m: any) => m.source === 'Government').length,
        trustFunded: enriched.filter((m: any) => m.source === 'Trust Funded').length,
      },
    };

    res.json({ success: true, data: filtered, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch medicines' });
  }
};

// ─── POST /api/dispensary/medicines ─────────────────────────────────────────
export const addMedicine = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const medicine = await DispensaryMedicine.create({
      ...req.body,
      addedBy: req.user?.id,
    });
    res.status(201).json({ success: true, data: medicine });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to add medicine' });
  }
};

// ─── PUT /api/dispensary/medicines/:id ──────────────────────────────────────
export const updateMedicine = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const medicine = await DispensaryMedicine.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!medicine) {
      res.status(404).json({ success: false, message: 'Medicine not found' });
      return;
    }
    res.json({ success: true, data: medicine });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Failed to update medicine' });
  }
};

// ─── POST /api/dispensary/dispense ──────────────────────────────────────────
export const dispenseMedicine = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    // Check timing first
    const status = isDispensaryOpen();

    if (!status.isOpen) {
      // Only admin can override timing
      if (req.user?.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: status.message,
          opensAt: status.opensAt,
          canOverride: false,
        });
        return;
      }
      // Admin gets warning but can proceed
    }

    const { patient, items, prescription, notes, isEmergencyOverride, overrideReason } = req.body;

    if (!patient || !items || items.length === 0) {
      res.status(400).json({ success: false, message: 'Patient and items are required' });
      return;
    }

    // Validate patient type
    const patientRecord = await Patient.findById(patient);
    if (!patientRecord) {
      res.status(404).json({ success: false, message: 'Patient not found' });
      return;
    }

    /*
    if (patientRecord.patientType === 'Regular') {
      res.status(400).json({
        success: false,
        message: 'Regular patients cannot use dispensary. Please redirect to pharmacy.',
        redirect: 'pharmacy',
      });
      return;
    }
    */

    // Check all stock first
    const stockErrors: string[] = [];
    for (const item of items) {
      const med = await DispensaryMedicine.findById(item.medicine);
      if (!med) {
        stockErrors.push(`Medicine not found`);
        continue;
      }
      if (med.quantity < item.quantity) {
        stockErrors.push(
          `${med.name}: only ${med.quantity} ${med.unit} available`
        );
      }
    }

    if (stockErrors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Insufficient stock',
        errors: stockErrors,
      });
      return;
    }

    // All good — deduct stock atomically
    for (const item of items) {
      await DispensaryMedicine.findByIdAndUpdate(
        item.medicine,
        { $inc: { quantity: -item.quantity } }
      );
    }

    // Create dispense record
    const dispense = await DispensaryDispense.create({
      patient,
      items,
      prescription: prescription || null,
      dispensedBy: req.user?.id,
      notes,
      dispenseTime: new Date(),
      isEmergencyOverride: isEmergencyOverride || false,
      overrideBy: isEmergencyOverride ? req.user?.id : undefined,
    });

    // Populate for response
    const populated = await DispensaryDispense.findById(dispense._id)
      .populate('patient', 'name mrNumber patientType')
      .populate('dispensedBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Medicines dispensed successfully (FREE)',
      data: populated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Dispense failed' });
  }
};

// ─── GET /api/dispensary/history ────────────────────────────────────────────
export const getHistory = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const { from, to, patient: patientSearch, dispensedBy } = req.query;

    const query: any = {};

    if (from || to) {
      query.dispenseTime = {};
      if (from) query.dispenseTime.$gte = new Date(String(from));
      if (to) {
        const toDate = new Date(String(to));
        toDate.setHours(23, 59, 59, 999);
        query.dispenseTime.$lte = toDate;
      }
    }

    let dispenses = await DispensaryDispense.find(query)
      .populate('patient', 'name mrNumber patientType')
      .populate('dispensedBy', 'name')
      .sort({ dispenseTime: -1 })
      .limit(200);

    // Filter by patient name/mr if provided
    if (patientSearch) {
      const searchStr = String(patientSearch).toLowerCase();
      dispenses = dispenses.filter((d: any) => {
        const p = d.patient;
        if (!p) return false;
        return (
          p.name?.toLowerCase().includes(searchStr) ||
          p.mrNumber?.toLowerCase().includes(searchStr)
        );
      });
    }

    // Filter by dispensed by user
    if (dispensedBy) {
      const searchStr = String(dispensedBy).toLowerCase();
      dispenses = dispenses.filter((d: any) => {
        return d.dispensedBy?.name?.toLowerCase().includes(searchStr);
      });
    }

    res.json({ success: true, data: dispenses });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch history' });
  }
};

// ─── POST /api/dispensary/medicines/restock ─────────────────────────────────
export const restockDispensary = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const {
      medicineId,
      quantity,
      source,
      donorName,
      donorContact,
      govtBatchNo,
      notes,
    } = req.body;

    const medicine = await DispensaryMedicine.findById(medicineId);
    if (!medicine) {
      res.status(404).json({ success: false, message: 'Medicine not found' });
      return;
    }

    await DispensaryMedicine.findByIdAndUpdate(medicineId, {
      $inc: { quantity: Number(quantity) },
      source: source || medicine.source,
      ...(donorName && { donorName }),
      ...(donorContact && { donorContact }),
      ...(govtBatchNo && { govtBatchNo }),
      $push: {
        restockHistory: {
          quantity: Number(quantity),
          source: source || medicine.source,
          donorName: donorName || '',
          date: new Date(),
          addedBy: req.user?.id,
          notes: notes || '',
        },
      },
    });

    res.json({
      success: true,
      message: `${quantity} units added to dispensary stock`,
      newQuantity: medicine.quantity + Number(quantity),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to restock' });
  }
};
