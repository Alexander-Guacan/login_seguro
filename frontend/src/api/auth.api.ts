import type {
  LoginResponseDTO,
  LoginRequestDTO,
  RefreshResponseDTO,
  RegisterRequestDTO,
} from "../dto/auth";
import type { UserResponseDTO } from "../dto/user";
import { api } from "./api";

export const AuthAPI = {
  register(dto: RegisterRequestDTO) {
    return api.post("/auth/register", dto);
  },

  login(dto: LoginRequestDTO) {
    return api.post<LoginResponseDTO>("/auth/login", dto);
  },

  refreshSession(refreshToken: string) {
    return api.post<RefreshResponseDTO>("/auth/refresh", {
      refreshToken,
    });
  },

  getMe() {
    return api.get<UserResponseDTO>("/auth/me");
  },

  logout(refreshToken: string) {
    return api.post("/auth/logout", { refreshToken });
  },
};
