import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./api.js";
import type { PublicUser } from "@nexus/types";

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount, ask the real backend whether a valid session cookie already
  // exists (GET /api/auth/me). A 401 here is an expected, normal state
  // (anonymous visitor), not an error to surface to the user.
  useEffect(() => {
    api
      .me()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    setError(null);
    try {
      const res = await api.login(email, password);
      setUser(res.user);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }

  async function register(email: string, password: string) {
    setError(null);
    try {
      await api.register(email, password);
      // Registration does not itself create a session — log in immediately
      // afterward so "create an account" and "sign in" feel like one step
      // to the user, while the backend still enforces them as two distinct,
      // separately-tested operations.
      await login(email, password);
    } catch (err) {
      setError((err as Error).message);
      throw err;
    }
  }

  async function logout() {
    await api.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
