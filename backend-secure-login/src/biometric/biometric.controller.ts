import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { BiometricService } from './biometric.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@generated/prisma/client';
import {
  VerifyRegistrationDto,
  AuthenticationOptionsDto,
  VerifyAuthenticationDto,
} from './dto/webauthn.dto';
import { RegisterFaceDto, VerifyFaceDto } from './dto/facial.dto';
import { AuthService } from '../auth';

/**
 * Endpoints WebAuthn:
 * - POST /biometric/webauthn/registration/options - Generar opciones de registro
 * - POST /biometric/webauthn/registration/verify - Verificar registro
 * - POST /biometric/webauthn/authentication/options - Generar opciones de login (público)
 * - POST /biometric/webauthn/authentication/verify - Verificar login (público)
 * - GET /biometric/webauthn/credentials - Listar credenciales
 * - DELETE /biometric/webauthn/credentials/:id - Eliminar credencial
 * 
 * Endpoints Facial:
 * - POST /biometric/facial/register - Registrar descriptor facial
 * - POST /biometric/facial/verify - Verificar rostro (público)
 * - GET /biometric/facial/descriptors - Listar descriptores
 * - DELETE /biometric/facial/descriptors/:id - Eliminar descriptor
 * 
 * Endpoints Generales:
 * - GET /biometric/status - Estado biométrico del usuario
 */
@Controller('biometric')
@UseGuards(JwtAuthGuard)
export class BiometricController {
  constructor(
    private readonly biometricService: BiometricService,
    private readonly authService: AuthService
  ) {}

  // ========== WEBAUTHN ==========

  /**
   * POST /biometric/webauthn/registration/options
   * 
   * Genera opciones para registrar una credencial WebAuthn.
   * El usuario debe estar autenticado.
   * 
   * @param currentUser - Usuario actual
   * @returns Opciones de registro
   */
  @Post('webauthn/registration/options')
  @HttpCode(HttpStatus.OK)
  async generateRegistrationOptions(@CurrentUser() currentUser: User) {
    return this.biometricService.generateRegistrationOptions(currentUser.id);
  }

  /**
   * POST /biometric/webauthn/registration/verify
   * 
   * Verifica y registra una credencial WebAuthn.
   * 
   * @param currentUser - Usuario actual
   * @param verifyDto - Credencial del cliente
   * @returns Credencial registrada
   */
  @Post('webauthn/registration/verify')
  @HttpCode(HttpStatus.CREATED)
  async verifyRegistration(
    @CurrentUser() currentUser: User,
    @Body() verifyDto: VerifyRegistrationDto,
  ) {
    return this.biometricService.verifyRegistration(currentUser.id, verifyDto);
  }

  /**
   * POST /biometric/webauthn/authentication/options
   * 
   * Genera opciones para autenticación WebAuthn.
   * Endpoint público (para login).
   * 
   * @param optionsDto - Email del usuario
   * @returns Opciones de autenticación
   */
  @Public()
  @Post('webauthn/authentication/options')
  @HttpCode(HttpStatus.OK)
  async generateAuthenticationOptions(@Body() optionsDto: AuthenticationOptionsDto) {
    return this.biometricService.generateAuthenticationOptions(optionsDto.email);
  }

  /**
   * POST /biometric/webauthn/authentication/verify
   * 
   * Verifica la autenticación WebAuthn y retorna tokens JWT.
   * Endpoint público (para login).
   * 
   * @param verifyDto - Email y credencial
   * @returns Usuario autenticado (luego se generan tokens en auth.service)
   */
  @Public()
  @Post('webauthn/authentication/verify')
  @HttpCode(HttpStatus.OK)
  async verifyAuthentication(
    @Body() verifyDto: VerifyAuthenticationDto,
    @Req() req: any, ) {
    // Verificar autenticación
    const user = await this.biometricService.verifyAuthentication(
      verifyDto.email,
      verifyDto.credential,
    );

     // 2. Generar tokens JWT
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.authService.biometricLogin(
      user.id,
      'webauthn',
      ipAddress,
      userAgent,
    );
  }

