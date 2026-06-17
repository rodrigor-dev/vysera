"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Severity = "low" | "medium" | "high" | "critical";
type ResolutionStatus = "open" | "investigating" | "resolved";

interface ErrorEntry {
  id: string;
  message: string;
  source: string;
  severity: Severity;
  status: ResolutionStatus;
  count: number;
  lastOccurred: string;
  firstOccurred: string;
  details: string;
}

const mockErrors: ErrorEntry[] = [
  {
    id: "1",
    message: "Database connection timeout after 30s",
    source: "database",
    severity: "critical",
    status: "investigating",
    count: 145,
    lastOccurred: "2 min ago",
    firstOccurred: "2024-06-10",
    details: "Connection pool exhausted. Max connections reached. Consider increasing pool size or optimizing queries.",
  },
  {
    id: "2",
    message: "Payment gateway 503 Service Unavailable",
    source: "payment",
    severity: "high",
    status: "open",
    count: 89,
    lastOccurred: "15 min ago",
    firstOccurred: "2024-06-12",
    details: "Stripe API returning 503 errors intermittently. May be a regional outage.",
  },
  {
    id: "3",
    message: "Rate limit exceeded for IP 203.0.113.0",
    source: "api",
    severity: "medium",
    status: "resolved",
    count: 234,
    lastOccurred: "1 hour ago",
    firstOccurred: "2024-06-08",
    details: "IP temporarily blocked. Automatic unblock after rate limit window expired.",
  },
  {
    id: "4",
    message: "Video processing failed: out of memory",
    source: "processing",
    severity: "high",
    status: "investigating",
    count: 56,
    lastOccurred: "3 hours ago",
    firstOccurred: "2024-06-13",
    details: "FFmpeg process killed by OOM killer. Worker node needs more memory allocation.",
  },
  {
    id: "5",
    message: "Invalid JWT token signature",
    source: "auth",
    severity: "low",
    status: "resolved",
    count: 12,
    lastOccurred: "1 day ago",
    firstOccurred: "2024-06-14",
    details: "Old tokens from previous key rotation. Clients updated, no longer occurring.",
  },
];

const severityConfig: Record<Severity, { label: string; style: string }> = {
  low: { label: "Low", style: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  medium: { label: "Medium", style: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  high: { label: "High", style: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  critical: { label: "Critical", style: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const statusConfig: Record<ResolutionStatus, { label: string; icon: React.ReactNode; style: string }> = {
  open: { label: "Open", icon: <XCircle className="h-3 w-3" />, style: "text-red-500" },
  investigating: { label: "Investigating", icon: <Clock className="h-3 w-3" />, style: "text-amber-500" },
  resolved: { label: "Resolved", icon: <CheckCircle className="h-3 w-3" />, style: "text-emerald-500" },
};

const statusTabs = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Investigating", value: "investigating" },
  { label: "Resolved", value: "resolved" },
];

const summaryCards = [
  { label: "Total Errors", value: "5", icon: AlertTriangle, color: "text-muted-foreground", bg: "bg-muted" },
  { label: "Critical", value: "1", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
  { label: "High", value: "2", icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10" },
  { label: "Open", value: "1", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
];

function ErrorCard({ error }: { error: ErrorEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-card overflow-hidden transition-all duration-300"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex flex-1 items-center gap-3">
          <div className={cn(
            "rounded-lg p-2 transition-all duration-300",
            severityConfig[error.severity].style
          )}>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium truncate">{error.message}</p>
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border shrink-0",
                severityConfig[error.severity].style
              )}>
                {severityConfig[error.severity].label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground">{error.source}</span>
              <span className="text-xs text-muted-foreground">{error.count} occurrences</span>
              <span className={cn("flex items-center gap-1 text-xs", statusConfig[error.status].style)}>
                {statusConfig[error.status].icon}
                {statusConfig[error.status].label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4 shrink-0">
          <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">{error.lastOccurred}</span>
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-300" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-300" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border/30"
          >
            <div className="p-4 space-y-3 bg-muted/20">
              <div className="rounded-xl bg-muted/50 p-3 border border-border/20">
                <p className="text-sm text-muted-foreground leading-relaxed">{error.details}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>First occurred: {error.firstOccurred}</span>
                <span>Last occurred: {error.lastOccurred}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20">
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  Mark Resolved
                </Button>
                <Button size="sm" variant="ghost" className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
                  Assign
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AdminErrors() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockErrors.filter((err) => {
    const matchesSearch =
      err.message.toLowerCase().includes(search.toLowerCase()) ||
      err.source.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || err.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="gradient-text text-2xl font-bold tracking-tight">Error Monitor</h1>
        <p className="text-sm text-muted-foreground mt-1">Track and resolve platform errors</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="grid gap-4 sm:grid-cols-4"
      >
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="premium-card p-4 flex items-center gap-4">
              <div className={`rounded-xl p-3 ${card.bg} ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold">{card.value}</p>
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
        <div className="premium-card overflow-hidden">
          <div className="flex flex-col gap-3 p-4 border-b border-border/30 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search errors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="premium-input w-full pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1 overflow-x-auto scrollbar-none">
              {statusTabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 whitespace-nowrap",
                    statusFilter === tab.value
                      ? "bg-primary/20 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 space-y-2">
            {filtered.map((error) => (
              <ErrorCard key={error.id} error={error} />
            ))}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">No errors found</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
