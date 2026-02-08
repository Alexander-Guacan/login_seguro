import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { BiometricAPI } from "../api/biometric.api";
import { BiometricMapper } from "../mappers/biometric.mapper";
import type { BiometricCredential } from "../models/biometric";

export const BiometricService = {
  async getCredentials(): Promise<BiometricCredential[]> {
    try {
      const response = await BiometricAPI.getCredentials();
      const dtos = response.data;
      return dtos.map(BiometricMapper.toEntity);
    } catch {
      throw new Error(
        "El usuario no tiene registrado metodos de autenticación biométricas",
      );
    }
  },

  async deleteCredential(id: string) {
    try {
      await BiometricAPI.deleteCredential(id);
    } catch {
      throw new Error("La credencial que intenta borrar no existe");
    }
  },

  async registerCredential(deviceName: string) {
    try {
      const generateResponse = await BiometricAPI.generateRegistrationOptions();
      const registrationOptions = generateResponse.data;

      const credential = await startRegistration({
        optionsJSON: registrationOptions,
      });

      await BiometricAPI.verifyRegistration({
        credential,
        deviceName,
      });
    } catch (error) {
      if (error instanceof Error) throw error;

      throw new Error(
        "Ocurrio un problema al intentar solicitar un método de autenticación",
      );
    }
  },

  async verifyCredential(email: string) {
    try {
      const optionsResponse =
        await BiometricAPI.generateAuthenticationOptions(email);

      const options = optionsResponse.data;

      if (!options.allowCredentials?.length) {
        throw new Error(
          "El usuario no cuenta con este método de autenticación.",
        );
      }

      const credential = await startAuthentication({ optionsJSON: options });

      const authResponse = await BiometricAPI.verifyAuthentication({
        email,
        credential,
      });

      return authResponse.data;
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error(
        "No se pudo usar este método para iniciar sesión. Asegurese de tener un método de autenticación válido.",
      );
    }
  },
};
