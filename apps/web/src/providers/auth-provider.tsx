"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi, AuthUser } from "@/lib/api/auth.api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check saved session in localStorage and cookie
    try {
      let savedToken = localStorage.getItem("tf_token");
      const savedUser = localStorage.getItem("tf_user");

      // Cookie fallback
      if (!savedToken && typeof document !== "undefined") {
        const match = document.cookie.match(/(?:^|; )tf_token=([^;]*)/);
        if (match) {
          savedToken = decodeURIComponent(match[1]);
          localStorage.setItem("tf_token", savedToken);
        }
      }

      if (savedToken) {
        setToken(savedToken);
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            // invalid json, ignore
          }
        }

        // Validate and sync user in background
        authApi
          .getMe()
          .then((freshUser) => {
            if (freshUser) {
              setUser(freshUser);
              localStorage.setItem("tf_user", JSON.stringify(freshUser));
            }
          })
          .catch((err) => {
            console.warn("Background session check:", err?.message || err);
          });
      }
    } catch {
      localStorage.removeItem("tf_token");
      localStorage.removeItem("tf_refresh_token");
      localStorage.removeItem("tf_user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password = "") => {
    setIsLoading(true);
    try {
      const data = await authApi.login({ email, password });
      setToken(data.accessToken);
      setUser(data.user);

      localStorage.setItem("tf_token", data.accessToken);
      localStorage.setItem("tf_refresh_token", data.refreshToken);
      localStorage.setItem("tf_user", JSON.stringify(data.user));
      document.cookie = `tf_token=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`;

      // Full navigation to load dashboard with freshly set token
      window.location.href = "/";
    } catch (err: any) {
      throw new Error(err.response?.data?.message || err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("tf_token");
      localStorage.removeItem("tf_refresh_token");
      localStorage.removeItem("tf_user");
      document.cookie = "tf_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}