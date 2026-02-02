import { UserAPI } from "../api/user.api";
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
      const response = await UserAPI.getAll(query);
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
};
