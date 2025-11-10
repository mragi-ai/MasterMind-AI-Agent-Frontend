// Simple auth helpers for storing and reading auth state

export type AuthPayload = {
  access_token: string;
  token_type?: string;
  user?: {
    email?: string;
    user_id?: string;
    [key: string]: unknown;
  } | null;
};

const ACCESS_TOKEN_KEY = "auth.access_token";
const USER_KEY = "auth.user";
const LEGACY_TOKEN_KEY = "token"; // used by axios interceptor

function getStorage(remember: boolean): Storage {
  return remember ? window.localStorage : window.sessionStorage;
}

export function saveAuth(payload: AuthPayload, remember: boolean): void {
  const storage = getStorage(remember);
  storage.setItem(ACCESS_TOKEN_KEY, payload.access_token);
  // Keep axios interceptor working by also setting legacy key
  try {
    storage.setItem(LEGACY_TOKEN_KEY, payload.access_token);
  } catch {}
  if (payload.user) {
    storage.setItem(USER_KEY, JSON.stringify(payload.user));
  }
}

export function getAccessToken(): string | null {
  return (
    window.localStorage.getItem(ACCESS_TOKEN_KEY) ||
    window.sessionStorage.getItem(ACCESS_TOKEN_KEY) ||
    window.localStorage.getItem(LEGACY_TOKEN_KEY) ||
    window.sessionStorage.getItem(LEGACY_TOKEN_KEY)
  );
}

export function getUser<T = unknown>(): T | null {
  const raw =
    window.localStorage.getItem(USER_KEY) ||
    window.sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function clearAuth(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(LEGACY_TOKEN_KEY);
}


