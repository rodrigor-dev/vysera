"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ReceiptText,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Crown,
  Zap,
  Shield,
  ExternalLink,
  UserX,
  UserCog,
} from "lucide-react";

interface SubscriptionRecord {
  id: string;
  userId: string;
  provider: string;
  plan: string;
  status: string;
  currentPeriodEnd?: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSubscriptions = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "20",
      ...(statusFilter !== "all" && { status: statusFilter }),
    });
    fetch(`/api/admin/subscriptions?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setSubscriptions(d.data || []);
        setTotalPages(d.pagination?.totalPages || 1);
      })
      .catch(() => toast.error("Failed to load subscriptions"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [page, statusFilter]);

  const handleGrantPro = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/subscriptions/grant-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, durationDays: 30 }),
      });
      if (res.ok) {
        toast.success("Pro access granted for 30 days");
        fetchSubscriptions();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to grant Pro");
      }
    } catch {
      toast.error("Failed to grant Pro access");
    }
    setActionLoading(null);
  };

  const handleCancel = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        toast.success("Plan cancelled");
        fetchSubscriptions();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to cancel");
      }
    } catch {
      toast.error("Failed to cancel plan");
    }
    setActionLoading(null);
  };

  const handleChangePlan = async (userId: string, newPlan: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/subscriptions/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPlan }),
      });
      if (res.ok) {
        toast.success(`Plan changed to ${newPlan}`);
        fetchSubscriptions();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to change plan");
      }
    } catch {
      toast.error("Failed to change plan");
    }
    setActionLoading(null);
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    canceled: "bg-muted/20 text-muted-foreground/60 border-border/30",
    past_due: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    trialing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    expired: "bg-destructive/20 text-destructive border-destructive/30",
  };

  const planIcons: Record<string, typeof Zap> = {
    free: Shield,
    pro: Zap,
    enterprise: Crown,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="gradient-text text-3xl font-bold tracking-tight">
            Subscriptions
          </h1>
          <p className="text-muted-foreground/60">
            Manage user subscriptions and plans
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-border/50"
          onClick={fetchSubscriptions}
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
          <input
            placeholder="Search by user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="premium-input h-10 w-full pl-10 pr-4 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="premium-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">User</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Plan</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Status</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Provider</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Period End</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Created</TableHead>
              <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground/40" />
                </TableCell>
              </TableRow>
            ) : subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <div className="text-center">
                    <ReceiptText className="mx-auto h-8 w-8 text-muted-foreground/20" />
                    <p className="mt-2 text-sm text-muted-foreground/50">No subscriptions found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub) => {
                const PlanIcon = planIcons[sub.plan] || Shield;
                return (
                  <TableRow key={sub.id} className="border-border/50 transition-colors hover:bg-accent/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10">
                          <PlanIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{sub.user.name || sub.user.email}</p>
                          <p className="text-xs text-muted-foreground/50">{sub.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary capitalize">
                        <PlanIcon className="h-3 w-3" />
                        {sub.plan}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize",
                        statusColors[sub.status] || "bg-muted/20 text-muted-foreground/60",
                      )}>
                        {sub.status === "active" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {sub.status === "canceled" && <XCircle className="mr-1 h-3 w-3" />}
                        {sub.status === "past_due" && <AlertCircle className="mr-1 h-3 w-3" />}
                        {sub.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground/70 capitalize">{sub.provider}</TableCell>
                    <TableCell className="text-sm text-muted-foreground/70">
                      {sub.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground/70">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7 text-emerald-400/50 hover:text-emerald-400"
                          disabled={actionLoading === sub.userId}
                          onClick={() => handleGrantPro(sub.userId)}
                          title="Grant 30 days Pro"
                        >
                          {actionLoading === sub.userId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Crown className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7 text-destructive/50 hover:text-destructive"
                          disabled={actionLoading === sub.userId}
                          onClick={() => handleCancel(sub.userId)}
                          title="Cancel plan"
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground/60">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
