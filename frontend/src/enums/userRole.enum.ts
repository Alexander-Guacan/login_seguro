export enum UserRole {
  ADMIN = "ADMIN",
  CLIENT = "CLIENT",
}

const nameByRole: Record<UserRole, string> = {
  ADMIN: "Administrador",
  CLIENT: "Cliente",
};

export function isUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

export function getRoleName(role: UserRole): string {
  return nameByRole[role];
}
