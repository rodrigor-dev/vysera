"use client";

import { useCallback, useState } from "react";
import { useAuthStore } from "@/store/auth-store";

export function useAuth() {
  const {
    user,
    isLoading,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    refreshSession,
  } = useAuthStore();

  const [error, setError] = useState<Error | null>(null);

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        await storeLogin(email, password);
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [storeLogin],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      setError(null);
      try {
        await storeRegister(email, password, name);
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [storeRegister],
  );

  const logout = useCallback(async () => {
    setError(null);
    try {
      await storeLogout();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [storeLogout]);

  return {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshSession,
  };
}
