"use client";

import { useEffect } from "react";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "sonner";
import { getLocale, setLocale } from "@/lib/i18n/use-translation";
import { useAuthStore } from "@/store/auth-store";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setLocale(getLocale());
    const store = useAuthStore.getState();
    if (store.accessToken) {
      store.refreshSession();
    } else {
      store.setLoading(false);
    }
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
