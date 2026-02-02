import axios from "axios";
import {
  getStoragedRefreshToken,
  removeStoragedRefreshToken,
  storageRefreshToken,
} from "../storage/auth";
import { AuthService } from "../services/auth.service";

let accessToken: string | null = null;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    if (error.response.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/me")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = getStoragedRefreshToken();
    if (!refreshToken) {
      removeAuthHeader();
      removeStoragedRefreshToken();
      return Promise.reject(error);
    }

    try {
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await AuthService.refreshSession(refreshToken);

      setAuthHeader(newAccessToken);
      storageRefreshToken(newRefreshToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      removeAuthHeader();
      removeStoragedRefreshToken();
      return Promise.reject(refreshError);
    }
  },
);

export function setAuthHeader(token: string) {
  accessToken = token;
}

export function removeAuthHeader() {
  accessToken = null;
}
