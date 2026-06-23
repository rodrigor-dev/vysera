"use client";

import { motion } from "framer-motion";
import {
  Users,
  Crown,
  DollarSign,
  TrendingUp,
  UserPlus,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Stat {
  label: string;
  value: string;
  trend?: { value: string; positive: boolean };
  icon: React.ReactNode;
}

interface StatsOverviewProps {
  stats?: Stat[];
  isLoading?: boolean;
}

const defaultStats: Stat[] = [
  {
    label: "Total Users",
    value: "12,543",
    trend: { value: "+12.5%", positive: true },
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: "Pro Users",
    value: "2,847",
    trend: { value: "+8.2%", positive: true },
    icon: <Crown className="h-5 w-5" />,
  },
  {
    label: "Total Revenue",
    value: "$84,293",
    trend: { value: "+23.1%", positive: true },
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    label: "Revenue This Month",
    value: "$12,847",
    trend: { value: "+18.4%", positive: true },
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    label: "New Users",
    value: "1,234",
    trend: { value: "+5.7%", positive: true },
    icon: <UserPlus className="h-5 w-5" />,
  },
  {
    label: "Error Count",
    value: "23",
    trend: { value: "-8.1%", positive: false },
    icon: <AlertTriangle className="h-5 w-5" />,
  },
];

const iconConfigs = [
  { bg: "bg-blue-500/10", color: "text-blue-400", glow: "shadow-blue-500/20" },
  { bg: "bg-purple-500/10", color: "text-purple-400", glow: "shadow-purple-500/20" },
  { bg: "bg-emerald-500/10", color: "text-emerald-400", glow: "shadow-emerald-500/20" },
  { bg: "bg-cyan-500/10", color: "text-cyan-400", glow: "shadow-cyan-500/20" },
  { bg: "bg-amber-500/10", color: "text-amber-400", glow: "shadow-amber-500/20" },
  { bg: "bg-red-500/10", color: "text-red-400", glow: "shadow-red-500/20" },
];

export function StatsOverview({
  stats = defaultStats,
  isLoading,
}: StatsOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="premium-card p-4">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-4 w-20 bg-white/5" />
              <Skeleton className="h-8 w-28 bg-white/5" />
              <Skeleton className="h-3 w-16 bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat, index) => {
        const config = iconConfigs[index] ?? { bg: "bg-muted/20", color: "text-muted-foreground", glow: "" };
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="premium-card p-4 group cursor-default">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                  {stat.trend && (
                    <div className="flex items-center gap-1">
                      {stat.trend.positive ? (
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                      )}
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          stat.trend.positive
                            ? "text-emerald-500"
                            : "text-red-500",
                        )}
                      >
                        {stat.trend.value}
                      </span>
                    </div>
                  )}
                </div>
                <div
                  className={cn(
                    "rounded-xl p-2.5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg",
                    config.bg,
                    config.color,
                    config.glow,
                  )}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
