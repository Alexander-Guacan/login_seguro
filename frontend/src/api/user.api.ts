import type {
  UserResponseDTO,
  UserListResponseDTO,
  UserProfileRequestDTO,
  ChangePasswordRequestDTO,
} from "../dto/user";
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

  getProfile() {
    return api.get<UserResponseDTO>("/users/profile/me");
  },

  updateProfile(dto: UserProfileRequestDTO) {
    return api.patch<UserResponseDTO>("/users/profile/me", dto);
  },

  changePassword(dto: ChangePasswordRequestDTO) {
    return api.patch("/users/profile/change-password", dto);
  },
};
