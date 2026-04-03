export const getPharmacyStockStatus = (
  quantity: number,
  minQuantity: number
): 'out' | 'low' | 'ok' => {
  if (quantity === 0) return 'out';
  if (quantity <= minQuantity) return 'low';
  return 'ok';
}

export const getDispensaryStockStatus = (
  quantity: number,
  maxQuantity: number
): 'out' | 'critical' | 'low' | 'ok' => {
  if (quantity === 0) return 'out';
  if (maxQuantity === 0) return 'out';
  const pct = quantity / maxQuantity;
  if (pct <= 0.20) return 'critical';
  if (pct <= 0.40) return 'low';
  return 'ok';
}

export const getStockPercent = (
  quantity: number,
  maxQuantity: number
): number => {
  if (maxQuantity === 0) return 0;
  return Math.min(100, Math.round((quantity / maxQuantity) * 100));
}

export const getDaysToExpiry = (
  expiryDate?: Date
): number | null => {
  if (!expiryDate) return null;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const getExpiryStatus = (
  daysLeft: number | null
): 'expired' | 'critical' | 'warning' | 'ok' => {
  if (daysLeft === null) return 'ok';
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 30) return 'critical';
  if (daysLeft <= 90) return 'warning';
  return 'ok';
}
