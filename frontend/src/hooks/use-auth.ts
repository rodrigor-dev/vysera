"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth-store";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const {
    user,
    session,
    isLoading,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    refreshSession,
    setUser,
  } = useAuthStore();

  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);

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
    user: user as User | null,
    session,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshSession,
  };
}
