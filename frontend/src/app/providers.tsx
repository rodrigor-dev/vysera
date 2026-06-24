"use client";

import { useEffect } from "react";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "sonner";
import { getLocale, setLocale } from "@/lib/i18n/use-translation";
import { useAuthStore } from "@/store/auth-store";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setLocale(getLocale());
    const state = useAuthStore.getState();

    const unsub = useAuthStore.persist?.onFinishHydration?.(() => {
      const s = useAuthStore.getState();
      if (s.accessToken) {
        s.refreshSession();
      } else {
        s.setLoading(false);
      }
    });

    if (state.accessToken) {
      state.refreshSession();
    } else {
      state.setLoading(false);
    }

    const safety = setTimeout(() => {
      const s = useAuthStore.getState();
      if (s.isLoading) s.setLoading(false);
    }, 3000);

    return () => {
      unsub?.();
      clearTimeout(safety);
    };
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
        }}
      />
    </ThemeProvider>
  );
}
