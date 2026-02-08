import type { BiometricCredentialResponseDTO } from "../dto/biometric";
import { BiometricCredential } from "../models/biometric";

export const BiometricMapper = {
  toEntity(dto: BiometricCredentialResponseDTO): BiometricCredential {
    return new BiometricCredential({
      id: dto.id,
      credentialDeviceType: dto.credentialDeviceType,
      credentialId: dto.credentialID,
      deviceName: dto.deviceName ?? "Anónimo",
      transports: dto.transports,
      lastUsedAt: new Date(dto.lastUsedAt),
      createdAt: new Date(dto.createdAt),
    });
  },
};
