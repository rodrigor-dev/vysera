"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { VyseraLogo } from "./vysera-logo";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
  variant?: "spinner" | "skeleton" | "full-page";
}

const sizeMap = {
  sm: { outer: 16, border: 2 },
  md: { outer: 24, border: 3 },
  lg: { outer: 32, border: 3 },
  xl: { outer: 48, border: 4 },
};

const strokeWidthMap = {
  sm: 3,
  md: 3,
  lg: 3.5,
  xl: 4,
};

export function LoadingSpinner({
  size = "md",
  className,
  text,
  variant = "spinner",
}: LoadingSpinnerProps) {
  const dims = sizeMap[size];

  if (variant === "skeleton") {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <div className="shimmer-strong h-4 w-3/4 rounded-lg" />
        <div className="shimmer-strong h-4 w-1/2 rounded-lg" />
        <div className="shimmer-strong h-4 w-5/6 rounded-lg" />
      </div>
    );
  }

  if (variant === "full-page") {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col items-center justify-center gap-6",
          "bg-background/80 backdrop-blur-xl",
          className,
        )}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <VyseraLogo size="lg" animated variant="icon" />
          <div className="relative">
            <svg
              width={dims.outer * 2.5}
              height={dims.outer * 2.5}
              viewBox={`0 0 ${dims.outer * 2.5} ${dims.outer * 2.5}`}
              className="animate-spin"
              style={{ animationDuration: "1.2s" }}
            >
              <defs>
                <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="50%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <motion.circle
                cx={dims.outer * 1.25}
                cy={dims.outer * 1.25}
                r={dims.outer * 0.9}
                fill="none"
                stroke="url(#spinner-gradient)"
                strokeWidth={strokeWidthMap[size]}
                strokeLinecap="round"
                strokeDasharray={`${Math.PI * dims.outer * 0.9 * 0.75} ${Math.PI * dims.outer * 0.9 * 0.25}`}
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "center" }}
              />
            </svg>
          </div>
        </motion.div>
        {text && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-sm text-muted-foreground"
          >
            {text}
          </motion.p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="relative" style={{ width: dims.outer, height: dims.outer }}>
        <svg
          width={dims.outer}
          height={dims.outer}
          viewBox={`0 0 ${dims.outer} ${dims.outer}`}
        >
          <defs>
            <linearGradient id="spinner-gradient-sm" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <motion.circle
            cx={dims.outer / 2}
            cy={dims.outer / 2}
            r={dims.outer / 2 - dims.border}
            fill="none"
            stroke="url(#spinner-gradient-sm)"
            strokeWidth={dims.border}
            strokeLinecap="round"
            strokeDasharray={`${Math.PI * (dims.outer / 2 - dims.border) * 0.7} ${Math.PI * (dims.outer / 2 - dims.border) * 0.3}`}
            initial={{ rotate: -90 }}
            animate={{ rotate: 270 }}
            transition={{ duration: 0.8 * (size === "sm" ? 0.6 : size === "xl" ? 1.1 : 0.8), repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "center" }}
          />
        </svg>
      </div>
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-xs text-muted-foreground"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}
