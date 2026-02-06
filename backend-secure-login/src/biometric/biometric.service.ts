import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';
import * as crypto from 'crypto';
import * as CryptoJS from 'crypto-js';
import { PrismaService } from '../prisma/prisma.service';
import { VerifyRegistrationDto, WebAuthnCredentialDto } from './dto/webauthn.dto';
import { RegisterFaceDto, VerifyFaceDto, FaceDescriptorResponseDto } from './dto/facial.dto';
import { BiometricStatusDto } from './dto/biometric-status.dto';

/**
 * Responsabilidades:
 * - Registro de credenciales WebAuthn (huella, Face ID, etc.)
 * - Autenticación con WebAuthn
 * - Registro de descriptores faciales
 * - Verificación de descriptores faciales
 * - Gestión de credenciales biométricas
 */
@Injectable()
export class BiometricService {
  private readonly logger = new Logger(BiometricService.name);
  
  private readonly rpName = process.env.RP_NAME || 'Secure Login App';
  private readonly rpID = (process.env.RP_ID || 'localhost').trim();
  private readonly origin = process.env.ORIGIN || 'https://13dd-200-50-232-234.ngrok-free.app';
  
  // Secreto para encriptar descriptores faciales
  private readonly encryptionKey = process.env.FACE_ENCRYPTION_KEY || 'change-this-in-production-minimum-32-chars';

  constructor(private prisma: PrismaService) {
    this.logger.log(`🔧 WebAuthn Config - RP_ID: ${this.rpID}, ORIGIN: ${this.origin}`);
  }

  // ========== WEBAUTHN ==========

