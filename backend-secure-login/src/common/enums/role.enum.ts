export enum Role {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
}

/**
 * Helper type para validaciones
 */
export type RoleType = keyof typeof Role;