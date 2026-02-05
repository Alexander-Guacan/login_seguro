import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { User } from '@generated/prisma/client';
import { JwtSignOptions } from '@nestjs/jwt';
import { Role } from '../common/enums/role.enum';

/**
 * Responsabilidades:
 * - Registro de usuarios con hash de contraseñas
 * - Login con validación de credenciales
 * - Generación de access y refresh tokens
 * - Renovación de tokens (refresh)
 * - Logout con revocación de tokens
 * - Logging de eventos de seguridad
 * 
 * Seguridad implementada:
 * - Bcrypt con 12 salt rounds
 * - JWT con secrets separados para access/refresh
 * - Refresh token rotation
 * - Almacenamiento seguro de tokens en BD
 * - Logging de todos los eventos de seguridad
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 12;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Registra un nuevo usuario en el sistema.
   * 
   * @param registerDto - Datos del usuario a registrar
   * @param ipAddress - IP del cliente (para auditoría)
   * @param userAgent - User agent (para auditoría)
   * @returns Usuario creado con tokens
   */
  async register(
    registerDto: RegisterDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, role } = registerDto;

    // Verificar que el email no exista
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {

      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: role || Role.CLIENT,
          preferences: {
            theme: 'light',
            language: 'es',
            notifications: true,
          },
        },
      });

      // Registrar evento de seguridad
      await tx.securityLog.create({
        data: {
          userId: newUser.id,
          action: 'USER_REGISTERED',
          ipAddress,
          userAgent,
          metadata: {
            email: newUser.email,
            role: newUser.role,
          },
        },
      });

      return newUser;
    });

    this.logger.log(`Usuario registrado: ${user.email}`);


    const tokens = await this.generateTokens(user, ipAddress, userAgent);

    return new AuthResponseDto({
      user: this.sanitizeUser(user),
      ...tokens,
    });
  }

  /**
   * Autentica un usuario con email y contraseña.
   * 
   * @param loginDto - Credenciales de login
   * @param ipAddress - IP del cliente
   * @param userAgent - User agent
   * @returns Usuario autenticado con tokens
   */
  async login(
    loginDto: LoginDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await this.logFailedLogin(email, ipAddress, userAgent, 'USER_NOT_FOUND');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      await this.logFailedLogin(email, ipAddress, userAgent, 'USER_INACTIVE');
      throw new UnauthorizedException('Usuario inactivo');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await this.logFailedLogin(user.id, ipAddress, userAgent, 'INVALID_PASSWORD');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.prisma.securityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        ipAddress,
        userAgent,
        metadata: {
          email: user.email,
        },
      },
    });

    this.logger.log(`Login exitoso: ${user.email}`);


    const tokens = await this.generateTokens(user, ipAddress, userAgent);

    return new AuthResponseDto({
      user: this.sanitizeUser(user),
      ...tokens,
    });
  }

  /**
   * Renueva los tokens usando un refresh token válido.
   * Implementa token rotation: revoca el viejo y genera uno nuevo.
   * 
   * @param refreshToken - Token de refresco
   * @param ipAddress - IP del cliente
   * @param userAgent - User agent
   * @returns Nuevos tokens
   */
  async refreshTokens(
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
  ) {

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked) {
      throw new UnauthorizedException('Refresh token inválido o revocado');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    const user = tokenRecord.user;

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Revocar el token antiguo y generar nuevos (rotation)
    await this.prisma.$transaction(async (tx) => {
      // Revocar el token usado
      await tx.refreshToken.update({
        where: { id: tokenRecord.id },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
        },
      });

      // Log de seguridad
      await tx.securityLog.create({
        data: {
          userId: user.id,
          action: 'TOKEN_REFRESHED',
          ipAddress,
          userAgent,
        },
      });
    });

    this.logger.log(`Tokens renovados para: ${user.email}`);

    return this.generateTokens(user, ipAddress, userAgent);
  }

  /**
   * Cierra sesión revocando el refresh token.
   * 
   * @param userId - ID del usuario
   * @param refreshToken - Token a revocar
   * @param ipAddress - IP del cliente
   * @param userAgent - User agent
   */
  async logout(
    userId: string,
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<{ message: string }> {
    // Buscar y revocar el token
    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        token: refreshToken,
        isRevoked: false,
      },
    });

    if (tokenRecord) {
      await this.prisma.$transaction(async (tx) => {
        // Revocar token
        await tx.refreshToken.update({
          where: { id: tokenRecord.id },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
          },
        });

        // Log de seguridad
        await tx.securityLog.create({
          data: {
            userId,
            action: 'LOGOUT',
            ipAddress,
            userAgent,
          },
        });
      });
    }

    this.logger.log(`Logout exitoso: ${userId}`);

    return { message: 'Logout exitoso' };
  }

  /**
   * Genera access token y refresh token para un usuario.
   * 
   * @param user - Usuario para quien generar tokens
   * @param ipAddress - IP del cliente
   * @param userAgent - User agent
   * @returns Access y refresh tokens
   */
  private async generateTokens(
    user: User,
    ipAddress: string,
    userAgent: string,
  ) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Generar access token (corta duración)
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as JwtSignOptions['expiresIn'],
    });

    // Generar refresh token (larga duración)
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: (process.env.JWT_REFRESH_EXPIRATION || '7d') as JwtSignOptions['expiresIn'],
    });

    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    // Guardar refresh token en BD
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Registra un intento fallido de login.
   */
  private async logFailedLogin(
    identifier: string,
    ipAddress: string,
    userAgent: string,
    reason: string,
  ) {
    await this.prisma.securityLog.create({
      data: {
        userId: null,
        action: 'LOGIN_FAILED',
        ipAddress,
        userAgent,
        metadata: {
          identifier,
          reason,
        },
      },
    });

    this.logger.warn(`Login fallido: ${identifier} - ${reason}`);
  }

  /**
   * Sanitiza el usuario removiendo información sensible.
   */
  private sanitizeUser(user: User): UserResponseDto {
    const { password, ...sanitized } = user;
    return sanitized as UserResponseDto;
  }


/**
   * Login biométrico - genera tokens después de verificación biométrica.
   * 
   * @param userId - ID del usuario verificado
   * @param method - Método biométrico usado (webauthn o facial)
   * @param ipAddress - IP del cliente
   * @param userAgent - User agent
   * @returns Usuario con tokens
   */
  async biometricLogin(
    userId: string,
    method: 'webauthn' | 'facial',
    ipAddress: string,
    userAgent: string,
  ): Promise<AuthResponseDto> {
    // Buscar usuario
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Registrar login exitoso
    await this.prisma.securityLog.create({
      data: {
        userId: user.id,
        action: `BIOMETRIC_LOGIN_SUCCESS_${method.toUpperCase()}`,
        ipAddress,
        userAgent,
        metadata: {
          email: user.email,
          method,
        },
      },
    });

    this.logger.log(`Login biométrico exitoso (${method}): ${user.email}`);

    // Generar tokens
    const tokens = await this.generateTokens(user, ipAddress, userAgent);

    return new AuthResponseDto({
      user: this.sanitizeUser(user),
      ...tokens,
    });
  }

}