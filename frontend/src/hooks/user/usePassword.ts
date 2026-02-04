import type { ChangePasswordRequestDTO } from "../../dto/user";
import { UserService } from "../../services/user.service";
import type { OperationResult } from "../../types";

export function usePassword() {
  const changePassword = async (
    dto: ChangePasswordRequestDTO,
  ): Promise<OperationResult> => {
    try {
      await UserService.changePassword(dto);

      return {
        success: true,
        message: "Contraseña cambiada exitosamente",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "La contraseña no pudo ser cambiada. Intentelo más tarde.";

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return {
    changePassword,
  };
}
