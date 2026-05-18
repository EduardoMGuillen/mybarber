import type { Session } from "next-auth";

export type UserRole = "superadmin" | "owner" | "staff";

export function getRole(session: Session | null): UserRole | null {
  const role = session?.user?.role;
  if (role === "superadmin" || role === "owner" || role === "staff") {
    return role;
  }
  return null;
}

export function isSuperadmin(session: Session | null): boolean {
  return getRole(session) === "superadmin";
}

export function canAccessDashboard(session: Session | null): boolean {
  const role = getRole(session);
  return role === "owner" || role === "staff" || role === "superadmin";
}

export function canAccessAdmin(session: Session | null): boolean {
  return isSuperadmin(session);
}
