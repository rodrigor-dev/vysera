"use client";

import { motion } from "framer-motion";
import {
  Users,
  Activity,
  Clock,
  ArrowRight,
  Shield,
  FileText,
  CreditCard,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { StatsOverview } from "@/components/admin/stats-overview";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { UserGrowthChart } from "@/components/admin/user-growth-chart";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const recentUsers = [
  { name: "Alice Johnson", email: "alice@example.com", status: "active", initials: "AJ", date: "2 min ago" },
  { name: "Bob Smith", email: "bob@example.com", status: "active", initials: "BS", date: "15 min ago" },
  { name: "Carol White", email: "carol@example.com", status: "active", initials: "CW", date: "1 hour ago" },
  { name: "David Brown", email: "david@example.com", status: "inactive", initials: "DB", date: "3 hours ago" },
  { name: "Eve Davis", email: "eve@example.com", status: "active", initials: "ED", date: "5 hours ago" },
];

const recentLogs = [
  { action: "User login", severity: "info", user: "alice@example.com", date: "2 min ago" },
  { action: "Payment processed", severity: "success", user: "bob@example.com", date: "10 min ago" },
  { action: "Failed login attempt", severity: "warning", user: "unknown", date: "25 min ago" },
  { action: "Project deleted", severity: "error", user: "carol@example.com", date: "1 hour ago" },
  { action: "Admin action", severity: "info", user: "admin@vysera.com", date: "2 hours ago" },
];

const severityColors: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
};

const quickActions = [
  { label: "Manage Users", icon: Users, href: "/admin/users", color: "text-blue-400" },
  { label: "View Payments", icon: CreditCard, href: "/admin/payments", color: "text-emerald-400" },
  { label: "Analytics", icon: BarChart3, href: "/admin/analytics", color: "text-purple-400" },
  { label: "Audit Logs", icon: Shield, href: "/admin/admin-logs", color: "text-amber-400" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="gradient-text text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor and manage your platform</p>
        </div>
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/admin/analytics">
            <Activity className="h-4 w-4" />
            View Analytics
          </Link>
        </Button>
      </div>

      <StatsOverview />

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart />
        <UserGrowthChart />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="premium-card">
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Recent Users</h3>
              </div>
              <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
                <Link href="/admin/users">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            <div className="p-4 space-y-3">
              {recentUsers.map((user, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 ring-1 ring-border">
                      <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                        {user.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`status-dot ${user.status === "active" ? "status-dot-active" : "status-dot-inactive"}`} />
                    <span className="text-xs text-muted-foreground">{user.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="premium-card">
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Recent Logs</h3>
              </div>
              <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
                <Link href="/admin/logs">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            <div className="p-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30">
                    <TableHead className="text-xs text-muted-foreground">Action</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Severity</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLogs.map((log, i) => (
                    <TableRow key={i} className="border-border/20 hover:bg-primary/5 transition-colors">
                      <TableCell className="text-sm font-medium">{log.action}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${severityColors[log.severity]}`}>
                          {log.severity}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="premium-card p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Quick Actions
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/30 p-3 hover:bg-primary/5 hover:border-primary/20 transition-all duration-300 group cursor-pointer">
                    <div className={`rounded-lg p-2 bg-muted ${action.color} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
