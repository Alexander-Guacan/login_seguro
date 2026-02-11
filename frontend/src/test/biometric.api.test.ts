import { describe, it, expect, vi, beforeEach } from "vitest";
import { BiometricAPI } from "../api/biometric.api";
import { api } from "../api/api";
import { AxiosHeaders, type AxiosResponse } from "axios";
import type {
  BiometricCredentialResponseDTO,
  FaceDescriptorResponseDTO,
  RegisterFaceRequestDTO,
  VerifyCredentialRequestDTO,
  VerifyFaceDescriptorDTO,
  VerifyRegistrationRequestDTO,
  VerifyRegistrationResponseDTO,
} from "../dto/biometric";
import type {
  AuthenticationResponseJSON,
  AuthenticatorAttestationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import type { LoginResponseDTO } from "../dto/auth";

vi.mock("../api/api");
const mockedApi = vi.mocked(api, true);

describe("BiometricAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("llama al endpoint correcto y retorna datos", async () => {
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

    const axiosResponse: AxiosResponse<BiometricCredentialResponseDTO[]> = {
      data: dto,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    mockedApi.get.mockResolvedValue(axiosResponse);

    const result = await BiometricAPI.getCredentials();

    expect(mockedApi.get).toHaveBeenCalledWith(
      "/biometric/webauthn/credentials",
    );
    expect(result.data).toEqual(dto);
  });

  it("llama al endpoint DELETE correctamente", async () => {
    const id = "cred1";

    const axiosResponse: AxiosResponse<void> = {
      data: undefined,
      status: 204,
      statusText: "No Content",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };
    mockedApi.delete.mockResolvedValue(axiosResponse);

    const result = await BiometricAPI.deleteCredential(id);

    expect(mockedApi.delete).toHaveBeenCalledWith(
      `/biometric/webauthn/credentials/${id}`,
    );
    expect(result).toEqual(axiosResponse);
  });

  it("lanza error si la API falla", async () => {
    const id = "cred1";

    mockedApi.delete.mockRejectedValue(new Error("Fail"));

    await expect(BiometricAPI.deleteCredential(id)).rejects.toThrow("Fail");
  });

  it("llama al endpoint POST y retorna datos tipados", async () => {
    const registrationOptions: PublicKeyCredentialCreationOptionsJSON = {
      rp: { name: "Test RP", id: "test.local" },
      user: { id: "user1", name: "user@test.com", displayName: "User Test" },
      challenge: "test-challenge",
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
    };

    const axiosResponse: AxiosResponse<PublicKeyCredentialCreationOptionsJSON> =
      {
        data: registrationOptions,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {
          headers: new AxiosHeaders(),
        },
      };

    mockedApi.post.mockResolvedValue(axiosResponse);

    const result = await BiometricAPI.generateRegistrationOptions();

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/biometric/webauthn/registration/options",
    );
    expect(result.data).toEqual(registrationOptions);
  });

  it("lanza error si la API falla", async () => {
    mockedApi.post.mockRejectedValue(new Error("Fail"));

    await expect(BiometricAPI.generateRegistrationOptions()).rejects.toThrow(
      "Fail",
    );
  });

  it("llama al endpoint POST con payload y retorna datos tipados", async () => {
    const payload: VerifyRegistrationRequestDTO = {
      credential: {
        id: "cred1",
        rawId: "rawId",
        response: {} as AuthenticatorAttestationResponseJSON,
        type: "public-key",
        clientExtensionResults: {},
      },
      deviceName: "Mi dispositivo",
    };

    const responseDTO: VerifyRegistrationResponseDTO = {
      id: "1",
      credentialID: "cred1",
      credentialDeviceType: "platform",
      transports: ["usb"],
      deviceName: "Mi dispositivo",
      createdAt: "2026-01-01T00:00:00Z",
      lastUsedAt: "2026-01-02T00:00:00Z",
    };

    const axiosResponse: AxiosResponse<VerifyRegistrationResponseDTO> = {
      data: responseDTO,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    mockedApi.post.mockResolvedValue(axiosResponse);

    const result = await BiometricAPI.verifyRegistration(payload);

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/biometric/webauthn/registration/verify",
      payload,
    );
    expect(result.data).toEqual(responseDTO);
  });

  it("lanza error si la API falla", async () => {
    const payload: VerifyRegistrationRequestDTO = {
      credential: {
        id: "cred1",
        rawId: "rawId",
        response: {},
        type: "public-key",
        clientExtensionResults: {},
      } as RegistrationResponseJSON,
      deviceName: "Mi dispositivo",
    };

    mockedApi.post.mockRejectedValue(new Error("Fail"));

    await expect(BiometricAPI.verifyRegistration(payload)).rejects.toThrow(
      "Fail",
    );
  });

  it("llama al endpoint POST con email y retorna datos tipados", async () => {
    const email = "user@test.com";

    const options: PublicKeyCredentialRequestOptionsJSON = {
      challenge: "challenge-string",
      allowCredentials: [{ id: "cred1", type: "public-key" }],
    };

    const axiosResponse: AxiosResponse<PublicKeyCredentialRequestOptionsJSON> =
      {
        data: options,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {
          headers: new AxiosHeaders(),
        },
      };

    mockedApi.post.mockResolvedValue(axiosResponse);

    const result = await BiometricAPI.generateAuthenticationOptions(email);

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/biometric/webauthn/authentication/options",
      { email },
    );
    expect(result.data).toEqual(options);
  });

  it("lanza error si la API falla", async () => {
    const email = "user@test.com";

    mockedApi.post.mockRejectedValue(new Error("Fail"));

    await expect(
      BiometricAPI.generateAuthenticationOptions(email),
    ).rejects.toThrow("Fail");
  });

  it("llama al endpoint POST con payload y retorna LoginResponseDTO", async () => {
    const payload: VerifyCredentialRequestDTO = {
      email: "user@test.com",
      credential: {
        id: "cred1",
        rawId: "rawId",
        response: {},
        type: "public-key",
      } as AuthenticationResponseJSON,
    };

    const loginResponse: LoginResponseDTO = {
      user: {
        id: "u1",
        firstName: "User",
        lastName: "Test",
        email: "user@test.com",
        createdAt: new Date().toString(),
        isActive: true,
        role: "ADMIN",
      },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    };

    const axiosResponse: AxiosResponse<LoginResponseDTO> = {
      data: loginResponse,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    mockedApi.post.mockResolvedValue(axiosResponse);

    const result = await BiometricAPI.verifyCredential(payload);

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/biometric/webauthn/authentication/verify",
      payload,
    );
    expect(result.data).toEqual(loginResponse);
  });

  it("lanza error si la API falla", async () => {
    const payload: VerifyCredentialRequestDTO = {
      email: "user@test.com",
      credential: {
        id: "cred1",
        rawId: "rawId",
        response: {},
        type: "public-key",
      } as AuthenticationResponseJSON,
    };

    mockedApi.post.mockRejectedValue(new Error("Fail"));

    await expect(BiometricAPI.verifyCredential(payload)).rejects.toThrow(
      "Fail",
    );
  });

  it("llama al endpoint POST con payload y retorna FaceDescriptorResponseDTO", async () => {
    const payload: RegisterFaceRequestDTO = {
      descriptor: [0.1, 0.2, 0.3],
      label: "Mi FaceID",
      deviceInfo: "Macbook",
    };

    const responseDTO: FaceDescriptorResponseDTO = {
      id: "face1",
      label: "Mi FaceID",
      deviceInfo: "Macbook",
      createdAt: "2026-01-01T00:00:00Z",
      lastUsedAt: "2026-01-02T00:00:00Z",
    };

    const axiosResponse: AxiosResponse<FaceDescriptorResponseDTO> = {
      data: responseDTO,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    mockedApi.post.mockResolvedValue(axiosResponse);

    const result = await BiometricAPI.registerFaceDescriptor(payload);

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/biometric/facial/register",
      payload,
    );
    expect(result.data).toEqual(responseDTO);
  });

  it("lanza error si la API falla", async () => {
    const payload: RegisterFaceRequestDTO = {
      descriptor: [0.1, 0.2, 0.3],
      label: "Mi FaceID",
      deviceInfo: "Macbook",
    };

    mockedApi.post.mockRejectedValue(new Error("Fail"));

    await expect(BiometricAPI.registerFaceDescriptor(payload)).rejects.toThrow(
      "Fail",
    );
  });

  it("llama al endpoint GET y retorna FaceDescriptorResponseDTO[]", async () => {
    const responseDTO: FaceDescriptorResponseDTO[] = [
      {
        id: "face1",
        label: "Face 1",
        deviceInfo: "Macbook",
        createdAt: "2026-01-01T00:00:00Z",
        lastUsedAt: "2026-01-02T00:00:00Z",
      },
      {
        id: "face2",
        label: "Face 2",
        deviceInfo: "iPhone",
        createdAt: "2026-01-03T00:00:00Z",
        lastUsedAt: "2026-01-04T00:00:00Z",
      },
    ];

    const axiosResponse: AxiosResponse<FaceDescriptorResponseDTO[]> = {
      data: responseDTO,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    mockedApi.get.mockResolvedValue(axiosResponse);

    const result = await BiometricAPI.getFacialDescriptors();

    expect(mockedApi.get).toHaveBeenCalledWith("/biometric/facial/descriptors");
    expect(result.data).toEqual(responseDTO);
  });

  it("lanza error si la API falla", async () => {
    mockedApi.get.mockRejectedValue(new Error("Fail"));

    await expect(BiometricAPI.getFacialDescriptors()).rejects.toThrow("Fail");
  });

  it("llama al endpoint POST con payload y retorna LoginResponseDTO", async () => {
    const payload: VerifyFaceDescriptorDTO = {
      email: "user@test.com",
      descriptor: [0.1, 0.2, 0.3],
    };

    const loginResponse: LoginResponseDTO = {
      user: {
        id: "u1",
        firstName: "User",
        lastName: "Test",
        email: "user@test.com",
        createdAt: new Date().toString(),
        role: "ADMIN",
        isActive: true,
      },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    };

    const axiosResponse: AxiosResponse<LoginResponseDTO> = {
      data: loginResponse,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    mockedApi.post.mockResolvedValue(axiosResponse);

    const result = await BiometricAPI.verifyFaceDescriptor(payload);

    expect(mockedApi.post).toHaveBeenCalledWith(
      "/biometric/facial/verify",
      payload,
    );
    expect(result.data).toEqual(loginResponse);
  });

  it("lanza error si la API falla", async () => {
    const payload: VerifyFaceDescriptorDTO = {
      email: "user@test.com",
      descriptor: [0.1, 0.2, 0.3],
    };

    mockedApi.post.mockRejectedValue(new Error("Fail"));

    await expect(BiometricAPI.verifyFaceDescriptor(payload)).rejects.toThrow(
      "Fail",
    );
  });

  it("llama al endpoint DELETE con el ID correctamente", async () => {
    const id = "face1";

    const axiosResponse: AxiosResponse<void> = {
      data: undefined,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    mockedApi.delete.mockResolvedValue(axiosResponse);

    const result = await BiometricAPI.deleteFacialDescriptor(id);

    expect(mockedApi.delete).toHaveBeenCalledWith(
      `/biometric/facial/descriptors/${id}`,
    );
    expect(result).toEqual(axiosResponse);
  });

  it("lanza error si la API falla", async () => {
    const id = "face1";

    mockedApi.delete.mockRejectedValue(new Error("Fail"));

    await expect(BiometricAPI.deleteFacialDescriptor(id)).rejects.toThrow(
      "Fail",
    );
  });
});
