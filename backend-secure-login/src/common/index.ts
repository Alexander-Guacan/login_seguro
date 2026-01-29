/**
 * Barrel file para exports del módulo common
 * 
 * Permite importar todos los elementos comunes desde un solo lugar:
 * import { Role, CurrentUser, Roles, JwtAuthGuard, ... } from './common';
 * 
 * Esto sigue el principio DRY y facilita el mantenimiento
 */

// Enums
export * from './enums/role.enum';

// Decorators
export * from './decorators/current-user.decorator';
export * from './decorators/roles.decorator';
export * from './decorators/public.decorator';

// Guards
export * from './guards/jwt-auth.guard';
export * from './guards/roles.guard';

// Filters
export * from './filters/http-exception.filter';

// Interceptors
export * from './interceptors/logging.interceptor';