import { Response } from 'express';
import DispensaryDispense from '../models/DispensaryDispense.model';
import DispensaryMedicine from '../models/DispensaryMedicine.model';
import Payment from '../models/Payment.model';
import Patient from '../models/Patient.model';
import OpdVisit from '../models/OpdVisit.model';
import Admission from '../models/Admission.model';
import LabRequest from '../models/LabRequest.model';

interface IAuthRequest extends Express.Request {
  user?: { id: string; role: string };
  query: any;
}

// ── Date range helper ───────────────────────────────────────────────────────
const getDateRange = (req: IAuthRequest) => {
  const { from, to, period } = req.query;

  if (from && to) {
    return {
      start: new Date(String(from)),
      end: new Date(new Date(String(to)).setHours(23, 59, 59, 999)),
    };
  }

  const now = new Date();
  const end = new Date(new Date(now).setHours(23, 59, 59, 999));

  switch (period) {
    case 'today': {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case 'week': {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);
      return { start: weekStart, end };
    }
    case 'month': {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      return { start: monthStart, end };
    }
    case 'year': {
      const yearStart = new Date(new Date().getFullYear(), 0, 1);
      return { start: yearStart, end };
    }
    default: {
      // Default: current month
      const defStart = new Date();
      defStart.setDate(1);
      defStart.setHours(0, 0, 0, 0);
      return { start: defStart, end };
    }
  }
};

