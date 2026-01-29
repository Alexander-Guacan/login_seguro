import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { User } from '@generated/prisma/client';

/**
 * Flujo:
 * 1. Extrae los roles requeridos de la metadata (@Roles decorator)
 * 2. Si no hay roles requeridos, permite acceso
 * 3. Extrae el usuario del request (inyectado por JwtAuthGuard)
 * 4. Verifica si el rol del usuario está en los roles permitidos
 * 5. Si no coincide, lanza ForbiddenException

 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener los roles requeridos de la metadata
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay roles requeridos, permitir acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Extraer el usuario del request
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    // Verificar si el usuario existe (debería existir por JwtAuthGuard)
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Verificar si el rol del usuario está en los roles permitidos
    const hasRole = requiredRoles.includes(user.role as Role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}