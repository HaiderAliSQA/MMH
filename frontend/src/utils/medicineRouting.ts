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
  const dispensaryStatus = isDispensaryOpen();
  const isEligible = patientType === 'Trust' || patientType === 'BPL';

  // Regular patient → always pharmacy
  if (!isEligible) {
    return {
      route: 'pharmacy',
      canDispenseFree: false,
      reason: 'Regular patient — paid pharmacy only',
      needsOverride: false,
    };
  }

  // Has prescription with free flag
  if (prescriptionRoute === 'dispensary') {
    if (dispensaryStatus.isOpen) {
      return {
        route: 'dispensary',
        canDispenseFree: true,
        reason: 'Doctor prescribed free dispensary',
        needsOverride: false,
      };
    } else {
      // Dispensary closed — need override
      if (userRole === 'admin') {
        return {
          route: 'dispensary',
          canDispenseFree: true,
          reason: 'Doctor prescribed free — admin override',
          warning: `Dispensary closed. ${dispensaryStatus.opensAt}. Admin override active.`,
          needsOverride: true,
        };
      }
      return {
        route: 'pharmacy',
        canDispenseFree: false,
        reason: 'Dispensary closed — redirected to pharmacy',
        warning: `Dispensary closed. ${dispensaryStatus.opensAt}. Contact admin for emergency free medicines.`,
        needsOverride: true,
      };
    }
  }

  // Eligible patient, no specific route
  // Give choice
  return {
    route: 'both', // show both options
    canDispenseFree: dispensaryStatus.isOpen,
    reason: isEligible
      ? 'Trust/BPL patient — choose dispensing route'
      : 'Regular patient',
    warning: !dispensaryStatus.isOpen
      ? `Dispensary closed. Free option unavailable. ${dispensaryStatus.opensAt}`
      : undefined,
    needsOverride: false,
  };
};
