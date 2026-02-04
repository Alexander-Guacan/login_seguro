import { useContext } from "react";
import { AuthContext } from "../../context/authContext";
import type { OperationResult } from "../../types";
import { AuthService } from "../../services/auth.service";
import type { RegisterRequestDTO } from "../../dto/auth";

export function useAuth() {
  const context = useContext(AuthContext);

  const register = async (
    dto: RegisterRequestDTO,
  ): Promise<OperationResult> => {
    try {
      await AuthService.register(dto);

      return {
        success: true,
        message:
          "Usuario registrado exitosamente. Inicie sesión para poder continuar.",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocurrio un error al tratar de registrar el usuario. Intentelo más tarde.";
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  if (!context) {
    throw new Error("No provider detected for this context (AuthContext)");
  }

  return {
    ...context,
    register,
  };
}
