import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  Get,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/tokens.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { User } from '@generated/prisma/client';
import { AuthGuard } from '@nestjs/passport';

/**
 * Endpoints:
 * - POST /auth/register - Registro de nuevos usuarios (público)
 * - POST /auth/login - Login con credenciales (público)
 * - POST /auth/refresh - Renovar tokens (público pero requiere refresh token)
 * - POST /auth/logout - Cerrar sesión (protegido)
 * - GET /auth/me - Obtener usuario actual (protegido)

 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * 
   * Registra un nuevo usuario en el sistema.
   * 
   * @param registerDto - Datos del usuario a registrar
   * @param req - Request de Express para extraer IP y User-Agent
   * @returns Usuario creado con tokens
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    return this.authService.register(registerDto, ipAddress, userAgent);
  }

  /**
   * POST /auth/login
   * 
   * Autentica un usuario con email y contraseña.
   * 
   * @param loginDto - Credenciales (email, password)
   * @param req - Request de Express
   * @returns Usuario autenticado con tokens
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  /**
   * POST /auth/refresh
   * 
   * Renueva los access y refresh tokens usando un refresh token válido.
   * Implementa token rotation: el viejo token se revoca y se genera uno nuevo.
   * 
   * @param refreshTokenDto - Refresh token
   * @param req - Request de Express
   * @returns Nuevos tokens
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    return this.authService.refreshTokens(
      refreshTokenDto.refreshToken,
      ipAddress,
      userAgent,
    );
  }

  /**
   * POST /auth/logout
   * 
   * Cierra la sesión del usuario revocando su refresh token.
   * Requiere autenticación (JwtAuthGuard).
   * 
   * @param user - Usuario actual (inyectado por @CurrentUser)
   * @param refreshTokenDto - Token a revocar
   * @param req - Request de Express
   * @returns Mensaje de confirmación
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: User,
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    return this.authService.logout(
      user.id,
      refreshTokenDto.refreshToken,
      ipAddress,
      userAgent,
    );
  }

  /**
   * GET /auth/me
   * 
   * Obtiene la información del usuario actualmente autenticado.
   * Útil para verificar el estado de autenticación en el frontend.
   * 
   * @param user - Usuario actual (inyectado por @CurrentUser)
   * @returns Datos del usuario (sin password)
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: User) {
    // Remover password antes de retornar
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  
  /**
   * POST /auth/login-biometric
   * 
   * Genera tokens JWT después de una autenticación biométrica exitosa.
   * Se llama después de verificar WebAuthn o facial.
   * 
   * @param body - userId y método usado
   * @param req - Request de Express
   * @returns Tokens JWT
   */
  @Public()
  @Post('login-biometric')
  @HttpCode(HttpStatus.OK)
  async loginBiometric(
    @Body() body: { userId: string; method: 'webauthn' | 'facial' },
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    return this.authService.biometricLogin(
      body.userId,
      body.method,
      ipAddress,
      userAgent,
    );
  }
}