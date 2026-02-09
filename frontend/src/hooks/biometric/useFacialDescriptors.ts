import { useEffect, useState } from "react";
import { BiometricDescriptor } from "../../models/biometric";
import { BiometricService } from "../../services/biometric.service";
import type { OperationResult } from "../../types";

export function useFacialDescriptors() {
  const [data, setData] = useState<BiometricDescriptor[] | null>(null);
  const [loading, setLoading] = useState(true);

  const addDescriptor = async (
    descriptor: number[],
    deviceName: string,
  ): Promise<OperationResult> => {
    try {
      setLoading(true);

      const biometricDescriptor = await BiometricService.registerFaceDescripor(
        descriptor,
        deviceName,
      );

      setData((p) => {
        if (!p) return [biometricDescriptor];

        return [...p, biometricDescriptor];
      });

      return {
        success: true,
        message: "Autenticación por Face ID agregada exitosamente.",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo registrar este método de autenticación. Intentelo más tarde";

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const deleteDescriptor = async (id: string): Promise<OperationResult> => {
    try {
      setLoading(true);

      await BiometricService.deleteFacialDescriptor(id);

      setData((p) => {
        if (!p) return null;

        return p.filter((c) => c.id !== id);
      });

      return {
        success: true,
        message: "Autenticacion por Face ID eliminada exitosamente.",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo eliminar este método de autenticación. Intentelo más tarde";

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    BiometricService.getFacialDescriptors()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return {
    descriptors: data,
    loading,
    addDescriptor,
    deleteDescriptor,
  };
}
