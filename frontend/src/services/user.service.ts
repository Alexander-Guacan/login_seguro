import { UserAPI } from "../api/user.api";
import type { ChangePasswordRequestDTO } from "../dto/user";
import type { UserRole } from "../enums/userRole.enum";
import { UserMapper } from "../mappers/user.mapper";
import { UserProfileMapper } from "../mappers/userProfile.mapper";
import type { User } from "../models/user";
import type { PaginatedData } from "../types";
import { capitalize } from "../utils/text.util";

export interface GetAllUsersQuery {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "email" | "firstname" | "lastname";
  sortOrder?: "asc" | "desc";
}

export const UserService = {
  async getAll(query?: GetAllUsersQuery): Promise<PaginatedData<User>> {
    try {
      const response = await UserAPI.getAll({
        isActive: query?.isActive,
        limit: query?.limit,
        page: query?.page,
        role: query?.role,
        search: query?.search,
        sortBy: query?.sortBy,
        sortOrder: query?.sortOrder,
      });

      const dto = response.data;

      return {
        data: dto.users.map(UserMapper.toEntity),
        limit: dto.limit,
        page: dto.page,
        total: dto.total,
        totalPages: dto.totalPages,
      };
    } catch {
      throw new Error(
        "No se pudo obtener los usuarios. Asegurate de que tienes los permisos requeridos.",
      );
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await UserAPI.getProfile();
      const dto = response.data;
      return UserMapper.toEntity(dto);
    } catch {
      throw new Error(
        "No se pudo obtener el perfil del usuario. Vuelva a iniciar sesión.",
      );
    }
  },

  async updateProfile(user: User): Promise<User> {
    try {
      const dto = UserProfileMapper.toDTO(user);
      dto.firstName = dto.firstName && capitalize(dto.firstName);
      dto.lastName = dto.lastName && capitalize(dto.lastName);

      const response = await UserAPI.updateProfile(dto);
      const updatedUser = UserMapper.toEntity(response.data);
      return updatedUser;
    } catch {
      throw new Error("No se pudo actualizar el perfil. Intentalo más tarde.");
    }
  },

  async changePassword(dto: ChangePasswordRequestDTO) {
    try {
      dto.newPassword = dto.newPassword.trim();
      await UserAPI.changePassword(dto);
    } catch {
      throw new Error(
        "La contraseña no pudo ser cambiada. Contraseña actual incorrecta.",
      );
    }
  },

  async getById(id: string): Promise<User> {
    try {
      const response = await UserAPI.getById(id);
      const dto = response.data;
      return UserMapper.toEntity(dto);
    } catch {
      throw new Error(
        "Usuario no encontrado. Verfique que las credenciales son correctas.",
      );
    }
  },

  async update(id: string, user: User, newPassword?: string): Promise<User> {
    try {
      const dto = UserMapper.toUpdateDTO(user, newPassword);
      const response = await UserAPI.update(id, dto);
      return UserMapper.toEntity(response.data);
    } catch {
      throw new Error(
        "El usuario no pudo ser actualizado. Intentelo más tarde.",
      );
    }
  },

  async create(user: User, password: string): Promise<User> {
    try {
      const dto = UserMapper.toDTO(user, password);
      const response = await UserAPI.create(dto);
      return UserMapper.toEntity(response.data);
    } catch {
      throw new Error(
        "El usuario no pudo ser registrado: el correo ya esta registrado o la contraseña no es válida.",
      );
    }
  },
};
