import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";

export interface BiometricCredentialResponseDTO {
  id: string;
  credentialID: string;
  deviceName?: string;
  credentialDeviceType: string;
  transports: string[];
  createdAt: string;
  lastUsedAt: string;
}

export interface VerifyRegistrationRequestDTO {
  credential: RegistrationResponseJSON;
  deviceName: string;
}

export interface VerifyRegistrationResponseDTO {
  id: string;
  credentialID: string;
  deviceName: string;
  credentialDeviceType: string;
  transports: string[];
  createdAt: string;
  lastUsedAt: string;
}

export interface VerifyAuthenticationRequestDTO {
  email: string;
  credential: AuthenticationResponseJSON;
}
