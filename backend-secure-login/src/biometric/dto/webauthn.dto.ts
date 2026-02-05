import { IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';

/**
 * RegistrationOptionsDto
 * 
 * DTO para generar opciones de registro WebAuthn.
 */
export class RegistrationOptionsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}

/**
 * VerifyRegistrationDto
 * 
 * DTO para verificar el registro de credencial WebAuthn.
 * Los campos vienen del cliente después de que el usuario completa el registro.
 */
export class VerifyRegistrationDto {
  @IsNotEmpty()
  credential: any; // Objeto complejo de WebAuthn

  @IsOptional()
  @IsString()
  deviceName?: string;
}

/**
 * AuthenticationOptionsDto
 * 
 * DTO para generar opciones de autenticación WebAuthn.
 */
export class AuthenticationOptionsDto {
  @IsString()
  @IsNotEmpty()
  email: string;
}

/**
 * VerifyAuthenticationDto
 * 
 * DTO para verificar la autenticación WebAuthn.
 */
export class VerifyAuthenticationDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  credential: any; // Objeto complejo de WebAuthn
}

/**
 * WebAuthnCredentialDto
 * 
 * DTO para respuesta con información de credenciales registradas.
 */
export class WebAuthnCredentialDto {
  id: string;
  credentialID: string;
  deviceName?: string;
  credentialDeviceType: string;
  transports: string[];
  createdAt: Date;
  lastUsedAt: Date;
}