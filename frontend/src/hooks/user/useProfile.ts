import { useCallback, useEffect, useState } from "react";
import type { User } from "../../models/user";
import { UserService } from "../../services/user.service";

type UpdateProfileResponse =
  | { success: true; message: string }
  | { success: false; error: string };

export function useProfile() {
  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const updateProfile = useCallback(
    async (user: User): Promise<UpdateProfileResponse> => {
      try {
        setLoading(true);

        const updatedUser = await UserService.updateProfile(user);

        setData(updatedUser);

        return {
          success: true,
          message: "Perfil actualizado exitosamente.",
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el perfil. Intentelo nuevamente.";
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    UserService.getProfile()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return {
    user: data,
    loading,
    updateProfile,
  };
}
