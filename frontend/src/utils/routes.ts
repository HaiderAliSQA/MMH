/**
 * Get the default entry path for each role in the MMH system.
 * Used for redirects after login, root navigation, and 404 recovery.
 */
export const getDefaultPath = (role: string): string => {
  const map: Record<string, string> = {
    admin:        '/admin/dashboard',
    doctor:       '/doctor/patients',
    receptionist: '/receptionist/opd',
    lab:          '/lab/queue',
    pharmacist:   '/pharmacy/dispense',
    dispensary:   '/dispensary/dispense',
    manager:      '/manager/analytics',
    patient:      '/patient/records',
  };
  return map[role] || '/login';
};
