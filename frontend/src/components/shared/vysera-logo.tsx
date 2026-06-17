"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VyseraLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  animated?: boolean;
  variant?: "full" | "icon" | "text";
}

const sizes = {
  sm: { icon: 24, text: "text-lg" },
  md: { icon: 32, text: "text-xl" },
  lg: { icon: 40, text: "text-2xl" },
  xl: { icon: 56, text: "text-3xl" },
};

export function VyseraLogo({
  className,
  size = "md",
  showText = true,
  animated = true,
  variant = "full",
}: VyseraLogoProps) {
  const { icon, text: textSize } = sizes[size];

  const LogoIcon = () => (
    <svg
      width={icon}
      height={icon}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0", className)}
    >
      <defs>
        <linearGradient id="vysera-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="vysera-gradient-light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <filter id="vysera-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {animated && (
        <motion.circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="url(#vysera-gradient)"
          strokeWidth="1.5"
          strokeOpacity="0.15"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      )}

      <motion.path
        d="M8 28 L20 6 L32 28 L26 28 L20 16 L14 28 L8 28Z"
        fill="url(#vysera-gradient)"
        initial={animated ? { scale: 0.8, opacity: 0 } : undefined}
        animate={animated ? { scale: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ filter: animated ? "url(#vysera-glow)" : undefined }}
      />

      <motion.path
        d="M12 26 L20 10 L28 26 L24 26 L20 18 L16 26 L12 26Z"
        fill="url(#vysera-gradient-light)"
        fillOpacity="0.6"
        initial={animated ? { scale: 0.8, opacity: 0 } : undefined}
        animate={animated ? { scale: 1, opacity: 1 } : undefined}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      />

      {animated && (
        <>
          <motion.circle
            cx="14"
            cy="22"
            r="1.5"
            fill="#a78bfa"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          />
          <motion.circle
            cx="26"
            cy="22"
            r="1.5"
            fill="#22d3ee"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          />
        </>
      )}
    </svg>
  );

  if (variant === "icon") {
    return <LogoIcon />;
  }

  if (variant === "text") {
    return (
      <span
        className={cn(
          "font-display font-bold tracking-tight gradient-text",
          textSize,
          className,
        )}
      >
        Vysera
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoIcon />
      {showText && (
        <motion.span
          className={cn(
            "font-display font-bold tracking-tight",
            textSize,
            "text-foreground",
          )}
          initial={animated ? { opacity: 0, x: -5 } : undefined}
          animate={animated ? { opacity: 1, x: 0 } : undefined}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <span className="gradient-text">Vy</span>
          <span className="text-foreground/80">sera</span>
        </motion.span>
      )}
    </div>
  );
}
