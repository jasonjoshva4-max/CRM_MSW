"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./sidebar";
import { apiRequest } from "../lib/api";

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Employee";
};

type AuthContextValue = {
  user: CurrentUser | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthShell");
  }
  return context;
}

export default function AuthShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = pathname === "/login" || pathname === "/register";
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(!isPublic);

  const logout = useCallback(() => {
    window.localStorage.removeItem("ember-token");
    setUser(null);
    router.push("/login");
  }, [router]);

  const loadUser = useCallback(async () => {
    const token = window.localStorage.getItem("ember-token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setUser(await apiRequest("/access/me"));
    } catch {
      window.localStorage.removeItem("ember-token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (token: string) => {
    window.localStorage.setItem("ember-token", token);
    setUser(await apiRequest("/access/me"));
  }, []);

  useEffect(() => {
    if (isPublic) {
      return;
    }
    const timer = window.setTimeout(() => {
      void loadUser();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isPublic, loadUser]);

  useEffect(() => {
    const handleExpired = () => logout();
    window.addEventListener("ember-auth-expired", handleExpired);
    return () => window.removeEventListener("ember-auth-expired", handleExpired);
  }, [logout]);

  useEffect(() => {
    if (!isPublic && !loading && !user) {
      router.replace("/login");
    }
  }, [isPublic, loading, router, user]);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [loading, login, logout, user]
  );

  if (isPublic) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  if (loading || !user) {
    return (
      <AuthContext.Provider value={value}>
        <div className="flex min-h-screen items-center justify-center text-muted">
          Loading workspace...
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </AuthContext.Provider>
  );
}
