import { isDispensaryOpen } from './dispensaryHours';

export interface RoutingResult {
  route: 'pharmacy' | 'dispensary' | 'both';
  canDispenseFree: boolean;
  reason: string;
  warning?: string;
  needsOverride: boolean;
}

export const getMedicineRoute = (
  patientType: string,
  prescriptionRoute?: string,
  userRole?: string
): RoutingResult => {
  // As per new business logic: ALL OPD patients go to Dispensary for FREE medicines.
  // Pharmacy has zero relation to this flow.
  return {
    route: 'dispensary',
    canDispenseFree: true,
    reason: 'All active OPD registered patients receive free medicines from the dispensary.',
    needsOverride: false,
  };
};
