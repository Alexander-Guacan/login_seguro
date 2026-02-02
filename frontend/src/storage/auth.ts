const REFRESH_TOKEN_KEY = "refresh_token";

export function storageRefreshToken(refreshToken: string) {
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getStoragedRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function removeStoragedRefreshToken() {
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}
