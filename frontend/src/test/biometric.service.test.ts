import { describe, it, expect, vi, beforeEach } from "vitest";
import { BiometricService } from "../services/biometric.service";
import { BiometricAPI } from "../api/biometric.api";
import { BiometricMapper } from "../mappers/biometric.mapper";
import type {
  BiometricCredentialResponseDTO,
  FaceDescriptorResponseDTO,
  VerifyRegistrationResponseDTO,
} from "../dto/biometric";
import { BiometricCredential, BiometricDescriptor } from "../models/biometric";
import { AxiosHeaders, type AxiosResponse } from "axios";
import {
  bufferToBase64URLString,
  startAuthentication,
  startRegistration,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import type { LoginResponseDTO } from "../dto/auth";

vi.mock("../api/biometric.api");
vi.mock("@simplewebauthn/browser");

const mockedBiometricAPI = vi.mocked(BiometricAPI);
const mockedStartRegistration = vi.mocked(startRegistration);
const mockedStartAuthentication = vi.mocked(startAuthentication);

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

  it("llama a BiometricAPI.deleteCredential con el id correcto", async () => {
    const id = "cred123";

    mockedBiometricAPI.deleteCredential.mockResolvedValue(
      {} as AxiosResponse<void>,
    );

    await BiometricService.deleteCredential(id);

    expect(mockedBiometricAPI.deleteCredential).toHaveBeenCalledWith(id);
  });

  it("lanza error si BiometricAPI.deleteCredential falla", async () => {
    const id = "cred123";

    mockedBiometricAPI.deleteCredential.mockImplementation(() => {
      throw new Error("Fail");
    });

    await expect(BiometricService.deleteCredential(id)).rejects.toThrow(
      "La credencial que intenta borrar no existe",
    );
  });

  it("llama a BiometricAPI.deleteFacialDescriptor con el id correcto", async () => {
    const id = "face123";

    mockedBiometricAPI.deleteFacialDescriptor.mockResolvedValue(
      {} as AxiosResponse<void>,
    );

    await BiometricService.deleteFacialDescriptor(id);

    expect(mockedBiometricAPI.deleteFacialDescriptor).toHaveBeenCalledWith(id);
  });

  it("lanza error si BiometricAPI.deleteFacialDescriptor falla", async () => {
    const id = "face123";

    mockedBiometricAPI.deleteFacialDescriptor.mockImplementation(() => {
      throw new Error("Fail");
    });

    await expect(BiometricService.deleteFacialDescriptor(id)).rejects.toThrow(
      "No se pudo eliminar este método de autenticación. Intentelo más tarde.",
    );
  });

  it("registra correctamente una nueva credencial WebAuthn", async () => {
    const deviceName = "Mi Laptop";

    const registrationOptions: PublicKeyCredentialCreationOptionsJSON = {
      rp: { name: "Test RP", id: "test.com" },
      user: { id: "dXNlcmlk", name: "user", displayName: "User" },
      challenge: "abc123",
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
    };

    mockedBiometricAPI.generateRegistrationOptions.mockResolvedValue({
      data: registrationOptions,
    } as AxiosResponse<PublicKeyCredentialCreationOptionsJSON>);

    const credential: RegistrationResponseJSON = {
      id: "cred1",
      rawId: new Uint8Array([1, 2, 3]).toString(),
      response: {
        attestationObject: bufferToBase64URLString(new ArrayBuffer(1)),
        clientDataJSON: bufferToBase64URLString(new ArrayBuffer(1)),
      },
      type: "public-key",
      clientExtensionResults: {},
    };
    mockedStartRegistration.mockResolvedValue(credential);

    mockedBiometricAPI.verifyRegistration.mockResolvedValue({
      data: {
        id: "1",
        credentialID: "cred1",
        deviceName,
        credentialDeviceType: "platform",
        transports: ["usb"],
        createdAt: "2026-01-01T00:00:00Z",
        lastUsedAt: "2026-01-01T00:00:00Z",
      },
    } as AxiosResponse<VerifyRegistrationResponseDTO>);

    await BiometricService.registerCredential(deviceName);

    expect(mockedBiometricAPI.generateRegistrationOptions).toHaveBeenCalled();
    expect(mockedStartRegistration).toHaveBeenCalledWith({
      optionsJSON: registrationOptions,
    });
    expect(mockedBiometricAPI.verifyRegistration).toHaveBeenCalledWith({
      credential,
      deviceName,
    });
  });

  it("lanza error si startRegistration falla", async () => {
    const deviceName = "Mi Laptop";
    mockedBiometricAPI.generateRegistrationOptions.mockResolvedValue({
      data: {
        rp: { name: "Test RP", id: "test.com" },
        user: { id: "dXNlcmlk", name: "user", displayName: "User" },
        challenge: "abc123",
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      } as PublicKeyCredentialCreationOptionsJSON,
    } as AxiosResponse<PublicKeyCredentialCreationOptionsJSON>);

    mockedStartRegistration.mockRejectedValue(new Error("Fallo WebAuthn"));

    await expect(
      BiometricService.registerCredential(deviceName),
    ).rejects.toThrow("Fallo WebAuthn");
  });

  it("retorna datos de login exitoso", async () => {
    const email = "test@test.com";

    const options: PublicKeyCredentialRequestOptionsJSON = {
      challenge: "abc123",
      allowCredentials: [{ id: "cred1", type: "public-key" }],
    };

    const credential: AuthenticationResponseJSON = {
      id: "cred1",
      rawId: new Uint8Array([1, 2, 3]).toString(),
      response: {
        authenticatorData: bufferToBase64URLString(new ArrayBuffer(1)),
        clientDataJSON: bufferToBase64URLString(new ArrayBuffer(1)),
        signature: bufferToBase64URLString(new ArrayBuffer(1)),
        userHandle: undefined,
      },
      type: "public-key",
      clientExtensionResults: {},
    };

    const loginResponse: LoginResponseDTO = {
      user: {
        id: "u1",
        firstName: "Test",
        lastName: "User",
        email,
        createdAt: new Date().toString(),
        isActive: true,
        role: "ADMIN",
      },
      accessToken: "token",
      refreshToken: "refresh",
    };

    mockedBiometricAPI.generateAuthenticationOptions.mockResolvedValue({
      data: options,
    } as AxiosResponse<PublicKeyCredentialRequestOptionsJSON>);

    mockedStartAuthentication.mockResolvedValue(credential);

    mockedBiometricAPI.verifyCredential.mockResolvedValue({
      data: loginResponse,
    } as AxiosResponse<LoginResponseDTO>);

    const result = await BiometricService.verifyCredential(email);

    expect(result).toEqual(loginResponse);
    expect(
      mockedBiometricAPI.generateAuthenticationOptions,
    ).toHaveBeenCalledWith(email);
    expect(mockedStartAuthentication).toHaveBeenCalledWith({
      optionsJSON: options,
    });
    expect(mockedBiometricAPI.verifyCredential).toHaveBeenCalledWith({
      email,
      credential,
    });
  });

  it("lanza error si no hay allowCredentials", async () => {
    const email = "test@test.com";

    mockedBiometricAPI.generateAuthenticationOptions.mockResolvedValue({
      data: {
        challenge: "abc123",
        allowCredentials: [],
      } as PublicKeyCredentialRequestOptionsJSON,
    } as AxiosResponse<PublicKeyCredentialRequestOptionsJSON>);

    await expect(BiometricService.verifyCredential(email)).rejects.toThrow(
      "El usuario no cuenta con este método de autenticación.",
    );
  });

  it("lanza error si startAuthentication falla", async () => {
    const email = "test@test.com";

    const options: PublicKeyCredentialRequestOptionsJSON = {
      challenge: "abc123",
      allowCredentials: [{ id: "cred1", type: "public-key" }],
    };

    mockedBiometricAPI.generateAuthenticationOptions.mockResolvedValue({
      data: options,
    } as AxiosResponse<PublicKeyCredentialRequestOptionsJSON>);

    mockedStartAuthentication.mockRejectedValue(new Error("Fallo WebAuthn"));

    await expect(BiometricService.verifyCredential(email)).rejects.toThrow(
      "Fallo WebAuthn",
    );
  });

  it("registra un descriptor facial correctamente", async () => {
    const descriptor = [0.1, 0.2, 0.3];
    const deviceName = "Mi Laptop";

    const dto: FaceDescriptorResponseDTO = {
      id: "face1",
      label: deviceName,
      deviceInfo: "Macbook",
      createdAt: "2026-01-01T00:00:00Z",
      lastUsedAt: "2026-01-02T00:00:00Z",
    };

    const entity: BiometricDescriptor = new BiometricDescriptor({
      id: dto.id,
      deviceName: dto.label ?? "",
      deviceInfo: dto.deviceInfo ?? "",
      createdAt: new Date(dto.createdAt),
      lastUsedAt: new Date(dto.lastUsedAt),
    });

    mockedBiometricAPI.registerFaceDescriptor.mockResolvedValue({
      data: dto,
    } as AxiosResponse<FaceDescriptorResponseDTO>);

    const spy = vi
      .spyOn(BiometricMapper, "toDescriptorEntity")
      .mockReturnValue(entity);

    const result = await BiometricService.registerFaceDescripor(
      descriptor,
      deviceName,
    );

    expect(mockedBiometricAPI.registerFaceDescriptor).toHaveBeenCalledWith({
      descriptor,
      label: deviceName,
      deviceInfo: "",
    });
    expect(spy).toHaveBeenCalledWith(dto);
    expect(result).toEqual(entity);

    spy.mockRestore();
  });

  it("lanza error si falla la API", async () => {
    const descriptor = [0.1, 0.2, 0.3];
    const deviceName = "Mi Laptop";

    mockedBiometricAPI.registerFaceDescriptor.mockRejectedValue(
      new Error("Fail"),
    );

    await expect(
      BiometricService.registerFaceDescripor(descriptor, deviceName),
    ).rejects.toThrow("No se pudo registrar al usuario. Intentelo más tarde.");
  });

  it("verifica un descriptor facial exitosamente", async () => {
    const email = "test@test.com";
    const descriptor = [0.1, 0.2, 0.3];

    const loginResponse: LoginResponseDTO = {
      user: {
        id: "u1",
        firstName: "Test",
        lastName: "User",
        email,
        createdAt: new Date().toString(),
        isActive: true,
        role: "ADMIN",
      },
      accessToken: "token",
      refreshToken: "refresh",
    };

    mockedBiometricAPI.verifyFaceDescriptor.mockResolvedValue({
      data: loginResponse,
    } as AxiosResponse<LoginResponseDTO>);

    const result = await BiometricService.verifyFaceDescriptor(
      email,
      descriptor,
    );

    expect(mockedBiometricAPI.verifyFaceDescriptor).toHaveBeenCalledWith({
      email,
      descriptor,
    });
    expect(result).toEqual(loginResponse);
  });

  it("lanza error si falla el API", async () => {
    const email = "test@test.com";
    const descriptor = [0.1, 0.2, 0.3];

    mockedBiometricAPI.verifyFaceDescriptor.mockRejectedValue(
      new Error("Fail"),
    );

    await expect(
      BiometricService.verifyFaceDescriptor(email, descriptor),
    ).rejects.toThrow(
      "No se pudo usar este método para iniciar sesión. Asegurese de tener un método de autenticación válido.",
    );
  });

  it("deleteCredential llama a la API correctamente", async () => {
    const id = "cred1";

    mockedBiometricAPI.deleteCredential.mockResolvedValue(
      {} as AxiosResponse<void>,
    );

    await BiometricService.deleteCredential(id);

    expect(mockedBiometricAPI.deleteCredential).toHaveBeenCalledWith(id);
  });

  it("deleteCredential lanza error si falla la API", async () => {
    const id = "cred1";

    mockedBiometricAPI.deleteCredential.mockImplementation(() => {
      throw new Error("Fail");
    });

    await expect(BiometricService.deleteCredential(id)).rejects.toThrow(
      "La credencial que intenta borrar no existe",
    );
  });

  it("deleteFacialDescriptor llama a la API correctamente", async () => {
    const id = "face1";

    mockedBiometricAPI.deleteFacialDescriptor.mockResolvedValue(
      {} as AxiosResponse<void>,
    );

    await BiometricService.deleteFacialDescriptor(id);

    expect(mockedBiometricAPI.deleteFacialDescriptor).toHaveBeenCalledWith(id);
  });

  it("deleteFacialDescriptor lanza error si falla la API", async () => {
    const id = "face1";

    mockedBiometricAPI.deleteFacialDescriptor.mockImplementation(() => {
      throw new Error("Fail");
    });

    await expect(BiometricService.deleteFacialDescriptor(id)).rejects.toThrow(
      "No se pudo eliminar este método de autenticación. Intentelo más tarde.",
    );
  });

  it("registra correctamente un credential", async () => {
    const deviceName = "Mi dispositivo";

    const registrationOptions = { challenge: "abc123" };
    mockedBiometricAPI.generateRegistrationOptions.mockResolvedValue({
      data: registrationOptions,
    } as AxiosResponse<PublicKeyCredentialCreationOptionsJSON>);

    const webauthnResponse = {
      id: "cred1",
      rawId: "raw",
      response: {},
      type: "public-key",
    };
    mockedStartRegistration.mockResolvedValue(
      webauthnResponse as RegistrationResponseJSON,
    );

    mockedBiometricAPI.verifyRegistration.mockResolvedValue({
      data: { id: "cred1" },
    } as AxiosResponse<VerifyRegistrationResponseDTO>);

    await BiometricService.registerCredential(deviceName);

    expect(mockedBiometricAPI.generateRegistrationOptions).toHaveBeenCalled();
    expect(mockedStartRegistration).toHaveBeenCalledWith({
      optionsJSON: registrationOptions,
    });
    expect(mockedBiometricAPI.verifyRegistration).toHaveBeenCalledWith({
      credential: webauthnResponse,
      deviceName,
    });
  });

  it("lanza error si la API falla", async () => {
    mockedBiometricAPI.generateRegistrationOptions.mockRejectedValue(
      new Error("Fail"),
    );

    await expect(
      BiometricService.registerCredential("Mi dispositivo"),
    ).rejects.toThrow("Fail");
  });

  it("verifica correctamente el credential y retorna LoginResponseDTO", async () => {
    const email = "user@test.com";

    const options: PublicKeyCredentialRequestOptionsJSON = {
      challenge: "abc123",
      allowCredentials: [{ id: "cred1", type: "public-key" }],
    };
    mockedBiometricAPI.generateAuthenticationOptions.mockResolvedValue({
      data: options,
    } as AxiosResponse<PublicKeyCredentialRequestOptionsJSON>);

    const webauthnResponse = {
      id: "cred1",
      rawId: "raw",
      response: {},
      type: "public-key",
    } as AuthenticationResponseJSON;
    mockedStartAuthentication.mockResolvedValue(webauthnResponse);

    const loginResponse: LoginResponseDTO = {
      user: {
        id: "u1",
        firstName: "User",
        lastName: "Test",
        email,
        createdAt: new Date().toString(),
        isActive: true,
        role: "ADMIN",
      },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    };
    mockedBiometricAPI.verifyCredential.mockResolvedValue({
      data: loginResponse,
    } as AxiosResponse<LoginResponseDTO>);

    const result = await BiometricService.verifyCredential(email);

    expect(
      mockedBiometricAPI.generateAuthenticationOptions,
    ).toHaveBeenCalledWith(email);
    expect(mockedStartAuthentication).toHaveBeenCalledWith({
      optionsJSON: options,
    });
    expect(mockedBiometricAPI.verifyCredential).toHaveBeenCalledWith({
      email,
      credential: webauthnResponse,
    });
    expect(result).toEqual(loginResponse);
  });

  it("lanza error si no hay allowCredentials", async () => {
    const email = "user@test.com";

    const options: PublicKeyCredentialRequestOptionsJSON = {
      challenge: "abc123",
    };
    mockedBiometricAPI.generateAuthenticationOptions.mockResolvedValue({
      data: options,
    } as AxiosResponse<PublicKeyCredentialRequestOptionsJSON>);

    await expect(BiometricService.verifyCredential(email)).rejects.toThrow(
      "El usuario no cuenta con este método de autenticación.",
    );
  });

  it("lanza error si la API falla", async () => {
    const email = "user@test.com";
    mockedBiometricAPI.generateAuthenticationOptions.mockRejectedValue(
      new Error("Fail"),
    );

    await expect(BiometricService.verifyCredential(email)).rejects.toThrow(
      "Fail",
    );
  });

  it("registra un descriptor facial correctamente", async () => {
    const descriptor = [0.1, 0.2, 0.3];
    const deviceName = "Macbook";

    const dto: FaceDescriptorResponseDTO = {
      id: "face1",
      label: deviceName,
      deviceInfo: "Macbook",
      createdAt: "2026-01-01T00:00:00Z",
      lastUsedAt: "2026-01-02T00:00:00Z",
    };

    const axiosResponse: AxiosResponse<FaceDescriptorResponseDTO> = {
      data: dto,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    mockedBiometricAPI.registerFaceDescriptor.mockResolvedValue(axiosResponse);

    // Spy en el mapper
    const spyMapper = vi.spyOn(BiometricMapper, "toDescriptorEntity");
    const mappedEntity = new BiometricDescriptor({
      id: dto.id,
      deviceName: dto.label ?? "",
      deviceInfo: dto.deviceInfo ?? "",
      createdAt: new Date(dto.createdAt),
      lastUsedAt: new Date(dto.lastUsedAt),
    });
    spyMapper.mockReturnValue(mappedEntity);

    const result = await BiometricService.registerFaceDescripor(
      descriptor,
      deviceName,
    );

    expect(mockedBiometricAPI.registerFaceDescriptor).toHaveBeenCalledWith({
      descriptor,
      deviceInfo: "",
      label: deviceName,
    });
    expect(result).toBeInstanceOf(BiometricDescriptor);
    expect(result).toEqual(mappedEntity);
  });

  it("lanza error si la API falla", async () => {
    const descriptor = [0.1, 0.2, 0.3];
    const deviceName = "Macbook";

    mockedBiometricAPI.registerFaceDescriptor.mockRejectedValue(
      new Error("Fail"),
    );

    await expect(
      BiometricService.registerFaceDescripor(descriptor, deviceName),
    ).rejects.toThrow("No se pudo registrar al usuario. Intentelo más tarde.");
  });

  it("retorna un array de BiometricDescriptor correctamente", async () => {
    const dtos: FaceDescriptorResponseDTO[] = [
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
      data: dtos,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    mockedBiometricAPI.getFacialDescriptors.mockResolvedValue(axiosResponse);

    // Spy en el mapper
    const spyMapper = vi.spyOn(BiometricMapper, "toDescriptorEntity");
    const mappedEntities = dtos.map(
      (dto) =>
        new BiometricDescriptor({
          id: dto.id,
          deviceName: dto.label ?? "",
          deviceInfo: dto.deviceInfo ?? "",
          createdAt: new Date(dto.createdAt),
          lastUsedAt: new Date(dto.lastUsedAt),
        }),
    );
    spyMapper.mockImplementation(
      (dto: FaceDescriptorResponseDTO) =>
        mappedEntities.find((e) => e.id === dto.id)!,
    );

    const result = await BiometricService.getFacialDescriptors();

    expect(mockedBiometricAPI.getFacialDescriptors).toHaveBeenCalled();
    expect(result.length).toBe(2);
    expect(result[0]).toBeInstanceOf(BiometricDescriptor);
    expect(result).toEqual(mappedEntities);
  });

  it("lanza error si la API falla", async () => {
    mockedBiometricAPI.getFacialDescriptors.mockRejectedValue(
      new Error("Fail"),
    );

    await expect(BiometricService.getFacialDescriptors()).rejects.toThrow(
      "No se pudieron obtener los Face IDs del usuario. Intentelo más tarde.",
    );
  });

  it("verifica un descriptor facial correctamente y retorna LoginResponseDTO", async () => {
    const email = "user@test.com";
    const descriptor = [0.1, 0.2, 0.3];

    const loginResponse: LoginResponseDTO = {
      user: {
        id: "u1",
        firstName: "User",
        lastName: "Test",
        email,
        createdAt: new Date().toString(),
        isActive: true,
        role: "ADMIN",
      },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    };

    mockedBiometricAPI.verifyFaceDescriptor.mockResolvedValue({
      data: loginResponse,
    } as AxiosResponse<LoginResponseDTO>);

    const result = await BiometricService.verifyFaceDescriptor(
      email,
      descriptor,
    );

    expect(mockedBiometricAPI.verifyFaceDescriptor).toHaveBeenCalledWith({
      email,
      descriptor,
    });
    expect(result).toEqual(loginResponse);
  });

  it("lanza error si la API falla", async () => {
    const email = "user@test.com";
    const descriptor = [0.1, 0.2, 0.3];

    mockedBiometricAPI.verifyFaceDescriptor.mockRejectedValue(
      new Error("Fail"),
    );

    await expect(
      BiometricService.verifyFaceDescriptor(email, descriptor),
    ).rejects.toThrow(
      "No se pudo usar este método para iniciar sesión. Asegurese de tener un método de autenticación válido.",
    );
  });
});
