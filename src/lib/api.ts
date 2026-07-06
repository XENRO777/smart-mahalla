import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Environment & constants
// ──────────────────────────────────────────────

/** True if the user explicitly set VITE_API_BASE_URL in an env file */
const ENV_API_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
const HARDCODED_FALLBACK = "https://smart-mahalla-w0a1.onrender.com/api/v1";

const BASE_URL: string = ENV_API_URL ?? HARDCODED_FALLBACK;

// ─── Startup diagnostics ───────────────────────
console.groupCollapsed("%c[API Client] Initializing", "color: #3b82f6; font-weight: bold");
console.log("VITE_API_BASE_URL (from env):", ENV_API_URL ?? "(not set)");
console.log("Resolved BASE_URL:", BASE_URL);
if (!ENV_API_URL) {
  console.log(
    "%c[API Client] Using default fallback:",
    "color: #22c55e",
    HARDCODED_FALLBACK
  );
}
console.groupEnd();

export const TOKEN_KEY = "api_auth_token";

// ──────────────────────────────────────────────
// Response / Error types
// ──────────────────────────────────────────────

/** Standard backend-success shape: { success, data, message } */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
}

/** Shape returned by the backend on 4xx / 5xx errors */
export interface ApiErrorBody {
  message: string;
  errors?: string[];
}

/** Convenience alias so consumers can write `ApiListResponse<Citizen>` */
export type ApiListResponse<T> = ApiResponse<T[]>;

// ──────────────────────────────────────────────
// Axios instance
// ──────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30_000,
});

// ──────────────────────────────────────────────
// Request interceptor – attach Bearer token
// ──────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ──────────────────────────────────────────────
// Response interceptor – unwrap errors & handle 401
// ──────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const ctx = error.config;

    // Log detailed diagnostic info for every failed request
    console.groupCollapsed(
      "%c[API Client] Request failed",
      "color: #ef4444; font-weight: bold",
    );
    console.log("Method :", ctx?.method?.toUpperCase());
    console.log("URL    :", ctx?.baseURL ? `${ctx.baseURL}${ctx.url}` : ctx?.url);
    console.log("Status :", error.response?.status ?? "(no response — Network Error)");
    if (error.message === "Network Error") {
      console.error(
        "🌐 Network Error — the server at %s is not reachable.\n" +
        "   Possible causes:\n" +
        "   • The backend server is not running\n" +
        "   • The URL/port in VITE_API_BASE_URL is wrong\n" +
        "   • CORS is blocking the request\n" +
        "   • A firewall or proxy is interfering",
        ctx?.baseURL,
      );
    }
    console.log("Error  :", error.message);
    console.groupEnd();

    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      toast.error("Sessiya muddati tugadi. Iltimos, qaytadan kiring.");
    }
    return Promise.reject(error);
  },
);

// ──────────────────────────────────────────────
// Typed helpers
// ──────────────────────────────────────────────

/**
 * Make an API request and unwrap the `data` field from
 * the standard `ApiResponse<T>` wrapper.
 */
export async function extractData<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<ApiResponse<T>>(config);
  return response.data.data;
}

/**
 * Make an API request and return the full `ApiResponse<T>` object.
 * Useful when callers need the `message` field.
 */
export async function apiCall<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const response = await apiClient.request<ApiResponse<T>>(config);
  return response.data;
}

/**
 * Extract a human-readable error message from any thrown value.
 *
 * Preferred backend error shape:
 *   { "message": "Error details", "errors": [...] }
 */
export function getErrorMessage(error: unknown, fallback = "Xatolik yuz berdi"): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data;
    if (body?.message) return body.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/**
 * Convenience: construct pagination query params from a page / pageSize pair.
 * Returns an object suitable for spreading into a config `params` field.
 */
export function paginationParams(page: number, pageSize: number) {
  return { page, page_size: pageSize };
}

export default apiClient;
