import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiRequest } from "@/lib/api/client";
import type { AuthUser, LoginResponse } from "@/lib/api/types";

const TOKEN_KEY = "northbike-admin-token";
const USER_KEY = "northbike-admin-user";

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as AuthUser : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => loadUser());

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleExpired = () => logout();
    window.addEventListener("northbike:auth-expired", handleExpired);
    return () => window.removeEventListener("northbike:auth-expired", handleExpired);
  }, [logout]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (response.user.role !== "admin") throw new Error("Esta cuenta no tiene acceso al panel administrativo.");
    sessionStorage.setItem(TOKEN_KEY, response.access_token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(response.user));
    setToken(response.access_token);
    setUser(response.user);
    return response.user;
  }, []);

  const value = useMemo(() => ({ token, user, login, logout }), [token, user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
