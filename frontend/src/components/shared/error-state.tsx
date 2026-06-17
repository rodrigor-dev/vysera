"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

const shakeVariants = {
  hidden: { x: 0 },
  visible: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.5, ease: "easeInOut" },
  },
};

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  retryLabel = "Try Again",
  className,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "glass-strong rounded-2xl flex flex-col items-center justify-center py-16 px-8 text-center",
        className,
      )}
    >
      <motion.div
        variants={shakeVariants}
        initial="hidden"
        animate="visible"
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 ring-1 ring-destructive/20"
      >
        <AlertCircle className="h-6 w-6 text-destructive" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-1.5"
      >
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      </motion.div>

      {onRetry && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="mt-6"
        >
          <Button
            variant="outline"
            size="default"
            onClick={onRetry}
            className="group gap-2"
          >
            <RotateCcw className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12" />
            {retryLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
