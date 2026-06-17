"use client";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { Zap, Shield, Infinity, ChevronRight, Crown } from "lucide-react";
import Link from "next/link";

interface PlanBadgeProps {
  className?: string;
  showUpgrade?: boolean;
  variant?: "badge" | "card";
}

export function PlanBadge({ className, showUpgrade = false, variant = "badge" }: PlanBadgeProps) {
  const user = useAuthStore((s) => s.user);
  const role = user?.app_metadata?.role || "user";
  const isPro = role === "pro";
  const isAdmin = role === "admin";

  if (isAdmin) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400",
        className,
      )}>
        <Crown className="h-3 w-3" />
        Enterprise
      </span>
    );
  }

  if (variant === "badge") {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        isPro
          ? "bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary"
          : "bg-muted/30 text-muted-foreground/60",
        className,
      )}>
        {isPro ? (
          <>
            <Zap className="h-3 w-3" />
            Pro
          </>
        ) : (
          <>
            <Shield className="h-3 w-3" />
            Free
          </>
        )}
      </span>
    );
  }

  return (
    <div className={cn(
      "rounded-xl border p-4",
      isPro
        ? "border-primary/30 bg-gradient-to-r from-primary/5 to-purple-500/5"
        : "border-border/30",
      className,
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            isPro ? "bg-primary/20" : "bg-muted/30",
          )}>
            {isPro ? (
              <Zap className={cn("h-5 w-5", isPro ? "text-primary" : "text-muted-foreground/50")} />
            ) : (
              <Shield className="h-5 w-5 text-muted-foreground/50" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">
              {isPro ? "Pro Plan" : "Free Plan"}
            </p>
            <p className="text-xs text-muted-foreground/60">
              {isPro
                ? "All premium features unlocked"
                : "Limited features available"
              }
            </p>
          </div>
        </div>
        {showUpgrade && !isPro && (
          <Link
            href="/dashboard/upgrade"
            className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-primary to-purple-500 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-primary/25 transition-all hover:shadow-primary/30"
          >
            Upgrade
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
        {showUpgrade && isPro && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
            <Crown className="h-3 w-3" />
            Active
          </span>
        )}
      </div>
    </div>
  );
}
