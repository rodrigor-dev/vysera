"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { SocialButton } from "./social-button";
import { createClient } from "@/lib/supabase/client";
import { generateCSRFToken } from "@/lib/security/csrf";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#1877F2" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

interface OAuthButtonsProps {
  isLoading?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}

export function OAuthButtons({ isLoading, onLoadingChange }: OAuthButtonsProps) {
  const [localLoading, setLocalLoading] = useState<string | null>(null);

  const handleOAuthSignIn = async (provider: "google" | "apple" | "facebook") => {
    setLocalLoading(provider);
    onLoadingChange?.(true);

    try {
      const supabase = createClient();
      const csrfToken = generateCSRFToken();
      sessionStorage.setItem("oauth-csrf-token", csrfToken);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { csrf_token: csrfToken },
        },
      });

      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign in";
      toast.error(message);
      onLoadingChange?.(false);
    } finally {
      setLocalLoading(null);
    }
  };

  const isLoadingAny = isLoading || localLoading !== null;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      <div className="relative">
        <div className="premium-divider my-4" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
          or continue with
        </span>
      </div>

      <motion.div variants={item} className="space-y-2.5">
        <SocialButton
          icon={<GoogleIcon />}
          text="Continue with Google"
          provider="google"
          onClick={() => handleOAuthSignIn("google")}
          isLoading={localLoading === "google"}
          disabled={isLoadingAny}
        />
        <SocialButton
          icon={<AppleIcon />}
          text="Continue with Apple"
          provider="apple"
          onClick={() => handleOAuthSignIn("apple")}
          isLoading={localLoading === "apple"}
          disabled={isLoadingAny}
        />
        <SocialButton
          icon={<FacebookIcon />}
          text="Continue with Facebook"
          provider="facebook"
          onClick={() => handleOAuthSignIn("facebook")}
          isLoading={localLoading === "facebook"}
          disabled={isLoadingAny}
        />
      </motion.div>
    </motion.div>
  );
}
