import { useEffect, useState } from "react";
import type { User } from "../../models/user";
import { UserService } from "../../services/user.service";
import type { OperationResult } from "../../types";

export function useUser({ id }: { id?: string } = {}) {
  const [data, setData] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const create = async (
    user: User,
    password: string,
  ): Promise<OperationResult> => {
    try {
      const newUser = await UserService.create(user, password);
      setData(newUser);

      return {
        success: true,
        message: "Usuario creado correctamente.",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocurrio un error inesperado al tratar de crear el usuario.";

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const update = async (
    id: string,
    user: User,
    newPassword?: string,
  ): Promise<OperationResult> => {
    try {
      const updatedUser = await UserService.update(id, user, newPassword);
      setData(updatedUser);

      return {
        success: true,
        message: "Usuario actualizado correctamente.",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Ocurrio un error inesperado al tratar de actualizar el usuario.";

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  useEffect(() => {
    if (!id) return;

    UserService.getById(id)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [id]);

  return {
    user: data,
    error,
    loading,
    create,
    update,
  };
}
