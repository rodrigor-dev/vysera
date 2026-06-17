"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Users } from "lucide-react";

interface RevenueChartProps {
  data?: { date: string; revenue: number; users: number }[];
  isLoading?: boolean;
}

const defaultData = [
  { date: "Jan", revenue: 12000, users: 240 },
  { date: "Feb", revenue: 15000, users: 280 },
  { date: "Mar", revenue: 18000, users: 320 },
  { date: "Apr", revenue: 22000, users: 380 },
  { date: "May", revenue: 25000, users: 420 },
  { date: "Jun", revenue: 28000, users: 450 },
  { date: "Jul", revenue: 32000, users: 510 },
  { date: "Aug", revenue: 35000, users: 540 },
  { date: "Sep", revenue: 38000, users: 580 },
  { date: "Oct", revenue: 42000, users: 620 },
  { date: "Nov", revenue: 45000, users: 660 },
  { date: "Dec", revenue: 48000, users: 700 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

function CustomTooltip({ active, payload, label, metric }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 shadow-elevated border-border/50">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-sm text-primary font-semibold mt-1">
        {metric === "revenue"
          ? formatCurrency(payload[0].value)
          : formatNumber(payload[0].value)}
      </p>
    </div>
  );
}

export function RevenueChart({
  data = defaultData,
  isLoading,
}: RevenueChartProps) {
  const [metric, setMetric] = useState<"revenue" | "users">("revenue");

  if (isLoading) {
    return (
      <div className="premium-card p-6">
        <Skeleton className="h-6 w-40 bg-white/5" />
        <Skeleton className="h-[300px] w-full mt-4 bg-white/5" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="premium-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold">Revenue Overview</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {metric === "revenue" ? "Monthly revenue trends" : "New user signups"}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setMetric("revenue")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300",
                metric === "revenue"
                  ? "bg-primary/20 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <DollarSign className="h-3.5 w-3.5" />
              Revenue
            </button>
            <button
              onClick={() => setMetric("users")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300",
                metric === "users"
                  ? "bg-primary/20 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Users className="h-3.5 w-3.5" />
              Users
            </button>
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="barGradUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(0 0% 10%)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="hsl(0 0% 45%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(0 0% 45%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  metric === "revenue"
                    ? `$${(v / 1000).toFixed(0)}k`
                    : formatNumber(v)
                }
              />
              <Tooltip
                content={<CustomTooltip metric={metric} />}
                cursor={{ fill: "hsl(0 0% 8%)", opacity: 0.5 }}
              />
              <Bar
                dataKey={metric}
                fill={metric === "revenue" ? "url(#barGrad)" : "url(#barGradUsers)"}
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
