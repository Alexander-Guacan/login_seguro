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

export interface VerifyCredentialRequestDTO {
  email: string;
  credential: AuthenticationResponseJSON;
}

export interface RegisterFaceRequestDTO {
  descriptor: number[];
  label: string;
  deviceInfo: string;
}

export interface FaceDescriptorResponseDTO {
  id: string;
  label?: string;
  deviceInfo?: string;
  createdAt: string;
  lastUsedAt: string;
}

export interface VerifyFaceDescriptorDTO {
  email: string;
  descriptor: number[];
}
