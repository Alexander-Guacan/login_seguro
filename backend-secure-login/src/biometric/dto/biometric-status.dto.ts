/**
 * BiometricStatusDto
 * 
 * DTO para indicar qué métodos biométricos tiene registrados un usuario.
 */
export class BiometricStatusDto {
  hasWebAuthn: boolean;
  hasFacial: boolean;
  webAuthnCount: number;
  facialCount: number;
  availableMethods: string[];

  constructor(partial: Partial<BiometricStatusDto>) {
    Object.assign(this, partial);
  }
}