import { AuthAPI } from "../api/auth.api";
import type { LoginRequestDTO, RefreshResponseDTO } from "../dto/auth";
import { UserMapper } from "../mappers/user.mapper";

let refreshPromise: Promise<RefreshResponseDTO> | null = null;

export const AuthService = {
  async login(dto: LoginRequestDTO) {
    try {
      const response = await AuthAPI.login(dto);
      const { user, refreshToken, accessToken } = response.data;
      return {
        user: UserMapper.toEntity(user),
        accessToken,
        refreshToken,
      };
    } catch {
      throw new Error("Correo o contraseña incorrectos");
    }
  },

  async refreshSession(refreshToken: string) {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const response = await AuthAPI.refreshSession(refreshToken);
          return response.data;
        } catch {
          throw new Error(
            "Sesión inválida o caducada. Inicie sesión nuevamente.",
          );
        } finally {
          refreshPromise = null;
        }
      })();
    }

    return refreshPromise;
  },

  async getMe() {
    try {
      const response = await AuthAPI.getMe();
      const user = response.data;
      return UserMapper.toEntity(user);
    } catch {
      throw new Error("No ha iniciado sesión");
    }
  },

  async logout(refreshToken: string) {
    try {
      await AuthAPI.logout(refreshToken);
    } catch {
      throw new Error("No se pudo cerrar sesión");
    }
  },
};