// ── GET /api/reports/dispensary-summary ────────────────────────────────────
export const dispensarySummary = async (req: any, res: Response) => {
  try {
    const { start, end } = getDateRange(req);

    const dispenses = await DispensaryDispense.find({
      dispenseTime: { $gte: start, $lte: end },
    })
      .populate('patient', 'name mrNumber patientType')
      .populate('dispensedBy', 'name');

    const uniquePatients = new Set(
      dispenses.map((d) => String(d.patient?._id))
    ).size;

    // Medicine breakdown
    const medicineMap: Record<string, { name: string; totalQty: number; times: number }> = {};
    dispenses.forEach((d) => {
      d.items?.forEach((item: any) => {
        const key = item.medicineName || 'Unknown';
        if (!medicineMap[key]) {
          medicineMap[key] = { name: key, totalQty: 0, times: 0 };
        }
        medicineMap[key].totalQty += item.quantity || 0;
        medicineMap[key].times += 1;
      });
    });

    const topMedicines = Object.values(medicineMap)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 10);

    const trustCount = dispenses.filter(
      (d) => (d.patient as any)?.patientType === 'Trust'
    ).length;
    const bplCount = dispenses.filter(
      (d) => (d.patient as any)?.patientType === 'BPL'
    ).length;

    // Daily trend
    const dailyMap: Record<string, number> = {};
    dispenses.forEach((d) => {
      const day = new Date(d.dispenseTime).toLocaleDateString('en-CA');
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    });
    const dailyTrend = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      data: {
        totalDispenses: dispenses.length,
        uniquePatients,
        trustPatients: trustCount,
        bplPatients: bplCount,
        topMedicines,
        dailyTrend,
        period: { start, end },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/beneficiaries ─────────────────────────────────────────
export const beneficiariesReport = async (req: any, res: Response) => {
  try {
    const { start, end } = getDateRange(req);

    const dispenses = await DispensaryDispense.find({
      dispenseTime: { $gte: start, $lte: end },
    }).populate('patient', 'name mrNumber patientType age gender');

    const beneficiaryMap: Record<string, any> = {};
    dispenses.forEach((d) => {
      const p = d.patient as any;
      if (!p) return;
      const id = String(p._id);
      if (!beneficiaryMap[id]) {
        beneficiaryMap[id] = {
          _id: p._id,
          name: p.name,
          mrNumber: p.mrNumber,
          patientType: p.patientType,
          age: p.age,
          gender: p.gender,
          visits: 0,
          medicinesReceived: 0,
          lastVisit: null,
        };
      }
      beneficiaryMap[id].visits += 1;
      if (!beneficiaryMap[id].lastVisit || d.dispenseTime > beneficiaryMap[id].lastVisit) {
        beneficiaryMap[id].lastVisit = d.dispenseTime;
      }
      d.items?.forEach((item: any) => {
        beneficiaryMap[id].medicinesReceived += item.quantity || 0;
      });
    });

    const beneficiaries = Object.values(beneficiaryMap).sort(
      (a, b) => b.visits - a.visits
    );

    const trustTotal = beneficiaries.filter((b) => b.patientType === 'Trust').length;
    const bplTotal = beneficiaries.filter((b) => b.patientType === 'BPL').length;
    const repeatPatients = beneficiaries.filter((b) => b.visits > 1).length;

    res.json({
      success: true,
      data: {
        totalUniqueBeneficiaries: beneficiaries.length,
        trustBeneficiaries: trustTotal,
        bplBeneficiaries: bplTotal,
        repeatPatients,
        newPatients: beneficiaries.length - repeatPatients,
        beneficiaries,
        period: { start, end },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/fund-utilization ──────────────────────────────────────
export const fundUtilization = async (req: any, res: Response) => {
  try {
    const { start, end } = getDateRange(req);

    const dispenses = await DispensaryDispense.find({
      dispenseTime: { $gte: start, $lte: end },
    });

    let totalMedicineValue = 0;
    let totalUnitsGiven = 0;

    dispenses.forEach((d) => {
      d.items?.forEach((item: any) => {
        totalUnitsGiven += item.quantity || 0;
        totalMedicineValue += (item.quantity || 0) * 15; // PKR 15/unit average
      });
    });

    const payments = await Payment.find({
      createdAt: { $gte: start, $lte: end },
      status: 'Paid',
    });

    const pharmacyRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const opdRevenue = payments
      .filter((p) => p.purpose === 'OPD')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const labRevenue = payments
      .filter((p) => p.purpose === 'Lab')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const medRevenue = payments
      .filter((p) => p.purpose === 'Pharmacy')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const dispensaryCost = totalMedicineValue;
    const operationalCost = pharmacyRevenue * 0.4;
    const netForTrust = pharmacyRevenue - dispensaryCost - operationalCost;

    res.json({
      success: true,
      data: {
        dispensaryCost,
        totalMedicineUnitsGiven: totalUnitsGiven,
        totalRevenue: pharmacyRevenue,
        opdRevenue,
        labRevenue,
        medRevenue,
        operationalCost: Math.round(operationalCost),
        netForTrust: Math.max(0, Math.round(netForTrust)),
        isSelfSustaining: netForTrust > 0,
        crossSubsidyRatio:
          pharmacyRevenue > 0
            ? ((dispensaryCost / pharmacyRevenue) * 100).toFixed(1)
            : '0',
        period: { start, end },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/pharmacy-revenue ──────────────────────────────────────
export const pharmacyRevenue = async (req: any, res: Response) => {
  try {
    const { start, end } = getDateRange(req);

    const payments = await Payment.find({
      createdAt: { $gte: start, $lte: end },
      status: 'Paid',
    })
      .populate('patient', 'name mrNumber')
      .populate('collectedBy', 'name');

    const byPurpose: Record<string, number> = {};
    payments.forEach((p) => {
      const purpose = p.purpose || 'Other';
      byPurpose[purpose] = (byPurpose[purpose] || 0) + (p.amount || 0);
    });

    const byMethod: Record<string, number> = {};
    payments.forEach((p) => {
      const method = p.paymentMethod || 'Cash';
      byMethod[method] = (byMethod[method] || 0) + (p.amount || 0);
    });

    const dailyRevenue: Record<string, number> = {};
    payments.forEach((p) => {
      const day = new Date((p as any).createdAt).toLocaleDateString('en-CA');
      dailyRevenue[day] = (dailyRevenue[day] || 0) + (p.amount || 0);
    });
    const revenueTrend = Object.entries(dailyRevenue)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalTransactions: payments.length,
        byPurpose,
        byMethod,
        revenueTrend,
        period: { start, end },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/reports/board-summary ─────────────────────────────────────────
export const boardSummary = async (req: any, res: Response) => {
  try {
    const { start, end } = getDateRange(req);

    const [
      totalPatients,
      opdToday,
      admitted,
      dispenses,
      payments,
      labRequests,
      lowStockMeds,
    ] = await Promise.all([
      Patient.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      OpdVisit.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Admission.countDocuments({ status: 'Active' }),
      DispensaryDispense.find({ dispenseTime: { $gte: start, $lte: end } }),
      Payment.find({ createdAt: { $gte: start, $lte: end }, status: 'Paid' }),
      LabRequest.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      DispensaryMedicine.find({
        $expr: { $lte: ['$quantity', '$minQuantity'] },
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const freeBeneficiaries = new Set(
      dispenses.map((d) => String(d.patient))
    ).size;
    const medicinesGiven = dispenses.reduce(
      (sum, d) => sum + (d.items?.length || 0),
      0
    );
    const totalUnitsGiven = dispenses.reduce(
      (sum, d) =>
        sum +
        d.items.reduce((s: number, item: any) => s + (item.quantity || 0), 0),
      0
    );

    res.json({
      success: true,
      data: {
        period: { start, end },
        patients: {
          newRegistrations: totalPatients,
          opdVisits: opdToday,
          currentlyAdmitted: admitted,
          labTestsDone: labRequests,
        },
        dispensary: {
          beneficiariesServed: freeBeneficiaries,
          totalDispenses: dispenses.length,
          medicinesGiven: totalUnitsGiven,
          lowStockAlerts: lowStockMeds.length,
        },
        financials: {
          totalRevenue,
          estimatedDispensaryCost: totalUnitsGiven * 15,
          netSurplus: totalRevenue - totalUnitsGiven * 15,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