  /**
   * Genera opciones para registro de credencial WebAuthn.
   * 
   * @param userId - ID del usuario
   * @returns Opciones de registro para el cliente
   */
  async generateRegistrationOptions(userId: string) {

    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { authenticators: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }


    // ✅ Obtener credenciales existentes para excluirlas
    const userAuthenticators = user.authenticators.map((auth) => ({
      id: auth.credentialID, // ✅ Usar directamente el string base64
      type: 'public-key' as const,
      transports: auth.transports as AuthenticatorTransport[],
    }));

    const opts: GenerateRegistrationOptionsOpts = {
      rpName: this.rpName,
      rpID: this.rpID,
      userID: this.stringToUint8Array(userId), // ✅ SimpleWebAuthn convierte automáticamente a Uint8Array
      userName: user.email,
      userDisplayName: `${user.firstName} ${user.lastName}`,
      attestationType: 'none',
      excludeCredentials: userAuthenticators,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    };

    const options = await generateRegistrationOptions(opts);

    this.logger.debug(`📋 OPTIONS GENERADAS PARA REGISTRO:`, {
      rpId: options.rp,
      challenge: options.challenge.substring(0, 20) + '...',
      user: options.user,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          ...(user.preferences as any),
          currentChallenge: options.challenge,
        },
      },
    });

    

    return options;
  }

  /**
   * Verifica el registro de una credencial WebAuthn.
   * 
   * @param userId - ID del usuario
   * @param verifyDto - Credencial del cliente
   * @returns Credencial registrada
   */
  async verifyRegistration(userId: string, verifyDto: VerifyRegistrationDto) {
    const { credential, deviceName } = verifyDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const expectedChallenge = (user.preferences as any)?.currentChallenge;

    if (!expectedChallenge) {
      throw new BadRequestException('Challenge no encontrado');
    }

    try {
      const opts: VerifyRegistrationResponseOpts = {
        response: credential as RegistrationResponseJSON,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
      };

      const verification = await verifyRegistrationResponse(opts);

      if (!verification.verified || !verification.registrationInfo) {
        throw new BadRequestException('Verificación de credencial fallida');
      }

      const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp } =
        verification.registrationInfo;

      // ✅ FIX: Declarar authenticator fuera de la transacción
      let authenticator;

      await this.prisma.$transaction(async (tx) => {
        // ✅ FIX: Asignar el valor dentro de la transacción
        authenticator = await tx.authenticator.create({
          data: {
            userId,
            credentialID: credentialID,
            credentialPublicKey: Buffer.from(credentialPublicKey),
            counter: BigInt(counter),
            credentialDeviceType,
            credentialBackedUp,
            transports: credential.response.transports || [],
            deviceName: deviceName || 'Dispositivo sin nombre',
          },
        });

        await tx.securityLog.create({
          data: {
            userId,
            action: 'WEBAUTHN_REGISTERED',
            ipAddress: 'system',
            userAgent: 'system',
            metadata: {
              credentialID: authenticator.credentialID, // ✅ Ahora está inicializada
              deviceName: authenticator.deviceName,
            },
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            preferences: {
              ...(user.preferences as any),
              currentChallenge: null,
            },
          },
        });
      });

      this.logger.log(`✅ Credencial WebAuthn registrada para usuario: ${user.email}`);

      // ✅ Retornar después de la transacción
      return {
        id: authenticator.id,
        credentialID: authenticator.credentialID,
        deviceName: authenticator.deviceName,
        credentialDeviceType: authenticator.credentialDeviceType,
        transports: authenticator.transports,
        createdAt: authenticator.createdAt,
        lastUsedAt: authenticator.lastUsedAt,
      };
    } catch (error) {
      this.logger.error('❌ Error verificando registro WebAuthn:', error);
      throw new BadRequestException('Error al verificar la credencial');
    }
  }

  /**
   * Genera opciones para autenticación WebAuthn.
   * 
   * @param email - Email del usuario
   * @returns Opciones de autenticación
   */
  async generateAuthenticationOptions(email: string) {
    this.logger.debug(`🔍 Generando opciones de autenticación para: ${email}`);
    this.logger.debug(`🌐 RP ID: ${this.rpID}`);
    this.logger.debug(`🌐 Origin: ${this.origin}`);
    
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { authenticators: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    this.logger.debug(`👤 Usuario encontrado: ${user.id}`);
    this.logger.debug(`🔑 Credenciales encontradas: ${user.authenticators.length}`);

    user.authenticators.forEach((auth, idx) => {
      this.logger.debug(`📱 Credencial ${idx + 1}:`);
      this.logger.debug({
        id: auth.id,
        credentialID: auth.credentialID.substring(0, 20) + '...',
        deviceName: auth.deviceName,
        transports: auth.transports,
      });
    });


    const opts: GenerateAuthenticationOptionsOpts = {
      rpID: this.rpID,
      allowCredentials: user.authenticators.map((auth) => ({
        id: auth.credentialID, // ✅ Usar directamente el string base64
        type: 'public-key' as const,
        transports: auth.transports as AuthenticatorTransport[],
      })),
      userVerification: 'preferred',
    };

    const options = await generateAuthenticationOptions(opts);

    this.logger.debug(`📤 Opciones generadas:`);
    this.logger.debug({
      rpId: options.rpId,
      challenge: options.challenge.substring(0, 20) + '...',
      allowCredentials: options.allowCredentials?.length,
    });

    this.logger.debug(`📋 OPTIONS GENERADAS PARA AUTH:`);
    this.logger.debug({
      rpId: options.rpId,
      challenge: options.challenge.substring(0, 20) + '...',
      allowCredentials: options.allowCredentials?.map((c) => ({
        id: c.id.substring(0, 20) + '...',
        transports: c.transports,
      })),
    });


    // Guardar challenge
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        preferences: {
          ...(user.preferences as any),
          currentChallenge: options.challenge,
        },
      },
    });

    return options;
  }

  /**
   * Verifica la autenticación WebAuthn.
   * 
   * @param email - Email del usuario
   * @param credential - Credencial del cliente
   * @returns Usuario autenticado
   */
  async verifyAuthentication(email: string, credential: any) {
    this.logger.debug(`🔐 Verificando autenticación para: ${email}`);
    this.logger.debug(`📥 Credential recibida:`, JSON.stringify(credential, null, 2));

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { authenticators: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const expectedChallenge = (user.preferences as any)?.currentChallenge;

    if (!expectedChallenge) {
      this.logger.error('❌ Challenge no encontrado en user.preferences');
      throw new BadRequestException('Challenge no encontrado');
    }

    // ✅ Log del credentialID recibido
    this.logger.debug(`📋 Expected challenge: ${expectedChallenge.substring(0, 20)}...`);
    this.logger.debug(`📥 CredentialID recibido: ${credential.rawId?.substring(0, 20)}...`);


    const credentialID = credential.id;
    
    this.logger.debug(`🔍 Buscando credencial: ${credentialID?.substring(0, 20)}...`);

    const authenticator = user.authenticators.find(
      (auth) => auth.credentialID === credentialID,
    );

    if (!authenticator) {
      this.logger.error(`❌ Credencial no encontrada. Buscando: ${credentialID?.substring(0, 20)}...`);
      this.logger.error(
        `📋 Credenciales disponibles:`,
        user.authenticators.map((a) => ({
          credentialID: a.credentialID.substring(0, 20) + '...',
          deviceName: a.deviceName,
        })),
      );
      throw new UnauthorizedException('Credencial no encontrada');
    }

    this.logger.debug(`✅ Credencial encontrada: ${authenticator.deviceName}`);

    try {

      this.logger.debug(`🔄 Verificando con @simplewebauthn/server...`);

      const opts: VerifyAuthenticationResponseOpts = {
        response: credential as AuthenticationResponseJSON,
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        authenticator: {
          credentialID: authenticator.credentialID,
          credentialPublicKey: authenticator.credentialPublicKey,
          counter: Number(authenticator.counter),
        },
      };

      this.logger.debug(`🔧 Opciones de verificación:`, {
        expectedOrigin: opts.expectedOrigin,
        expectedRPID: opts.expectedRPID,
        counter: opts.authenticator.counter,
      });

      const verification = await verifyAuthenticationResponse(opts);

      if (!verification.verified) {
        this.logger.error('❌ Verificación fallida - verification.verified = false');
        throw new UnauthorizedException('Verificación fallida');
      }

      this.logger.log(`✅ Verificación exitosa!`);

      // Actualizar contador y última vez usado
      await this.prisma.$transaction(async (tx) => {
        await tx.authenticator.update({
          where: { id: authenticator.id },
          data: {
            counter: BigInt(verification.authenticationInfo.newCounter),
            lastUsedAt: new Date(),
          },
        });

        // Log de seguridad
        await tx.securityLog.create({
          data: {
            userId: user.id,
            action: 'WEBAUTHN_LOGIN_SUCCESS',
            ipAddress: 'system',
            userAgent: 'system',
            metadata: {
              credentialID: authenticator.credentialID,
            },
          },
        });

        // Limpiar challenge
        await tx.user.update({
          where: { id: user.id },
          data: {
            preferences: {
              ...(user.preferences as any),
              currentChallenge: null,
            },
          },
        });
      });

      this.logger.log(`Login WebAuthn exitoso: ${user.email}`);

      return user;
    } catch (error) {
      this.logger.error('Error verificando autenticación WebAuthn:', error);
      throw new UnauthorizedException('Autenticación fallida');
    }
  }

  // ========== FACIAL RECOGNITION ==========

  /**
   * Registra un descriptor facial para un usuario.
   * 
   * @param userId - ID del usuario
   * @param registerDto - Descriptor facial
   * @returns Descriptor registrado
   */
  async registerFace(userId: string, registerDto: RegisterFaceDto) {
    const { descriptor, label, deviceInfo } = registerDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Encriptar el descriptor
    const encryptedDescriptor = this.encryptDescriptor(descriptor);

    // Guardar en BD
    const faceDescriptor = await this.prisma.$transaction(async (tx) => {
      const face = await tx.faceDescriptor.create({
        data: {
          userId,
          descriptor: encryptedDescriptor,
          label: label || 'Descriptor sin nombre',
          deviceInfo,
        },
      });

      // Log de seguridad
      await tx.securityLog.create({
        data: {
          userId,
          action: 'FACIAL_REGISTERED',
          ipAddress: 'system',
          userAgent: 'system',
          metadata: {
            faceDescriptorId: face.id,
            label: face.label,
          },
        },
      });

      return face;
    });

    this.logger.log(`Descriptor facial registrado para usuario: ${user.email}`);

    const dto = new FaceDescriptorResponseDto();
    dto.id = faceDescriptor.id;
    dto.label = faceDescriptor.label ?? undefined;
    dto.deviceInfo = faceDescriptor.deviceInfo ?? undefined;
    dto.createdAt = faceDescriptor.createdAt;
    dto.lastUsedAt = faceDescriptor.lastUsedAt ?? undefined;

    return dto;
  }

  /**
   * Verifica un descriptor facial contra los registrados.
   * 
   * @param verifyDto - Email y descriptor a verificar
   * @returns Usuario si coincide
   */
  async verifyFace(verifyDto: VerifyFaceDto) {
    const { email, descriptor } = verifyDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { faceDescriptors: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.faceDescriptors.length === 0) {
      throw new BadRequestException('El usuario no tiene descriptores faciales registrados');
    }

    // Comparar con cada descriptor registrado
    const threshold = 0.6; // Umbral de similitud (ajustable)
    let bestMatch: any = null;
    let bestDistance = Infinity;

    for (const stored of user.faceDescriptors) {
      const decryptedDescriptor = this.decryptDescriptor(stored.descriptor);
      const distance = this.euclideanDistance(descriptor, decryptedDescriptor);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = stored;
      }
    }

    // Verificar si la mejor coincidencia es suficientemente buena
    if (bestDistance > threshold) {
      await this.prisma.securityLog.create({
        data: {
          userId: user.id,
          action: 'FACIAL_LOGIN_FAILED',
          ipAddress: 'system',
          userAgent: 'system',
          metadata: {
            reason: 'Distance too high',
            distance: bestDistance,
          },
        },
      });

      throw new UnauthorizedException('Rostro no reconocido');
    }

    // Actualizar última vez usado
    await this.prisma.$transaction(async (tx) => {
      await tx.faceDescriptor.update({
        where: { id: bestMatch.id },
        data: { lastUsedAt: new Date() },
      });

      // Log de seguridad
      await tx.securityLog.create({
        data: {
          userId: user.id,
          action: 'FACIAL_LOGIN_SUCCESS',
          ipAddress: 'system',
          userAgent: 'system',
          metadata: {
            faceDescriptorId: bestMatch.id,
            distance: bestDistance,
          },
        },
      });
    });

    this.logger.log(`Login facial exitoso: ${user.email} (distancia: ${bestDistance})`);

    return user;
  }

  // ========== GESTIÓN ==========

  /**
   * Obtiene el estado biométrico de un usuario.
   */
  async getBiometricStatus(userId: string): Promise<BiometricStatusDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        authenticators: true,
        faceDescriptors: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const hasWebAuthn = user.authenticators.length > 0;
    const hasFacial = user.faceDescriptors.length > 0;
    const availableMethods: string[] = [];

    if (hasWebAuthn) availableMethods.push('webauthn');
    if (hasFacial) availableMethods.push('facial');

    return new BiometricStatusDto({
      hasWebAuthn,
      hasFacial,
      webAuthnCount: user.authenticators.length,
      facialCount: user.faceDescriptors.length,
      availableMethods,
    });
  }

  /**
   * Lista las credenciales WebAuthn de un usuario.
   */
  async listWebAuthnCredentials(userId: string): Promise<WebAuthnCredentialDto[]> {
    const authenticators = await this.prisma.authenticator.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return authenticators.map(
      (auth) =>{
        const dto = new WebAuthnCredentialDto();
        
          dto.id = auth.id;
          dto.credentialID = auth.credentialID;
          dto.deviceName = auth.deviceName ?? undefined;
          dto.credentialDeviceType = auth.credentialDeviceType;
          dto.transports = auth.transports;
          dto.createdAt = auth.createdAt;
          dto.lastUsedAt = auth.lastUsedAt;

          return dto;
        
      }
    );
  }

  /**
   * Lista los descriptores faciales de un usuario.
   */
  async listFaceDescriptors(userId: string): Promise<FaceDescriptorResponseDto[]> {
    const descriptors = await this.prisma.faceDescriptor.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return descriptors.map(
      (desc) =>{
        const dto = new FaceDescriptorResponseDto();

          dto.id = desc.id;
          dto.label = desc.label ?? undefined;
          dto.deviceInfo = desc.deviceInfo ?? undefined;
          dto.createdAt = desc.createdAt;
          dto.lastUsedAt = desc.lastUsedAt;

          return dto;
      }
    );
  }

  /**
   * Elimina una credencial WebAuthn.
   */
  async deleteWebAuthnCredential(userId: string, credentialId: string) {
    const authenticator = await this.prisma.authenticator.findFirst({
      where: { id: credentialId, userId },
    });

    if (!authenticator) {
      throw new NotFoundException('Credencial no encontrada');
    }

    await this.prisma.authenticator.delete({
      where: { id: credentialId },
    });

    this.logger.log(`Credencial WebAuthn eliminada: ${credentialId}`);

    return { message: 'Credencial eliminada exitosamente' };
  }

  /**
   * Elimina un descriptor facial.
   */
  async deleteFaceDescriptor(userId: string, descriptorId: string) {
    const descriptor = await this.prisma.faceDescriptor.findFirst({
      where: { id: descriptorId, userId },
    });

    if (!descriptor) {
      throw new NotFoundException('Descriptor no encontrado');
    }

    await this.prisma.faceDescriptor.delete({
      where: { id: descriptorId },
    });

    this.logger.log(`Descriptor facial eliminado: ${descriptorId}`);

    return { message: 'Descriptor eliminado exitosamente' };
  }

  // ========== HELPERS ==========


/**
   * Convierte un string a Uint8Array para WebAuthn.
   * @param str - String a convertir
   * @returns Uint8Array
   */
  private stringToUint8Array(str: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  }


  /**
   * Encripta un descriptor facial.
   */
  private encryptDescriptor(descriptor: number[]): string {
    const descriptorStr = JSON.stringify(descriptor);
    return CryptoJS.AES.encrypt(descriptorStr, this.encryptionKey).toString();
  }

  /**
   * Desencripta un descriptor facial.
   */
  private decryptDescriptor(encryptedDescriptor: string): number[] {
    const bytes = CryptoJS.AES.decrypt(encryptedDescriptor, this.encryptionKey);
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedStr);
  }

  /**
   * Calcula la distancia euclidiana entre dos descriptores.
   */
  private euclideanDistance(descriptor1: number[], descriptor2: number[]): number {
    if (descriptor1.length !== descriptor2.length) {
      throw new Error('Descriptores de longitud diferente');
    }

    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
      sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
    }

    return Math.sqrt(sum);
  }
}