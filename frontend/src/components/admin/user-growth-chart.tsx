"use client";

import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface UserGrowthChartProps {
  data?: { date: string; total: number; new: number }[];
  isLoading?: boolean;
}

const defaultData = [
  { date: "Jan", total: 1200, new: 120 },
  { date: "Feb", total: 1450, new: 250 },
  { date: "Mar", total: 1800, new: 350 },
  { date: "Apr", total: 2200, new: 400 },
  { date: "May", total: 2700, new: 500 },
  { date: "Jun", total: 3200, new: 500 },
  { date: "Jul", total: 3800, new: 600 },
  { date: "Aug", total: 4400, new: 600 },
  { date: "Sep", total: 5100, new: 700 },
  { date: "Oct", total: 5800, new: 700 },
  { date: "Nov", total: 6500, new: 700 },
  { date: "Dec", total: 7200, new: 700 },
];

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 shadow-elevated border-border/50">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm mt-0.5" style={{ color: entry.color }}>
          {entry.name}: {formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function UserGrowthChart({
  data = defaultData,
  isLoading,
}: UserGrowthChartProps) {
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
      transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="premium-card p-6">
        <div className="mb-6">
          <h3 className="text-base font-semibold">User Growth</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Total and new user trends
          </p>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
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
                tickFormatter={formatNumber}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                name="Total Users"
                stroke="#8b5cf6"
                fill="url(#totalGrad)"
                strokeWidth={2}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="new"
                name="New Users"
                stroke="#06b6d4"
                fill="url(#newGrad)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
