export enum UserRole {
  ADMIN = "ADMIN",
  CLIENT = "CLIENT",
}

export function isUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}
