import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { UserProfile } from "@/lib/auth-api";
import {
  authApi,
  getStoredToken,
  storeToken,
  clearToken,
  getAuthErrorMessage,
} from "@/lib/auth-api";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type Role = "admin" | "moderator" | "user" | "rais" | "kotib";

/**
 * Backward-compatible user wrapper.
 * Components like AppHeader access `user.user_metadata?.full_name`,
 * so we expose a synthetic `user_metadata` property.
 */
interface CompatUser {
  id: string;
  email: string;
  full_name: string;
  user_metadata: { full_name: string };
  roles: string[];
  mahalla_id: string | null;
  phone: string | null;
}

interface AuthContextValue {
  user: CompatUser | null;
  loading: boolean;
  roles: Role[];
  mahallaId: string | null;
  isAdmin: boolean;
  isMahallaStaff: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    mahalla_id?: string;
    pinfl?: string;
    household?: string;
    birth_year?: number;
  }) => Promise<void>;
  signOut: () => Promise<void>;
}

// ──────────────────────────────────────────────
// Helper: build CompatUser from API profile
// ──────────────────────────────────────────────

function profileToCompat(profile: UserProfile): CompatUser {
  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    user_metadata: { full_name: profile.full_name },
    roles: profile.roles as Role[],
    mahalla_id: profile.mahalla_id,
    phone: profile.phone,
  };
}

// ──────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CompatUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- Navigate on 401 (outside React tree, so use window listener) ----
  const handleUnauthorized = useCallback(() => {
    setUser(null);
    clearToken();
    // Use window.location for a hard redirect so all state is cleared
    window.location.href = "/auth";
  }, []);

  useEffect(() => {
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [handleUnauthorized]);

  // ---- Bootstrap: check stored token on mount ----
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await authApi.me();
        setUser(profileToCompat(res.data.data));
      } catch (err: unknown) {
        // Token expired / invalid – already cleared by interceptor
        clearToken();
        setUser(null);

        // Show a user-facing toast if the backend itself is unreachable
        if (err instanceof Error && err.message === "Network Error") {
          toast.error("Backend serverga ulanib bo\'lmadi. Server yoniqligini tekshiring.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- Auth actions ----

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await authApi.login({ email, password });
      const { user: profile, token } = res.data.data;
      storeToken(token);
      setUser(profileToCompat(profile));
      toast.success("Tizimga muvaffaqiyatli kirdingiz");
    } catch (err: unknown) {
      console.error("[useAuth] Login failed:", err);
      toast.error(getAuthErrorMessage(err));
      throw err;
    }
  }, []);

  const register = useCallback(
    async (payload: { email: string; password: string; full_name: string; mahalla_id?: string; pinfl?: string; household?: string; birth_year?: number }) => {
      try {
        const res = await authApi.register(payload);
        const { user: profile, token } = res.data.data;
        storeToken(token);
        setUser(profileToCompat(profile));
        toast.success("Ro'yxatdan o'tdingiz! Tizimga kirilmoqda...");
      } catch (err: unknown) {
        console.error("[useAuth] Register failed:", err);
        toast.error(getAuthErrorMessage(err));
        throw err;
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the server call fails, clear local state
    }
    clearToken();
    setUser(null);
    window.location.href = "/auth";
  }, []);

  // ---- Derived state ----
  const roles = user?.roles ?? [];
  const mahallaId = user?.mahalla_id ?? null;
  const isAdmin = roles.includes("admin");
  const isMahallaStaff = roles.includes("rais") || roles.includes("kotib");

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        roles,
        mahallaId,
        isAdmin,
        isMahallaStaff,
        login,
        register,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
