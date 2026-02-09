import { useEffect, useState } from "react";
import { BiometricCredential } from "../../models/biometric";
import { BiometricService } from "../../services/biometric.service";
import type { OperationResult } from "../../types";

export function useCredentials() {
  const [data, setData] = useState<BiometricCredential[] | null>(null);
  const [loading, setLoading] = useState(true);

  const deleteCredential = async (id: string): Promise<OperationResult> => {
    try {
      setLoading(true);

      await BiometricService.deleteCredential(id);

      const credentials = await BiometricService.getCredentials();

      setData(credentials);

      return {
        success: true,
        message: "Dispositivo eliminado exitosamente.",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo borrar el dispositivo. Intentelo más tarde";
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const addCredential = async (
    deviceName: string,
  ): Promise<OperationResult> => {
    try {
      setLoading(true);

      await BiometricService.registerCredential(deviceName);

      const credentials = await BiometricService.getCredentials();

      setData(credentials);

      return {
        success: true,
        message: "Dispositivo agregado exitosamente.",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo registrar el dispositivo. Intentelo más tarde";
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    BiometricService.getCredentials()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return {
    credentials: data,
    loading,
    deleteCredential,
    addCredential,
  };
}
