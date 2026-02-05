import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { User, Role } from '@generated/prisma/client';

/**
 * Payload del JWT
 */
export interface JwtPayload {
  sub: string;      // User ID
  email: string;
  role: Role;       // Tipo enum Role
  iat?: number;     // Issued at
  exp?: number;     // Expiration
}

/**
 * Flujo:
 * 1. Extrae el JWT del header Authorization: Bearer <token>
 * 2. Valida la firma usando JWT_ACCESS_SECRET
 * 3. Llama al método validate() con el payload decodificado
 * 4. validate() busca el usuario en BD y verifica que esté activo
 * 5. Si todo es válido, inyecta el usuario completo en request.user
 * 
 * Esta estrategia es usada por JwtAuthGuard automáticamente.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    });
  }

  /**
   * Valida el payload del JWT y retorna el usuario completo.
   * Este método es llamado automáticamente por Passport después de verificar la firma.
   * 
   * @param payload - Payload decodificado del JWT
   * @returns Usuario completo de la BD
   * @throws UnauthorizedException si el usuario no existe o está inactivo
   */
  async validate(payload: JwtPayload): Promise<User> {
    const { sub: userId } = payload;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    return user;
  }
}