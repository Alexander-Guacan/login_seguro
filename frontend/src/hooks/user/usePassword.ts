import type { ChangePasswordRequestDTO } from "../../dto/user";
import { UserService } from "../../services/user.service";

type ChangePasswordResponse =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      error: string;
    };

export function usePassword() {
  const changePassword = async (
    dto: ChangePasswordRequestDTO,
  ): Promise<ChangePasswordResponse> => {
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
