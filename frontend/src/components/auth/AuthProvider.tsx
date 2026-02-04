import { useEffect, useState } from "react";
import { AuthContext } from "../../context/authContext";
import type { User } from "../../models/user";
import { AuthService } from "../../services/auth.service";
import type { LoginRequestDTO } from "../../dto/auth";
import { removeAuthHeader, setAuthHeader } from "../../api/api";
import {
  getStoragedRefreshToken,
  removeStoragedRefreshToken,
  storageRefreshToken,
} from "../../storage/auth";
import type { OperationResult } from "../../types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(
    () => getStoragedRefreshToken() !== null,
  );

  const login = async (values: LoginRequestDTO): Promise<OperationResult> => {
    try {
      const { user, accessToken, refreshToken } =
        await AuthService.login(values);

      setUser(user);
      setAuthHeader(accessToken);
      storageRefreshToken(refreshToken);

      return {
        success: true,
        message: "Inicio de sesión exitoso",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Ocurrió un problema, intentelo más tarde",
      };
    }
  };

  const logout = async () => {
    const refreshToken = getStoragedRefreshToken();

    if (refreshToken) {
      await AuthService.logout(refreshToken).then(() => {
        setUser(null);
        removeStoragedRefreshToken();
        removeAuthHeader();
      });
    }
  };

  const refreshSession = async (
    storagedRefreshToken: string,
  ): Promise<User> => {
    const { accessToken, refreshToken } =
      await AuthService.refreshSession(storagedRefreshToken);

    setAuthHeader(accessToken);
    storageRefreshToken(refreshToken);

    return AuthService.getMe();
  };

  useEffect(() => {
    const storagedRefreshToken = getStoragedRefreshToken();

    if (!storagedRefreshToken) return;

    refreshSession(storagedRefreshToken)
      .then(setUser)
      .catch(() => {
        removeAuthHeader();
        removeStoragedRefreshToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext>
  );
}
