"use client";

import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const revenueData = [
  { month: "Jan", mrr: 12000, arr: 144000 },
  { month: "Feb", mrr: 15000, arr: 180000 },
  { month: "Mar", mrr: 18000, arr: 216000 },
  { month: "Apr", mrr: 22000, arr: 264000 },
  { month: "May", mrr: 25000, arr: 300000 },
  { month: "Jun", mrr: 28000, arr: 336000 },
  { month: "Jul", mrr: 32000, arr: 384000 },
  { month: "Aug", mrr: 35000, arr: 420000 },
  { month: "Sep", mrr: 38000, arr: 456000 },
  { month: "Oct", mrr: 42000, arr: 504000 },
  { month: "Nov", mrr: 45000, arr: 540000 },
  { month: "Dec", mrr: 48000, arr: 576000 },
];

const recentTransactions = [
  { id: "1", user: "Alice Johnson", amount: 15.00, type: "subscription", status: "completed", date: "2024-06-15" },
  { id: "2", user: "Bob Smith", amount: 134.90, type: "subscription", status: "completed", date: "2024-06-14" },
  { id: "3", user: "Carol White", amount: 29.00, type: "subscription", status: "pending", date: "2024-06-13" },
  { id: "4", user: "David Brown", amount: 99.99, type: "one-time", status: "completed", date: "2024-06-12" },
  { id: "5", user: "Eve Davis", amount: 259.90, type: "subscription", status: "completed", date: "2024-06-11" },
];

const payouts = [
  { id: "1", amount: 15000, method: "Bank Transfer", status: "completed", date: "2024-06-01" },
  { id: "2", amount: 12000, method: "Bank Transfer", status: "completed", date: "2024-05-01" },
  { id: "3", amount: 10000, method: "Bank Transfer", status: "pending", date: "2024-07-01" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value);

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 shadow-elevated border-border/50">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm mt-0.5" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

const kpiCards = [
  {
    label: "MRR", value: "$48,000", trend: "+12.5%", positive: true,
    icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10",
  },
  {
    label: "ARR", value: "$576,000", trend: "Annual run rate", positive: true,
    icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10",
  },
  {
    label: "ARPU", value: "$6.67", trend: "+8.3%", positive: true,
    icon: Users, color: "text-purple-400", bg: "bg-purple-500/10",
  },
  {
    label: "Churn Rate", value: "3.2%", trend: "-0.8%", positive: false,
    icon: Activity, color: "text-rose-400", bg: "bg-rose-500/10",
  },
];

export default function AdminFinancial() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="gradient-text text-2xl font-bold tracking-tight">Financial</h1>
        <p className="text-sm text-muted-foreground mt-1">Revenue and financial data</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="premium-card p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <div className="flex items-center gap-1">
                    {card.positive ? (
                      <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-emerald-500" />
                    )}
                    <span className={`text-xs font-semibold ${card.positive ? 'text-emerald-500' : 'text-emerald-500'}`}>
                      {card.trend}
                    </span>
                  </div>
                </div>
                <div className={`rounded-xl p-3 ${card.bg} ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="premium-card p-6">
          <div className="mb-6">
            <h3 className="text-sm font-semibold">Revenue Growth</h3>
            <p className="text-xs text-muted-foreground mt-0.5">MRR vs ARR over time</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="mrrGradFinancial" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="arrGradFinancial" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 10%)" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(0 0% 45%)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(0 0% 45%)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="mrr" name="MRR" stroke="#8b5cf6" fill="url(#mrrGradFinancial)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="arr" name="ARR" stroke="#06b6d4" fill="url(#arrGradFinancial)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="premium-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h3 className="text-sm font-semibold">Recent Transactions</h3>
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
                  <TableHead className="text-xs text-muted-foreground">User</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-xs text-muted-foreground hidden sm:table-cell">Type</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs text-muted-foreground hidden md:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((tx, i) => (
                  <TableRow key={tx.id} className="border-b border-border/20 hover:bg-primary/5 transition-colors">
                    <TableCell className="text-sm font-medium">{tx.user}</TableCell>
                    <TableCell className="text-sm font-semibold">{formatCurrency(tx.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground capitalize hidden sm:table-cell">{tx.type}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        tx.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {tx.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{tx.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="premium-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <h3 className="text-sm font-semibold">Payouts</h3>
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View All <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
                  <TableHead className="text-xs text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Method</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id} className="border-b border-border/20 hover:bg-primary/5 transition-colors">
                    <TableCell className="text-sm font-semibold">{formatCurrency(payout.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{payout.method}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        payout.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {payout.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{payout.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 border-t border-border/30">
              <Button variant="outline" className="w-full text-sm border-border/50 hover:bg-primary/5">
                View All Payouts
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
