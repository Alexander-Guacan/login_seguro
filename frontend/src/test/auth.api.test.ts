import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthAPI } from "../api/auth.api";
import { api } from "../api/api";
import type {
  LoginRequestDTO,
  LoginResponseDTO,
  RefreshResponseDTO,
  RegisterRequestDTO,
} from "../dto/auth";
import { AxiosHeaders, type AxiosResponse } from "axios";
import type { UserResponseDTO } from "../dto/user";

vi.mock("../api/api");

const mockedApi = vi.mocked(api, true);

describe("AuthAPI - register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("register llama a la API correctamente", async () => {
    const dto: RegisterRequestDTO = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "password123",
    };

    const axiosResponse: AxiosResponse = {
      data: { success: true },
      status: 201,
      statusText: "Created",
      headers: {},
      config: { headers: new AxiosHeaders() },
    };

    mockedApi.post.mockResolvedValue(axiosResponse);

    const result = await AuthAPI.register(dto);

    expect(mockedApi.post).toHaveBeenCalledWith("/auth/register", dto);
    expect(result).toEqual(axiosResponse);
  });

  it("login retorna LoginResponseDTO correctamente", async () => {
    const dto: LoginRequestDTO = {
      email: "john@example.com",
      password: "password123",
    };

    const loginResponse: LoginResponseDTO = {
      user: {
        id: "u1",
        firstName: "John",
        lastName: "Doe",
        email: dto.email,
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
      config: { headers: new AxiosHeaders() },
    };

    mockedApi.post.mockResolvedValue(axiosResponse);

    const result = await AuthAPI.login(dto);

    expect(mockedApi.post).toHaveBeenCalledWith("/auth/login", dto);
    expect(result).toEqual(axiosResponse);
    expect(result.data).toEqual(loginResponse);
  });

  it("refreshSession retorna RefreshResponseDTO correctamente", async () => {
    const refreshToken = "refresh-token";

    const refreshResponse: RefreshResponseDTO = {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    };

    const axiosResponse: AxiosResponse<RefreshResponseDTO> = {
      data: refreshResponse,
      status: 200,
      statusText: "OK",
      headers: {},
      config: { headers: new AxiosHeaders() },
    };

    mockedApi.post.mockResolvedValue(axiosResponse);

    const result = await AuthAPI.refreshSession(refreshToken);

    expect(mockedApi.post).toHaveBeenCalledWith("/auth/refresh", {
      refreshToken,
    });
    expect(result).toEqual(axiosResponse);
    expect(result.data).toEqual(refreshResponse);
  });

  it("getMe retorna UserResponseDTO correctamente", async () => {
    const user: UserResponseDTO = {
      id: "u1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      createdAt: new Date().toString(),
      isActive: true,
      role: "ADMIN",
    };

    const axiosResponse: AxiosResponse<UserResponseDTO> = {
      data: user,
      status: 200,
      statusText: "OK",
      headers: {},
      config: { headers: new AxiosHeaders() },
    };

    mockedApi.get.mockResolvedValue(axiosResponse);

    const result = await AuthAPI.getMe();

    expect(mockedApi.get).toHaveBeenCalledWith("/auth/me");
    expect(result).toEqual(axiosResponse);
    expect(result.data).toEqual(user);
  });

  it("logout llama a la API correctamente", async () => {
    const refreshToken = "refresh-token";

    const axiosResponse: AxiosResponse = {
      data: { success: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config: { headers: new AxiosHeaders() },
    };

    mockedApi.post.mockResolvedValue(axiosResponse);

    const result = await AuthAPI.logout(refreshToken);

    expect(mockedApi.post).toHaveBeenCalledWith("/auth/logout", {
      refreshToken,
    });
    expect(result).toEqual(axiosResponse);
  });
});
