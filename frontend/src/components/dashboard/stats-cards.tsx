"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  FolderKanban,
  Activity,
  Download,
  HardDrive,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Stat {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend: number;
  trendLabel: string;
}

interface StatsCardsProps {
  stats?: Stat[];
  isLoading?: boolean;
  className?: string;
}

const defaultStats: Stat[] = [
  {
    label: "Total Projects",
    value: "24",
    icon: <FolderKanban className="h-5 w-5" />,
    trend: 12,
    trendLabel: "from last month",
  },
  {
    label: "Active Projects",
    value: "8",
    icon: <Activity className="h-5 w-5" />,
    trend: -3,
    trendLabel: "from last month",
  },
  {
    label: "Total Exports",
    value: "156",
    icon: <Download className="h-5 w-5" />,
    trend: 28,
    trendLabel: "from last month",
  },
  {
    label: "Storage Used",
    value: "12.4 GB",
    icon: <HardDrive className="h-5 w-5" />,
    trend: 8,
    trendLabel: "of 50 GB",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
};

const iconGradients = [
  "from-violet-500 to-fuchsia-500",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-rose-500",
];

function StatCardSkeleton() {
  return (
    <div className="premium-card p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export function StatsCards({
  stats = defaultStats,
  isLoading = false,
  className,
}: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}
    >
      {stats.map((stat, index) => (
        <motion.div key={stat.label} variants={cardVariants}>
          <div className="premium-card group relative overflow-hidden p-6">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl transition-all duration-500 group-hover:from-primary/10 group-hover:blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br",
                    iconGradients[index],
                  )}
                >
                  <div className="text-white">{stat.icon}</div>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    stat.trend >= 0
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400",
                  )}
                >
                  {stat.trend >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(stat.trend)}%
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground/50">
                  {stat.trendLabel}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
