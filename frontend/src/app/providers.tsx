"use client";

import { useEffect } from "react";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "sonner";
import { getLocale, setLocale } from "@/lib/i18n/use-translation";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setLocale(getLocale());
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
