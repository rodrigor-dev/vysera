"use client";

import { motion } from "framer-motion";
import { VyseraLogo } from "@/components/shared/vysera-logo";
import { cn } from "@/lib/utils";

interface AuthFormLayoutProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function AuthFormLayout({ children, className, title, subtitle }: AuthFormLayoutProps) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4 sm:p-8">
      <div className="pointer-events-none fixed inset-0 dot-grid opacity-40" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_60%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(190,100%,50%/0.06),transparent_50%)]" />

      <div className="pointer-events-none fixed -left-40 -top-40 h-80 w-80 rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 h-80 w-80 rounded-full bg-cyan-500/8 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn("relative w-full max-w-md", className)}
      >
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          className="mb-8 flex flex-col items-center gap-2"
        >
          <VyseraLogo size="lg" animated />
          {title && (
            <motion.h1
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mt-4 text-center text-2xl font-bold tracking-tight gradient-text"
            >
              {title}
            </motion.h1>
          )}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-center text-sm text-muted-foreground"
            >
              {subtitle}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
        >
          <div className="glass-strong rounded-2xl p-6 sm:p-8">
            {children}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