  /**
   * GET /biometric/webauthn/credentials
   * 
   * Lista las credenciales WebAuthn del usuario actual.
   * 
   * @param currentUser - Usuario actual
   * @returns Lista de credenciales
   */
  @Get('webauthn/credentials')
  @HttpCode(HttpStatus.OK)
  async listWebAuthnCredentials(@CurrentUser() currentUser: User) {
    return this.biometricService.listWebAuthnCredentials(currentUser.id);
  }

  /**
   * DELETE /biometric/webauthn/credentials/:id
   * 
   * Elimina una credencial WebAuthn.
   * 
   * @param currentUser - Usuario actual
   * @param id - ID de la credencial
   * @returns Mensaje de confirmación
   */
  @Delete('webauthn/credentials/:id')
  @HttpCode(HttpStatus.OK)
  async deleteWebAuthnCredential(
    @CurrentUser() currentUser: User,
    @Param('id') id: string,
  ) {
    return this.biometricService.deleteWebAuthnCredential(currentUser.id, id);
  }

  // ========== FACIAL ==========

  /**
   * POST /biometric/facial/register
   * 
   * Registra un descriptor facial para el usuario actual.
   * 
   * @param currentUser - Usuario actual
   * @param registerDto - Descriptor facial
   * @returns Descriptor registrado
   */
  @Post('facial/register')
  @HttpCode(HttpStatus.CREATED)
  async registerFace(
    @CurrentUser() currentUser: User,
    @Body() registerDto: RegisterFaceDto,
  ) {
    return this.biometricService.registerFace(currentUser.id, registerDto);
  }

  /**
   * POST /biometric/facial/verify
   * 
   * Verifica un descriptor facial para login.
   * Endpoint público.
   * 
   * @param verifyDto - Email y descriptor
   * @returns Usuario autenticado
   */
  @Public()
  @Post('facial/verify')
  @HttpCode(HttpStatus.OK)
  async verifyFace(
    @Body() verifyDto: VerifyFaceDto,
    @Req() req: any,
  ) {
    // Verificar rostro
    const user = await this.biometricService.verifyFace(verifyDto);

    const ipAddress = req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Retornar éxito
    return this.authService.biometricLogin(
      user.id,
      'facial',
      ipAddress,
      userAgent,
    );
  }

  /**
   * GET /biometric/facial/descriptors
   * 
   * Lista los descriptores faciales del usuario actual.
   * 
   * @param currentUser - Usuario actual
   * @returns Lista de descriptores
   */
  @Get('facial/descriptors')
  @HttpCode(HttpStatus.OK)
  async listFaceDescriptors(@CurrentUser() currentUser: User) {
    return this.biometricService.listFaceDescriptors(currentUser.id);
  }

  /**
   * DELETE /biometric/facial/descriptors/:id
   * 
   * Elimina un descriptor facial.
   * 
   * @param currentUser - Usuario actual
   * @param id - ID del descriptor
   * @returns Mensaje de confirmación
   */
  @Delete('facial/descriptors/:id')
  @HttpCode(HttpStatus.OK)
  async deleteFaceDescriptor(
    @CurrentUser() currentUser: User,
    @Param('id') id: string,
  ) {
    return this.biometricService.deleteFaceDescriptor(currentUser.id, id);
  }

  // ========== GENERAL ==========

  /**
   * GET /biometric/status
   * 
   * Obtiene el estado biométrico del usuario actual.
   * Indica qué métodos tiene registrados.
   * 
   * @param currentUser - Usuario actual
   * @returns Estado biométrico
   */
  @Get('status')
  @HttpCode(HttpStatus.OK)
  async getBiometricStatus(@CurrentUser() currentUser: User) {
    return this.biometricService.getBiometricStatus(currentUser.id);
  }
}