import { UserAPI } from "../api/user.api";
import type { UserRole } from "../enums/userRole.enum";
import { UserMapper } from "../mappers/user.mapper";
import type { User } from "../models/user";
import type { PaginatedData } from "../types";

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
};
