import type {
  BiometricCredentialResponseDTO,
  FaceDescriptorResponseDTO,
} from "../dto/biometric";
import { BiometricCredential, BiometricDescriptor } from "../models/biometric";

export const BiometricMapper = {
  toCredentialEntity(dto: BiometricCredentialResponseDTO): BiometricCredential {
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

  toDescriptorEntity(dto: FaceDescriptorResponseDTO): BiometricDescriptor {
    return new BiometricDescriptor({
      id: dto.id,
      deviceName: dto.label ?? "Sin nombre",
      deviceInfo: dto.deviceInfo ?? "Sin información",
      createdAt: new Date(dto.createdAt),
      lastUsedAt: new Date(dto.lastUsedAt),
    });
  },
};
