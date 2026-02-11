import { describe, it, expect, vi, beforeEach } from "vitest";
import { BiometricService } from "../services/biometric.service";
import { BiometricAPI } from "../api/biometric.api";
import { BiometricMapper } from "../mappers/biometric.mapper";
import type {
  BiometricCredentialResponseDTO,
  FaceDescriptorResponseDTO,
} from "../dto/biometric";
import { BiometricCredential, BiometricDescriptor } from "../models/biometric";
import type { AxiosResponse } from "axios";

vi.mock("../api/biometric.api");
vi.mock("@simplewebauthn/browser");

const mockedBiometricAPI = vi.mocked(BiometricAPI);

describe("BiometricService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getCredentials retorna instancias de BiometricCredential", async () => {
    const dto: BiometricCredentialResponseDTO[] = [
      {
        id: "1",
        credentialID: "cred1",
        credentialDeviceType: "platform",
        transports: ["usb"],
        deviceName: "Mi dispositivo",
        createdAt: "2026-01-01T00:00:00Z",
        lastUsedAt: "2026-01-02T00:00:00Z",
      },
    ];

    mockedBiometricAPI.getCredentials.mockResolvedValue({
      data: dto,
    } as AxiosResponse<BiometricCredentialResponseDTO[]>);

    const mapped = dto.map(BiometricMapper.toCredentialEntity);

    const result = await BiometricService.getCredentials();

    expect(result).toEqual(mapped);
    expect(result[0]).toBeInstanceOf(BiometricCredential);
  });

  it("getCredentials lanza error si falla la API", async () => {
    mockedBiometricAPI.getCredentials.mockRejectedValue(new Error("Fail"));
    await expect(BiometricService.getCredentials()).rejects.toThrow(
      "El usuario no tiene registrado metodos de autenticación biométricas",
    );
  });

  it("getFacialDescriptors retorna instancias de BiometricDescriptor", async () => {
    const dto: FaceDescriptorResponseDTO[] = [
      {
        id: "face1",
        label: "Face ID 1",
        deviceInfo: "Macbook",
        createdAt: "2026-01-01T00:00:00Z",
        lastUsedAt: "2026-01-02T00:00:00Z",
      },
    ];

    mockedBiometricAPI.getFacialDescriptors.mockResolvedValue({
      data: dto,
    } as AxiosResponse<FaceDescriptorResponseDTO[]>);

    const mapped = dto.map(BiometricMapper.toDescriptorEntity);

    const result = await BiometricService.getFacialDescriptors();

    expect(result).toEqual(mapped);
    expect(result[0]).toBeInstanceOf(BiometricDescriptor);
  });

  it("getFacialDescriptors lanza error si falla la API", async () => {
    mockedBiometricAPI.getFacialDescriptors.mockRejectedValue(
      new Error("Fail"),
    );
    await expect(BiometricService.getFacialDescriptors()).rejects.toThrow(
      "No se pudieron obtener los Face IDs del usuario. Intentelo más tarde.",
    );
  });
});
