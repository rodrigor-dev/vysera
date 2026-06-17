"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: "default" | "with-action" | "illustration";
}

const containerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const iconVariants = {
  hidden: { scale: 0, rotate: -15 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: { delay: 0.15, type: "spring", stiffness: 200, damping: 15 },
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  const showIllustration = variant === "illustration";

  if (variant === "with-action" && action) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "glass-strong rounded-2xl flex flex-col items-center justify-center py-16 px-8 text-center",
          className,
        )}
      >
        <motion.div
          variants={iconVariants}
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10"
        >
          <div className="text-primary">
            {icon ?? <PackageOpen className="h-7 w-7" />}
          </div>
        </motion.div>
        <motion.div variants={contentVariants} className="flex flex-col items-center gap-1.5">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="mt-6"
        >
          {action}
        </motion.div>
      </motion.div>
    );
  }

  if (showIllustration) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "glass-strong rounded-2xl flex flex-col items-center justify-center py-16 px-8 text-center relative overflow-hidden",
          className,
        )}
      >
        <div className="absolute inset-0 dot-grid opacity-30" />
        <motion.div
          variants={iconVariants}
          className="relative mb-6"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-primary/10">
            <div className="text-primary">
              {icon ?? <PackageOpen className="h-8 w-8" />}
            </div>
          </div>
          <motion.div
            className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
        <motion.div variants={contentVariants} className="relative flex flex-col items-center gap-1.5">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
          )}
        </motion.div>
        {action && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.3 }}
            className="relative mt-6"
          >
            {action}
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center justify-center py-16 px-8 text-center",
        className,
      )}
    >
      <motion.div
        variants={iconVariants}
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-accent/15 ring-1 ring-primary/10"
      >
        <div className="text-primary/80">
          {icon ?? <PackageOpen className="h-6 w-6" />}
        </div>
      </motion.div>
      <motion.div variants={contentVariants} className="flex flex-col items-center gap-1.5">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </motion.div>
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="mt-6"
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}
