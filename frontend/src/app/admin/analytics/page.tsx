"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Film,
  CalendarRange,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const userGrowthData = [
  { month: "Jan", users: 1200, active: 800 },
  { month: "Feb", users: 1450, active: 950 },
  { month: "Mar", users: 1800, active: 1200 },
  { month: "Apr", users: 2200, active: 1500 },
  { month: "May", users: 2700, active: 1800 },
  { month: "Jun", users: 3200, active: 2100 },
  { month: "Jul", users: 3800, active: 2500 },
  { month: "Aug", users: 4400, active: 2900 },
  { month: "Sep", users: 5100, active: 3400 },
  { month: "Oct", users: 5800, active: 3900 },
  { month: "Nov", users: 6500, active: 4400 },
  { month: "Dec", users: 7200, active: 5000 },
];

const revenueData = [
  { month: "Jan", revenue: 12000, subscriptions: 8000, oneTime: 4000 },
  { month: "Feb", revenue: 15000, subscriptions: 10000, oneTime: 5000 },
  { month: "Mar", revenue: 18000, subscriptions: 12000, oneTime: 6000 },
  { month: "Apr", revenue: 22000, subscriptions: 15000, oneTime: 7000 },
  { month: "May", revenue: 25000, subscriptions: 17000, oneTime: 8000 },
  { month: "Jun", revenue: 28000, subscriptions: 19000, oneTime: 9000 },
  { month: "Jul", revenue: 32000, subscriptions: 22000, oneTime: 10000 },
  { month: "Aug", revenue: 35000, subscriptions: 24000, oneTime: 11000 },
  { month: "Sep", revenue: 38000, subscriptions: 26000, oneTime: 12000 },
  { month: "Oct", revenue: 42000, subscriptions: 29000, oneTime: 13000 },
  { month: "Nov", revenue: 45000, subscriptions: 31000, oneTime: 14000 },
  { month: "Dec", revenue: 48000, subscriptions: 33000, oneTime: 15000 },
];

const projectData = [
  { month: "Jan", projects: 450 },
  { month: "Feb", projects: 520 },
  { month: "Mar", projects: 610 },
  { month: "Apr", projects: 720 },
  { month: "May", projects: 850 },
  { month: "Jun", projects: 940 },
  { month: "Jul", projects: 1100 },
  { month: "Aug", projects: 1250 },
  { month: "Sep", projects: 1400 },
  { month: "Oct", projects: 1580 },
  { month: "Nov", projects: 1720 },
  { month: "Dec", projects: 1900 },
];

const platformData = [
  { name: "Web App", value: 45 },
  { name: "Mobile", value: 30 },
  { name: "API", value: 15 },
  { name: "CLI", value: 10 },
];

const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 shadow-elevated border-border/50">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm mt-0.5" style={{ color: entry.color }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

const dateRanges = ["Week", "Month", "Year"];

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState("Year");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="gradient-text text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform analytics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {dateRanges.map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300",
                  dateRange === range
                    ? "bg-primary/20 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {range}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">User Growth</h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData}>
                  <defs>
                    <linearGradient id="usersGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="activeGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 10%)" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(0 0% 45%)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(0 0% 45%)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                  <Tooltip content={<ChartTooltip formatter={formatNumber} />} />
                  <Area type="monotone" dataKey="users" name="Total Users" stroke="#8b5cf6" fill="url(#usersGradAnalytics)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="active" name="Active Users" stroke="#06b6d4" fill="url(#activeGradAnalytics)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold">Revenue Breakdown</h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <defs>
                    <linearGradient id="subsGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="oneTimeGradAnalytics" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 10%)" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(0 0% 45%)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(0 0% 45%)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
                  <Bar dataKey="subscriptions" name="Subscriptions" fill="url(#subsGradAnalytics)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="oneTime" name="One-Time" fill="url(#oneTimeGradAnalytics)" radius={[4, 4, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Film className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold">Project Creation</h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projectData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 10%)" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(0 0% 45%)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(0 0% 45%)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                  <Tooltip content={<ChartTooltip formatter={formatNumber} />} />
                  <Line type="monotone" dataKey="projects" name="Projects" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: "#8b5cf6", r: 3, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-semibold">Platform Usage</h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {platformData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip formatter={(v: number) => `${v}%`} />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-sm text-muted-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
