export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function normalizeEmail(email?: string | null): string | null {
  const value = email?.trim().toLowerCase();
  return value || null;
}
