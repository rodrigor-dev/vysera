"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialButtonProps {
  icon: React.ReactNode;
  text: string;
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  provider: string;
}

export function SocialButton({
  icon,
  text,
  onClick,
  isLoading,
  disabled,
  className,
  provider,
}: SocialButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <Button
        variant="outline"
        className={cn(
          "relative flex w-full items-center justify-center gap-2.5 border-border/50 bg-background/50 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent hover:text-foreground hover:border-primary/30 hover:shadow-glow-sm disabled:opacity-50",
          className,
        )}
        onClick={onClick}
        disabled={disabled || isLoading}
        aria-label={`Sign in with ${provider}`}
      >
        {isLoading ? (
          <span className="flex items-center gap-2.5">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting...</span>
          </span>
        ) : (
          <>
            <span className="flex-shrink-0">{icon}</span>
            <span>{text}</span>
          </>
        )}
      </Button>
    </motion.div>
  );
}
