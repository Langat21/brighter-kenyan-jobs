/**
 * Normalize a Kenyan phone number to the 254XXXXXXXXX format required by M-Pesa.
 */
export const normalizePhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "254" + cleaned.substring(1);
  } else if (cleaned.length === 9 && (cleaned.startsWith("7") || cleaned.startsWith("1"))) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
};

/**
 * Validate if a phone number is a valid Kenyan Safaricom number.
 */
export const isValidKenyanPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, "");
  return [
    /^0[17]\d{8}$/,
    /^254[17]\d{8}$/,
    /^[17]\d{8}$/,
  ].some((p) => p.test(cleaned));
};

/**
 * Format phone number for display: +254 712 345 678
 */
export const formatPhoneForDisplay = (phone: string): string => {
  const n = normalizePhoneNumber(phone);
  if (n.length === 12) {
    return `+${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 9)} ${n.slice(9)}`;
  }
  return phone;
};
