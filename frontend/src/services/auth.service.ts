import { AuthAPI } from "../api/auth.api";
import type {
  LoginRequestDTO,
  RefreshResponseDTO,
  RegisterRequestDTO,
} from "../dto/auth";
import { UserMapper } from "../mappers/user.mapper";
import { BiometricService } from "./biometric.service";

let refreshPromise: Promise<RefreshResponseDTO> | null = null;

export const AuthService = {
  async register(dto: RegisterRequestDTO) {
    try {
      await AuthAPI.register(dto);
    } catch {
      throw new Error(
        "No se pudo registrar al usuario, el correo usado ya esta registrado.",
      );
    }
  },

  async login(dto: LoginRequestDTO) {
    try {
      dto.email = dto.email.trim();
      dto.password = dto.password.trim();

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

  async credentialLogin(email: string) {
    try {
      const { user, refreshToken, accessToken } =
        await BiometricService.verifyCredential(email.trim());

      return {
        user: UserMapper.toEntity(user),
        accessToken,
        refreshToken,
      };
    } catch {
      throw new Error("No se pudo iniciar sesión por este método.");
    }
  },

  async faceLogin(email: string, descriptor: number[]) {
    try {
      const { user, refreshToken, accessToken } =
        await BiometricService.verifyFaceDescriptor(email.trim(), descriptor);

      return {
        user: UserMapper.toEntity(user),
        accessToken,
        refreshToken,
      };
    } catch {
      throw new Error("No se pudo iniciar sesión por este método.");
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
