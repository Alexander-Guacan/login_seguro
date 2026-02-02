import type { UserResponseDTO } from "./user";

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  user: UserResponseDTO;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponseDTO {
  accessToken: string;
  refreshToken: string;
}
