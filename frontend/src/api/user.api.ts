import type { UserListResponseDTO } from "../dto/user";
import { api } from "./api";

interface GetAllUsersApiQuery {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export const UserAPI = {
  getAll(query?: GetAllUsersApiQuery) {
    return api.get<UserListResponseDTO>("/users", {
      params: query,
    });
  },
};
