import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserAPI } from "../api/user.api";
import { api } from "../api/api";
import type {
  UserResponseDTO,
  UserListResponseDTO,
  UserProfileRequestDTO,
  ChangePasswordRequestDTO,
  UserUpdateRequestDTO,
} from "../dto/user";
import { AxiosHeaders, type AxiosResponse } from "axios";

vi.mock("../api/api");

const mockedApi = vi.mocked(api, true);

describe("UserAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAll llama a la API correctamente con query", async () => {
    const query = { search: "john", page: 1, limit: 10 };
    const userList: UserListResponseDTO = {
      users: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };

    const axiosResponse: AxiosResponse<UserListResponseDTO> = {
      data: userList,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    mockedApi.get.mockResolvedValue(axiosResponse);

    const result = await UserAPI.getAll(query);

    expect(mockedApi.get).toHaveBeenCalledWith("/users", { params: query });
    expect(result).toEqual(axiosResponse);
  });

  it("getProfile retorna UserResponseDTO correctamente", async () => {
    const user: UserResponseDTO = {
      id: "u1",
      email: "john@example.com",
      firstName: "John",
      lastName: "Doe",
      role: "user",
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const axiosResponse: AxiosResponse<UserResponseDTO> = {
      data: user,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    mockedApi.get.mockResolvedValue(axiosResponse);

    const result = await UserAPI.getProfile();

    expect(mockedApi.get).toHaveBeenCalledWith("/users/profile/me");
    expect(result).toEqual(axiosResponse);
    expect(result.data).toEqual(user);
  });

  it("updateProfile llama a la API correctamente", async () => {
    const dto: UserProfileRequestDTO = {
      firstName: "John Updated",
      preferences: { theme: "dark" },
    };

    const updatedUser: UserResponseDTO = {
      id: "u1",
      email: "john@example.com",
      firstName: dto.firstName!,
      lastName: "Doe",
      role: "user",
      isActive: true,
      createdAt: new Date().toISOString(),
      preferences: dto.preferences,
    };

    const axiosResponse: AxiosResponse<UserResponseDTO> = {
      data: updatedUser,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    mockedApi.patch.mockResolvedValue(axiosResponse);

    const result = await UserAPI.updateProfile(dto);

    expect(mockedApi.patch).toHaveBeenCalledWith("/users/profile/me", dto);
    expect(result).toEqual(axiosResponse);
    expect(result.data).toEqual(updatedUser);
  });

  it("changePassword llama a la API correctamente", async () => {
    const dto: ChangePasswordRequestDTO = {
      currentPassword: "oldpass",
      newPassword: "newpass123",
    };

    const axiosResponse: AxiosResponse = {
      data: { success: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    mockedApi.patch.mockResolvedValue(axiosResponse);

    const result = await UserAPI.changePassword(dto);

    expect(mockedApi.patch).toHaveBeenCalledWith(
      "/users/profile/change-password",
      dto,
    );
    expect(result).toEqual(axiosResponse);
  });

  it("getById retorna UserResponseDTO correctamente", async () => {
    const id = "u1";

    const user: UserResponseDTO = {
      id,
      email: "john@example.com",
      firstName: "John",
      lastName: "Doe",
      role: "user",
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const axiosResponse: AxiosResponse<UserResponseDTO> = {
      data: user,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    mockedApi.get.mockResolvedValue(axiosResponse);

    const result = await UserAPI.getById(id);

    expect(mockedApi.get).toHaveBeenCalledWith(`/users/${id}`);
    expect(result).toEqual(axiosResponse);
    expect(result.data).toEqual(user);
  });

  it("update llama a la API correctamente", async () => {
    const id = "u1";
    const dto: UserUpdateRequestDTO = { firstName: "John Updated" };

    const updatedUser: UserResponseDTO = {
      id,
      email: "john@example.com",
      firstName: dto.firstName!,
      lastName: "Doe",
      role: "user",
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const axiosResponse: AxiosResponse<UserResponseDTO> = {
      data: updatedUser,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    mockedApi.patch.mockResolvedValue(axiosResponse);

    const result = await UserAPI.update(id, dto);

    expect(mockedApi.patch).toHaveBeenCalledWith(`/users/${id}`, dto);
    expect(result).toEqual(axiosResponse);
    expect(result.data).toEqual(updatedUser);
  });

  it("create llama a la API correctamente", async () => {
    const dto = {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      role: "user",
      isActive: true,
    };

    const createdUser: UserResponseDTO = {
      id: "u2",
      ...dto,
      createdAt: new Date().toISOString(),
      email: dto.email,
    };

    const axiosResponse: AxiosResponse<UserResponseDTO> = {
      data: createdUser,
      status: 201,
      statusText: "Created",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    mockedApi.post.mockResolvedValue(axiosResponse);

    const result = await UserAPI.create(dto);

    expect(mockedApi.post).toHaveBeenCalledWith("/users", dto);
    expect(result).toEqual(axiosResponse);
    expect(result.data).toEqual(createdUser);
  });
});
