import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Observable } from 'rxjs';

/**
 * 
 * Flujo:
 * 1. Verifica si el endpoint está marcado como @Public()
 * 2. Si es público, permite el acceso
 * 3. Si no es público, valida el JWT
 * 4. Si el JWT es válido, el usuario se inyecta en request.user
 * 5. Si el JWT es inválido, lanza UnauthorizedException
 * 
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determina si la ruta actual requiere autenticación
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Verificar si la ruta está marcada como pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si es pública, permitir acceso sin validar JWT
    if (isPublic) {
      return true;
    }

    // Si no es pública, validar JWT usando la estrategia de Passport
    return super.canActivate(context);
  }

  /**
   * Maneja errores de autenticación
   */
  handleRequest(err: any, user: any, info: any) {
    // Si hay un error o no hay usuario, lanzar excepción
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido o expirado');
    }

    return user;
  }
}