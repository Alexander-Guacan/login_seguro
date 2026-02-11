import { describe, it, expect, vi, beforeEach } from "vitest";
import { AxiosHeaders, type AxiosResponse } from "axios";

import { UserService } from "../services/user.service";
import { UserAPI } from "../api/user.api";
import { UserMapper } from "../mappers/user.mapper";
import { UserProfileMapper } from "../mappers/userProfile.mapper";
import { User } from "../models/user";
import { UserRole } from "../enums/userRole.enum";
import type {
  ChangePasswordRequestDTO,
  UserListResponseDTO,
  UserResponseDTO,
} from "../dto/user";

vi.mock("../api/user.api");
vi.mock("../mappers/user.mapper");
vi.mock("../mappers/userProfile.mapper");

const mockedUserAPI = vi.mocked(UserAPI);
const mockedUserMapper = vi.mocked(UserMapper);
const mockedUserProfileMapper = vi.mocked(UserProfileMapper);

const exampleUser = new User({
  id: "1",
  email: "test@test.com",
  firstName: "Juan",
  lastName: "Perez",
  role: UserRole.ADMIN,
  isActive: true,
});

describe("UserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAll retorna usuarios correctamente", async () => {
    const apiResponse: AxiosResponse<UserListResponseDTO> = {
      data: {
        users: [
          {
            id: "1",
            createdAt: new Date().toString(),
            email: "johndoe@gmail.com",
            firstName: "john",
            lastName: "doe",
            isActive: true,
            role: "ADMIN",
          },
          {
            id: "1",
            createdAt: new Date().toString(),
            email: "janedoe@gmail.com",
            firstName: "jane",
            lastName: "doe",
            isActive: true,
            role: "CLIENT",
          },
        ],
        limit: 10,
        page: 1,
        total: 2,
        totalPages: 1,
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };
    mockedUserAPI.getAll.mockResolvedValue(apiResponse);

    const result = await UserService.getAll();

    expect(mockedUserAPI.getAll).toHaveBeenCalled();
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("getAll lanza error si falla", async () => {
    mockedUserAPI.getAll.mockRejectedValue(new Error("Fail"));
    await expect(UserService.getAll()).rejects.toThrow(
      "No se pudo obtener los usuarios. Asegurate de que tienes los permisos requeridos.",
    );
  });

  it("getProfile retorna usuario", async () => {
    const apiResponse: AxiosResponse<UserResponseDTO> = {
      data: {
        id: "1",
        email: "test@test.com",
        firstName: "Juan",
        lastName: "Perez",
        role: UserRole.ADMIN,
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
    mockedUserAPI.getProfile.mockResolvedValue(apiResponse);
    mockedUserMapper.toEntity.mockReturnValue(exampleUser);

    const result = await UserService.getProfile();

    expect(mockedUserAPI.getProfile).toHaveBeenCalled();
    expect(result).toBe(exampleUser);
  });

  it("getProfile lanza error si falla", async () => {
    mockedUserAPI.getProfile.mockRejectedValue(new Error("Fail"));
    await expect(UserService.getProfile()).rejects.toThrow(
      "No se pudo obtener el perfil del usuario. Vuelva a iniciar sesión.",
    );
  });

  it("updateProfile llama a UserAPI.updateProfile y retorna usuario actualizado", async () => {
    mockedUserProfileMapper.toDTO.mockReturnValue({ ...exampleUser });
    mockedUserAPI.updateProfile.mockResolvedValue({
      data: {
        id: "1",
        email: "test@test.com",
        firstName: "Juan",
        lastName: "Perez",
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date().toString(),
      },
    } as AxiosResponse<UserResponseDTO>);
    mockedUserMapper.toEntity.mockReturnValue(exampleUser);

    const result = await UserService.updateProfile(exampleUser);

    expect(mockedUserProfileMapper.toDTO).toHaveBeenCalledWith(exampleUser);
    expect(mockedUserAPI.updateProfile).toHaveBeenCalled();
    expect(result).toBe(exampleUser);
  });

  it("updateProfile lanza error si falla", async () => {
    mockedUserAPI.updateProfile.mockRejectedValue(new Error("Fail"));
    mockedUserProfileMapper.toDTO.mockReturnValue({ ...exampleUser });
    await expect(UserService.updateProfile(exampleUser)).rejects.toThrow(
      "No se pudo actualizar el perfil. Intentalo más tarde.",
    );
  });

  it("changePassword llama a UserAPI.changePassword correctamente", async () => {
    const dto: ChangePasswordRequestDTO = {
      currentPassword: "old",
      newPassword: "new",
    };
    mockedUserAPI.changePassword.mockResolvedValue({} as AxiosResponse<void>);

    await UserService.changePassword(dto);
    expect(mockedUserAPI.changePassword).toHaveBeenCalledWith({
      ...dto,
      newPassword: "new",
    });
  });

  it("changePassword lanza error si falla", async () => {
    const dto: ChangePasswordRequestDTO = {
      currentPassword: "old",
      newPassword: "new",
    };
    mockedUserAPI.changePassword.mockRejectedValue(new Error("Fail"));

    await expect(UserService.changePassword(dto)).rejects.toThrow(
      "La contraseña no pudo ser cambiada. Contraseña actual incorrecta.",
    );
  });

  it("getById retorna usuario", async () => {
    mockedUserAPI.getById.mockResolvedValue({
      data: {
        id: "1",
        email: "test@test.com",
        firstName: "Juan",
        lastName: "Perez",
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date().toString(),
      },
    } as AxiosResponse<UserResponseDTO>);
    mockedUserMapper.toEntity.mockReturnValue(exampleUser);

    const result = await UserService.getById("1");
    expect(mockedUserAPI.getById).toHaveBeenCalledWith("1");
    expect(result).toBe(exampleUser);
  });

  it("getById lanza error si falla", async () => {
    mockedUserAPI.getById.mockRejectedValue(new Error("Fail"));
    await expect(UserService.getById("1")).rejects.toThrow(
      "Usuario no encontrado. Verfique que las credenciales son correctas.",
    );
  });

  it("update llama a UserAPI.update y retorna usuario actualizado", async () => {
    mockedUserMapper.toUpdateDTO.mockReturnValue({ ...exampleUser });
    mockedUserAPI.update.mockResolvedValue({
      data: {
        id: "1",
        email: "test@test.com",
        firstName: "Juan",
        lastName: "Perez",
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date().toString(),
      },
    } as AxiosResponse<UserResponseDTO>);
    mockedUserMapper.toEntity.mockReturnValue(exampleUser);

    const result = await UserService.update("1", exampleUser, "newpass");

    expect(mockedUserMapper.toUpdateDTO).toHaveBeenCalledWith(
      exampleUser,
      "newpass",
    );
    expect(mockedUserAPI.update).toHaveBeenCalled();
    expect(result).toBe(exampleUser);
  });

  it("update lanza error si falla", async () => {
    mockedUserMapper.toUpdateDTO.mockReturnValue({ ...exampleUser });
    mockedUserAPI.update.mockRejectedValue(new Error("Fail"));

    await expect(
      UserService.update("1", exampleUser, "newpass"),
    ).rejects.toThrow(
      "El usuario no pudo ser actualizado. Intentelo más tarde.",
    );
  });

  it("create llama a UserAPI.create y retorna usuario creado", async () => {
    mockedUserMapper.toDTO.mockReturnValue({
      ...exampleUser,
      password: "123456",
    });
    mockedUserAPI.create.mockResolvedValue({
      data: {
        id: "1",
        email: "test@test.com",
        firstName: "Juan",
        lastName: "Perez",
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date().toString(),
      },
    } as AxiosResponse<UserResponseDTO>);
    mockedUserMapper.toEntity.mockReturnValue(exampleUser);

    const result = await UserService.create(exampleUser, "123456");

    expect(mockedUserMapper.toDTO).toHaveBeenCalledWith(exampleUser, "123456");
    expect(mockedUserAPI.create).toHaveBeenCalled();
    expect(result).toBe(exampleUser);
  });

  it("create lanza error si falla", async () => {
    mockedUserMapper.toDTO.mockReturnValue({
      ...exampleUser,
      password: "123456",
    });
    mockedUserAPI.create.mockRejectedValue(new Error("Fail"));

    await expect(UserService.create(exampleUser, "123456")).rejects.toThrow(
      "El usuario no pudo ser registrado: el correo ya esta registrado o la contraseña no es válida.",
    );
  });
});
