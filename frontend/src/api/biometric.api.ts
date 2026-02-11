import type {
  VerifyRegistrationResponseDTO,
  BiometricCredentialResponseDTO,
  VerifyRegistrationRequestDTO,
  VerifyCredentialRequestDTO,
  FaceDescriptorResponseDTO,
  RegisterFaceRequestDTO,
  VerifyFaceDescriptorDTO,
} from "../dto/biometric";
import { api } from "./api";
import type { LoginResponseDTO } from "../dto/auth";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";

export const BiometricAPI = {
  getCredentials() {
    return api.get<BiometricCredentialResponseDTO[]>(
      "/biometric/webauthn/credentials",
    );
  },

  deleteCredential(id: string) {
    return api.delete(`/biometric/webauthn/credentials/${id}`);
  },

  generateRegistrationOptions() {
    return api.post<PublicKeyCredentialCreationOptionsJSON>(
      "/biometric/webauthn/registration/options",
    );
  },

  verifyRegistration(dto: VerifyRegistrationRequestDTO) {
    return api.post<VerifyRegistrationResponseDTO>(
      "/biometric/webauthn/registration/verify",
      dto,
    );
  },

  generateAuthenticationOptions(email: string) {
    const dto = {
      email,
    };

    return api.post<PublicKeyCredentialRequestOptionsJSON>(
      "/biometric/webauthn/authentication/options",
      dto,
    );
  },

  verifyCredential(dto: VerifyCredentialRequestDTO) {
    return api.post<LoginResponseDTO>(
      "/biometric/webauthn/authentication/verify",
      dto,
    );
  },

  registerFaceDescriptor(dto: RegisterFaceRequestDTO) {
    return api.post<FaceDescriptorResponseDTO>(
      "/biometric/facial/register",
      dto,
    );
  },

  getFacialDescriptors() {
    return api.get<FaceDescriptorResponseDTO[]>(
      "/biometric/facial/descriptors",
    );
  },

  deleteFacialDescriptor(id: string) {
    return api.delete(`/biometric/facial/descriptors/${id}`);
  },

  verifyFaceDescriptor(dto: VerifyFaceDescriptorDTO) {
    return api.post<LoginResponseDTO>("/biometric/facial/verify", dto);
  },
};
