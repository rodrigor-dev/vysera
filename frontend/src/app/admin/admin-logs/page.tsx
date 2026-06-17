"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AdminLogEntry {
  id: string;
  admin: string;
  action: string;
  target: string;
  ip: string;
  date: string;
  details: string;
}

const mockLogs: AdminLogEntry[] = [
  { id: "1", admin: "admin@vysera.com", action: "user.delete", target: "alice@example.com", ip: "192.168.1.100", date: "2024-06-15 14:32:10", details: "Deleted user account" },
  { id: "2", admin: "admin@vysera.com", action: "user.role.update", target: "bob@example.com", ip: "192.168.1.100", date: "2024-06-15 14:30:00", details: "Changed role from user to pro" },
  { id: "3", admin: "superadmin@vysera.com", action: "payment.refund", target: "INV-003", ip: "10.0.0.50", date: "2024-06-15 14:25:00", details: "Refunded payment of $29.99" },
  { id: "4", admin: "admin@vysera.com", action: "settings.update", target: "system", ip: "192.168.1.100", date: "2024-06-15 14:20:00", details: "Updated email template settings" },
  { id: "5", admin: "superadmin@vysera.com", action: "admin.create", target: "newadmin@vysera.com", ip: "10.0.0.50", date: "2024-06-15 14:15:00", details: "Created new admin account" },
  { id: "6", admin: "admin@vysera.com", action: "project.delete", target: "project_123", ip: "192.168.1.100", date: "2024-06-15 14:10:00", details: "Deleted project due to TOS violation" },
  { id: "7", admin: "superadmin@vysera.com", action: "user.suspend", target: "spammer@example.com", ip: "10.0.0.50", date: "2024-06-15 14:05:00", details: "Suspended user for spam behavior" },
  { id: "8", admin: "admin@vysera.com", action: "export.override", target: "export_456", ip: "192.168.1.100", date: "2024-06-15 14:00:00", details: "Override failed export status" },
];

const actionStyles: Record<string, string> = {
  "user.delete": "bg-red-500/10 text-red-400 border-red-500/20",
  "user.suspend": "bg-red-500/10 text-red-400 border-red-500/20",
  "payment.refund": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "admin.create": "bg-primary/10 text-primary border-primary/20",
  "user.role.update": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "settings.update": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "project.delete": "bg-red-500/10 text-red-400 border-red-500/20",
  "export.override": "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const defaultStyle = "bg-muted text-muted-foreground border-border";

export default function AdminAdminLogs() {
  const [search, setSearch] = useState("");
  const [adminFilter, setAdminFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);

  const admins = [...new Set(mockLogs.map((l) => l.admin))];
  const actions = [...new Set(mockLogs.map((l) => l.action))];

  const filtered = mockLogs.filter((log) => {
    const matchesSearch =
      log.admin.toLowerCase().includes(search.toLowerCase()) ||
      log.target.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());
    const matchesAdmin = adminFilter === "all" || log.admin === adminFilter;
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    return matchesSearch && matchesAdmin && matchesAction;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="gradient-text text-2xl font-bold tracking-tight">Admin Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-1">Track all administrator actions</p>
        </div>
        <Button variant="ghost" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="flex flex-col gap-3 p-4 border-b border-border/30 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="premium-input w-full pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-2">
            <Select value={adminFilter} onValueChange={setAdminFilter}>
              <SelectTrigger className="w-full sm:w-[180px] premium-input">
                <SelectValue placeholder="All Admins" />
              </SelectTrigger>
              <SelectContent className="glass-strong border-border/50">
                <SelectItem value="all">All Admins</SelectItem>
                {admins.map((admin) => (
                  <SelectItem key={admin} value={admin}>{admin}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[180px] premium-input">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent className="glass-strong border-border/50">
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map((action) => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">No audit logs found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Target</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">IP Address</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log, index) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group border-b border-border/20 transition-all duration-200 hover:bg-primary/5"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm font-medium">{log.admin}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                        actionStyles[log.action] || defaultStyle
                      )}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{log.target}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground hidden lg:table-cell">{log.ip}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{log.date}</TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between border-t border-border/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {filtered.length} of {mockLogs.length} logs
              </p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">Page {page} of 1</span>
                <Button variant="ghost" size="icon" disabled={page >= 1} onClick={() => setPage(page + 1)} className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
