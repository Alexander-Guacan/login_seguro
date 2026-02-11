import { describe, it, expect, vi, beforeEach } from "vitest";
import { AxiosHeaders, type AxiosResponse } from "axios";

import { AuthService } from "../services/auth.service";
import { AuthAPI } from "../api/auth.api";
import { BiometricService } from "../services/biometric.service";
import { UserMapper } from "../mappers/user.mapper";
import { UserRole } from "../enums/userRole.enum";
import type {
  LoginRequestDTO,
  RegisterRequestDTO,
  RefreshResponseDTO,
  LoginResponseDTO,
} from "../dto/auth";
import type { UserResponseDTO } from "../dto/user";

vi.mock("../api/auth.api");
vi.mock("../services/biometric.service");
vi.mock("../mappers/user.mapper", () => ({
  UserMapper: {
    toEntity: vi.fn((user) => ({
      ...user,
      fullName: `${user.firstName} ${user.lastName}`,
    })),
  },
}));

const mockedAuthAPI = vi.mocked(AuthAPI);
const mockedBiometric = vi.mocked(BiometricService);
const mockedUserMapper = vi.mocked(UserMapper);

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("register llama a AuthAPI.register con los datos correctos", async () => {
    const dto: RegisterRequestDTO = {
      email: "test@test.com",
      password: "123456",
      firstName: "john",
      lastName: "doe",
    };
    mockedAuthAPI.register.mockResolvedValue({} as AxiosResponse<void>);

    await AuthService.register(dto);

    expect(mockedAuthAPI.register).toHaveBeenCalledWith(dto);
  });

  it("register lanza error si falla", async () => {
    const dto: RegisterRequestDTO = {
      email: "test@test.com",
      password: "123456",
      firstName: "john",
      lastName: "doe",
    };
    mockedAuthAPI.register.mockRejectedValue(new Error("Duplicado"));

    await expect(AuthService.register(dto)).rejects.toThrow(
      "No se pudo registrar al usuario, el correo usado ya esta registrado.",
    );
  });

  it("login llama a AuthAPI.login y retorna usuario con tokens", async () => {
    const dto: LoginRequestDTO = { email: "test@test.com", password: "123456" };
    const apiResponse: AxiosResponse<LoginResponseDTO> = {
      data: {
        user: {
          id: "1",
          firstName: "Juan",
          lastName: "Perez",
          role: UserRole.ADMIN,
          createdAt: new Date().toString(),
          email: "johndoe@gmail.com",
          isActive: true,
        },
        accessToken: "access",
        refreshToken: "refresh",
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };
    mockedAuthAPI.login.mockResolvedValue(apiResponse);

    const result = await AuthService.login(dto);

    expect(mockedAuthAPI.login).toHaveBeenCalledWith({
      email: "test@test.com",
      password: "123456",
    });
    expect(mockedUserMapper.toEntity).toHaveBeenCalledWith(
      apiResponse.data.user,
    );
    expect(result).toEqual({
      user: { ...apiResponse.data.user, fullName: "Juan Perez" },
      accessToken: "access",
      refreshToken: "refresh",
    });
  });

  it("login lanza error si falla", async () => {
    const dto: LoginRequestDTO = { email: "test@test.com", password: "123456" };
    mockedAuthAPI.login.mockRejectedValue(new Error("Fail"));

    await expect(AuthService.login(dto)).rejects.toThrow(
      "Correo o contraseña incorrectos",
    );
  });

  it("credentialLogin llama a BiometricService.verifyCredential y retorna usuario", async () => {
    const email = "test@test.com";
    const apiResponse = {
      user: {
        id: "1",
        firstName: "Juan",
        lastName: "Perez",
        role: UserRole.CLIENT,
        email: "johndoe@gmail.com",
        isActive: true,
        createdAt: new Date().toString(),
      },
      accessToken: "access",
      refreshToken: "refresh",
    };
    mockedBiometric.verifyCredential.mockResolvedValue(apiResponse);

    const result = await AuthService.credentialLogin(email);

    expect(mockedBiometric.verifyCredential).toHaveBeenCalledWith(email.trim());
    expect(mockedUserMapper.toEntity).toHaveBeenCalledWith(apiResponse.user);
    expect(result.accessToken).toBe("access");
    expect(result.refreshToken).toBe("refresh");
  });

  it("credentialLogin lanza error si falla", async () => {
    mockedBiometric.verifyCredential.mockRejectedValue(new Error("Fail"));

    await expect(AuthService.credentialLogin("test@test.com")).rejects.toThrow(
      "No se pudo iniciar sesión por este método.",
    );
  });

  it("faceLogin llama a BiometricService.verifyFaceDescriptor y retorna usuario", async () => {
    const email = "test@test.com";
    const descriptor = [0.1, 0.2, 0.3];
    const apiResponse = {
      user: {
        id: "1",
        firstName: "Juan",
        lastName: "Perez",
        role: UserRole.CLIENT,
        email: "johndoe@gmail.com",
        isActive: true,
        createdAt: new Date().toString(),
      },
      accessToken: "access",
      refreshToken: "refresh",
    };
    mockedBiometric.verifyFaceDescriptor.mockResolvedValue(apiResponse);

    const result = await AuthService.faceLogin(email, descriptor);

    expect(mockedBiometric.verifyFaceDescriptor).toHaveBeenCalledWith(
      email.trim(),
      descriptor,
    );
    expect(mockedUserMapper.toEntity).toHaveBeenCalledWith(apiResponse.user);
    expect(result.accessToken).toBe("access");
    expect(result.refreshToken).toBe("refresh");
  });

  it("faceLogin lanza error si falla", async () => {
    mockedBiometric.verifyFaceDescriptor.mockRejectedValue(new Error("Fail"));

    await expect(
      AuthService.faceLogin("test@test.com", [0.1, 0.2]),
    ).rejects.toThrow("No se pudo iniciar sesión por este método.");
  });

  it("getMe llama a AuthAPI.getMe y retorna usuario", async () => {
    const apiResponse: AxiosResponse<UserResponseDTO> = {
      data: {
        id: "1",
        firstName: "Juan",
        lastName: "Perez",
        role: UserRole.CLIENT,
        email: "johndoe@gmail.com",
        isActive: true,
        createdAt: new Date().toString(),
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };
    mockedAuthAPI.getMe.mockResolvedValue(apiResponse);

    const result = await AuthService.getMe();

    expect(mockedAuthAPI.getMe).toHaveBeenCalled();
    expect(mockedUserMapper.toEntity).toHaveBeenCalledWith(apiResponse.data);
    expect(result.fullName).toBe("Juan Perez");
  });

  it("getMe lanza error si falla", async () => {
    mockedAuthAPI.getMe.mockRejectedValue(new Error("Fail"));

    await expect(AuthService.getMe()).rejects.toThrow("No ha iniciado sesión");
  });

  it("logout llama a AuthAPI.logout con refreshToken", async () => {
    mockedAuthAPI.logout.mockResolvedValue({} as AxiosResponse<void>);
    await AuthService.logout("refresh-token");

    expect(mockedAuthAPI.logout).toHaveBeenCalledWith("refresh-token");
  });

  it("logout lanza error si falla", async () => {
    mockedAuthAPI.logout.mockRejectedValue(new Error("Fail"));

    await expect(AuthService.logout("refresh-token")).rejects.toThrow(
      "No se pudo cerrar sesión",
    );
  });

  it("refreshSession llama a AuthAPI.refreshSession y retorna datos", async () => {
    const apiResponse: AxiosResponse<RefreshResponseDTO> = {
      data: { accessToken: "access", refreshToken: "refresh" },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };
    mockedAuthAPI.refreshSession.mockResolvedValue(apiResponse);

    const result = await AuthService.refreshSession("refresh-token");

    expect(mockedAuthAPI.refreshSession).toHaveBeenCalledWith("refresh-token");
    expect(result).toEqual(apiResponse.data);
  });

  it("refreshSession lanza error si falla", async () => {
    mockedAuthAPI.refreshSession.mockRejectedValue(new Error("Fail"));

    await expect(AuthService.refreshSession("refresh-token")).rejects.toThrow(
      "Sesión inválida o caducada. Inicie sesión nuevamente.",
    );
  });

  it("refreshSession reutiliza la promesa si se llama dos veces seguidas", async () => {
    const apiResponse: AxiosResponse<RefreshResponseDTO> = {
      data: { accessToken: "access", refreshToken: "refresh" },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };
    mockedAuthAPI.refreshSession.mockResolvedValue(apiResponse);

    const promise1 = AuthService.refreshSession("refresh-token");
    const promise2 = AuthService.refreshSession("refresh-token");

    expect(promise1).toStrictEqual(promise2);
    const result = await promise1;
    expect(result).toEqual(apiResponse.data);
  });
});
