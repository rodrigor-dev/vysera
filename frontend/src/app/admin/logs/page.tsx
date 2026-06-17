"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ListFilter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type Severity = "info" | "warning" | "error" | "critical";

interface LogEntry {
  id: string;
  timestamp: string;
  level: Severity;
  source: string;
  message: string;
  user: string;
}

const mockLogs: LogEntry[] = [
  { id: "1", timestamp: "2024-06-15 14:32:10", level: "info", source: "auth", message: "User login successful", user: "alice@example.com" },
  { id: "2", timestamp: "2024-06-15 14:30:00", level: "warning", source: "api", message: "Rate limit approaching for IP 192.168.1.1", user: "system" },
  { id: "3", timestamp: "2024-06-15 14:28:45", level: "error", source: "database", message: "Query timeout exceeded: SELECT * FROM projects", user: "system" },
  { id: "4", timestamp: "2024-06-15 14:25:30", level: "critical", source: "payment", message: "Payment gateway connection lost", user: "system" },
  { id: "5", timestamp: "2024-06-15 14:20:00", level: "info", source: "export", message: "Video export completed: project_123.mp4", user: "bob@example.com" },
  { id: "6", timestamp: "2024-06-15 14:15:00", level: "warning", source: "storage", message: "Storage capacity at 85%", user: "system" },
  { id: "7", timestamp: "2024-06-15 14:10:00", level: "info", source: "auth", message: "New user registered", user: "carol@example.com" },
  { id: "8", timestamp: "2024-06-15 14:05:00", level: "error", source: "api", message: "Invalid request payload: missing required field", user: "david@example.com" },
];

const severityConfig: Record<Severity, { label: string; style: string }> = {
  info: { label: "Info", style: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  warning: { label: "Warning", style: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  error: { label: "Error", style: "bg-red-500/10 text-red-400 border-red-500/20" },
  critical: { label: "Critical", style: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

const severityPills = [
  { label: "All", value: "all" },
  { label: "Info", value: "info" },
  { label: "Warning", value: "warning" },
  { label: "Error", value: "error" },
  { label: "Critical", value: "critical" },
];

export default function AdminLogs() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = mockLogs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      log.source.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity =
      severityFilter === "all" || log.level === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="gradient-text text-2xl font-bold tracking-tight">System Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor system activity</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <Label htmlFor="auto-refresh" className="text-xs text-muted-foreground">Auto-refresh</Label>
          </div>
          <Button variant="ghost" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="flex flex-col gap-3 p-4 border-b border-border/30 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="premium-input w-full pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <ListFilter className="h-4 w-4 text-muted-foreground shrink-0" />
            {severityPills.map((pill) => (
              <button
                key={pill.value}
                onClick={() => setSeverityFilter(pill.value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap",
                  severityFilter === pill.value
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "bg-muted text-muted-foreground border border-border hover:border-primary/20 hover:text-foreground",
                )}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium">No logs found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timestamp</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Level</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Message</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log, index) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="group border-b border-border/20 transition-all duration-200 hover:bg-primary/5"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">{log.timestamp}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${severityConfig[log.level].style}`}>
                        {severityConfig[log.level].label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{log.source}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-md truncate hidden md:table-cell">{log.message}</TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{log.user}</TableCell>
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
