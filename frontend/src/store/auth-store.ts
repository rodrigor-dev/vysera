import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  proExpiresAt: string | null;
  createdAt: string;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: true,

      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),

      login: async (email, password) => {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include",
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Invalid email or password");
        set({
          user: body.user ?? { id: body.userId, email, name: body.name ?? null, role: body.role ?? "user", proExpiresAt: null, createdAt: new Date().toISOString() },
          accessToken: body.accessToken ?? null,
          isLoading: false,
        });
      },

      register: async (email, password, name) => {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
          credentials: "include",
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Registration failed");
        set({
          user: body.user ?? null,
          accessToken: body.accessToken ?? null,
          isLoading: false,
        });
      },

      logout: async () => {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        set({ user: null, accessToken: null });
      },

      refreshSession: async () => {
        try {
          const res = await fetch("/api/auth/me", { credentials: "include" });
          if (res.ok) {
            const body = await res.json();
            set({ user: body.user ?? null, isLoading: false });
          } else {
            set({ user: null, accessToken: null, isLoading: false });
          }
        } catch {
          set({ user: null, accessToken: null, isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    },
  ),
);

export const useIsAuthenticated = () =>
  useAuthStore((state) => state.user !== null);

export const useIsAdmin = () =>
  useAuthStore((state) => state.user?.role === "admin");

export const useIsPro = () =>
  useAuthStore((state) => state.user?.role === "pro" || state.user?.role === "admin");
