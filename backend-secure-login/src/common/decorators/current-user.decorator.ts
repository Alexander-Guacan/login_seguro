import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@generated/prisma/client';

/**
 * CurrentUser Decorator
 * 
 * Extrae el usuario autenticado del request.
 * El usuario es inyectado por el JwtStrategy después de validar el token.
 * 
 * Uso:
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 * 
 * Para extraer solo el ID:
 * @Get('profile')
 * getProfile(@CurrentUser('id') userId: string) {
 *   return userId;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;

    // Si se especifica una propiedad, retornar solo esa propiedad
    return data ? user?.[data] : user;
  },
);