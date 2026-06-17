"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  onBack?: () => void;
  variant?: "main" | "sub";
}

export function PageHeader({
  title,
  description,
  children,
  className,
  onBack,
  variant = "main",
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex flex-col gap-1", className)}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {onBack && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05, duration: 0.3 }}
            >
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onBack}
                className="-ml-1.5 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
          <div className="min-w-0 space-y-1">
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.35 }}
              className={cn(
                "text-2xl font-bold tracking-tight sm:text-3xl",
                variant === "main"
                  ? "gradient-text"
                  : "text-foreground",
              )}
            >
              {title}
            </motion.h1>
            {description && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="max-w-2xl text-sm text-muted-foreground"
              >
                {description}
              </motion.p>
            )}
          </div>
        </div>
        {children && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12, duration: 0.3 }}
            className="flex shrink-0 items-center gap-2"
          >
            {children}
          </motion.div>
        )}
      </div>
      <motion.div
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="premium-divider mt-4 w-full origin-left"
      />
    </motion.div>
  );
}
