import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: true,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),

      login: async (email, password) => {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        set({ user: data.user, session: data.session });
      },

      register: async (email, password, name) => {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
        set({ user: data.user, session: data.session });
      },

      logout: async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        set({ user: null, session: null });
      },

      refreshSession: async () => {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          set({ user, session, isLoading: false });
        } else {
          set({ user: null, session: null, isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    },
  ),
);

export const useIsAuthenticated = () =>
  useAuthStore((state) => state.user !== null);

export const useIsAdmin = () =>
  useAuthStore((state) =>
    state.user?.app_metadata?.role === "admin",
  );

export const useIsPro = () =>
  useAuthStore((state) =>
    state.user?.app_metadata?.plan === "pro",
  );
