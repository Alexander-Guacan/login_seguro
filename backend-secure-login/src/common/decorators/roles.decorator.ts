import { SetMetadata } from '@nestjs/common';
import { Role } from  '../enums/role.enum';

/**
 * Clave para almacenar metadata de roles
 */
export const ROLES_KEY = 'roles';

/** 
 * Uso:
 * @Roles(Role.ADMIN)
 * @Get('users')
 * getAllUsers() {
 *   return this.usersService.findAll();
 * }
 * 
 * Para múltiples roles:
 * @Roles(Role.ADMIN, Role.CLIENT)
 * @Get('dashboard')
 * getDashboard() {
 *   return 'Dashboard';
 * }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);