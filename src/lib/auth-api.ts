import apiClient, { getErrorMessage, TOKEN_KEY, type ApiResponse } from "./api";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  mahalla_id?: string;
  phone?: string;
  pinfl?: string;
  household?: string;
  birth_year?: number;
}

/** Shape returned by /auth/login and /auth/register */
export interface AuthResponseData {
  user: UserProfile;
  token: string;
}

/** The user model returned by the backend */
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  mahalla_id: string | null;
  phone: string | null;
  /** Timestamp of last login (ISO string) */
  last_login?: string;
}

// ──────────────────────────────────────────────
// Token helpers
// ──────────────────────────────────────────────

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ──────────────────────────────────────────────
// Auth API
// ──────────────────────────────────────────────

export const authApi = {
  /**
   * Sign in with email & password.
   * Returns `{ success, data: { user, token }, message }`.
   */
  login(payload: LoginPayload) {
    return apiClient.post<ApiResponse<AuthResponseData>>("/auth/login", payload);
  },

  /**
   * Create a new user account.
   * Returns `{ success, data: { user, token }, message }`.
   */
  register(payload: RegisterPayload) {
    return apiClient.post<ApiResponse<AuthResponseData>>("/auth/register", payload);
  },

  /**
   * Invalidate the current session on the server side.
   */
  logout() {
    return apiClient.post<ApiResponse<null>>("/auth/logout");
  },

  /**
   * Fetch the currently-authenticated user's profile.
   * The token is automatically attached by the request interceptor.
   */
  me() {
    return apiClient.get<ApiResponse<UserProfile>>("/auth/me");
  },
};

/**
 * High-level login helper that:
 * 1. Calls `authApi.login`
 * 2. Stores the token in localStorage
 * 3. Returns the user profile
 */
export async function loginAndStore(
  email: string,
  password: string,
): Promise<UserProfile> {
  const response = await authApi.login({ email, password });
  const { user, token } = response.data.data;
  storeToken(token);
  return user;
}

/**
 * High-level register helper that:
 * 1. Calls `authApi.register`
 * 2. Stores the token in localStorage
 * 3. Returns the user profile
 */
export async function registerAndStore(
  payload: RegisterPayload,
): Promise<UserProfile> {
  const response = await authApi.register(payload);
  const { user, token } = response.data.data;
  storeToken(token);
  return user;
}

/**
 * Error-normalisation helper for auth forms.
 * Returns a user-facing string.
 *
 * Also logs the full error details to the console so developers
 * can inspect the exact request URL and response.
 */
export function getAuthErrorMessage(error: unknown): string {
  // Always log the full error details for debugging
  console.error("[AuthAPI] Error details:", error);

  const msg = getErrorMessage(error);

  // Map common technical messages to Uzbek-friendly ones
  const map: Record<string, string> = {
    "Network Error": "Server bilan bog'lanib bo'lmadi. Server ishlayotganligini va URL manzil (VITE_API_BASE_URL) to'g'ri ekanligini tekshiring.",
    "Request failed with status code 422":
      "Ma'lumotlar noto'g'ri. Maydonlarni to'ldiring.",
    "Request failed with status code 429":
      "Juda ko'p urinish. Birozdan so'ng qayta urinib ko'ring.",
  };

  return map[msg] ?? msg;
}
