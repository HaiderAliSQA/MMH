/**
 * Formats a phone number string to XXXX-XXXXXXX format.
 * Limits to 11 digits.
 */
export const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 11);
  if (limited.length > 4) return `${limited.slice(0, 4)}-${limited.slice(4)}`;
  return limited;
};

/**
 * Validates a phone number.
 * Rules: Required, must be 11 digits, must start with 0.
 */
export const validatePhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (!phone) return 'Phone number is required';
  if (digits.length !== 11) return 'Phone number must be 11 digits';
  if (!digits.startsWith('0')) return 'Phone must start with 0';
  return '';
};

/**
 * Formats a CNIC string to XXXXX-XXXXXXX-X format.
 * Limits to 13 digits.
 */
export const formatCNIC = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 13);
  if (limited.length > 12) return `${limited.slice(0, 5)}-${limited.slice(5, 12)}-${limited.slice(12)}`;
  if (limited.length > 5) return `${limited.slice(0, 5)}-${limited.slice(5)}`;
  return limited;
};

/**
 * Validates a CNIC number.
 * Rules: Optional (if provided, must be 13 digits).
 */
export const validateCNIC = (cnic: string): string => {
  if (!cnic) return ''; // Optional
  const digits = cnic.replace(/\D/g, '');
  if (digits.length !== 13) return 'CNIC must be 13 digits';
  return '';
};
