import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from './jwt.strategy';

/**
 * Diferencias con JwtStrategy:
 * - Usa JWT_REFRESH_SECRET en vez de JWT_ACCESS_SECRET
 * - Verifica que el refresh token exista en BD y no esté revocado
 * - Inyecta el refreshToken en el request para rotación
 * 
 * Flujo:
 * 1. Extrae el JWT del header Authorization: Bearer <token>
 * 2. Valida la firma usando JWT_REFRESH_SECRET
 * 3. Verifica que el token existe en BD y no está revocado
 * 4. Si es válido, permite la renovación del access token
 */
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true, // Para acceder al token raw
    });
  }

  /**
   * Valida el refresh token.
   * 
   * @param req - Request de Express (para extraer el token)
   * @param payload - Payload decodificado del JWT
   * @returns Objeto con userId y refreshToken para rotación
   * @throws UnauthorizedException si el token no existe, está revocado o expirado
   */
  async validate(req: Request, payload: JwtPayload) {
    // Extraer el refresh token del header
    const refreshToken = req.get('authorization')?.replace('Bearer', '').trim();

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token no proporcionado');
    }


    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (tokenRecord.isRevoked) {
      throw new UnauthorizedException('Refresh token revocado');
    }

    // Verificar que no ha expirado (doble check, JWT ya lo hace)
    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    if (!tokenRecord.user || !tokenRecord.user.isActive) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    return {
      userId: payload.sub,
      refreshToken,
      user: tokenRecord.user,
    };
  }
}