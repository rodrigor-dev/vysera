"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Download,
  Package,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowDownToLine,
  FileVideo,
  Search,
  RefreshCw,
} from "lucide-react";
import type { Export } from "@/types";

const statusConfig: Record<
  string,
  { label: string; dot: string }
> = {
  processing: { label: "Processing", dot: "bg-warning" },
  completed: { label: "Completed", dot: "bg-success" },
  failed: { label: "Failed", dot: "bg-destructive" },
};

function ExportRowSkeleton() {
  return (
    <TableRow className="border-border/50">
      <TableCell><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-lg" /><Skeleton className="h-4 w-40" /></div></TableCell>
      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
    </TableRow>
  );
}

export default function ExportsPage() {
  const [exports, setExports] = useState<Export[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadExports = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/exports?limit=20");
        if (!response.ok) throw new Error("Failed to load exports");
        const data = await response.json();
        setExports(data.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };
    loadExports();
  }, []);

  const handleDownload = (exp: Export) => {
    if (exp.fileUrl) {
      window.open(exp.fileUrl, "_blank");
      toast.success("Download started");
    } else {
      toast.error("No download link available");
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    fetch("/api/exports?limit=20")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load exports");
        return res.json();
      })
      .then((data) => {
        setExports(data.data ?? []);
        toast.success("Exports refreshed");
      })
      .catch((err) => setError(err))
      .finally(() => setIsLoading(false));
  };

  const filtered = exports.filter((exp) => {
    const projectName = (exp.metadata?.projectName as string) ?? exp.projectId;
    return projectName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="gradient-text text-3xl font-bold tracking-tight">
            Exports
          </h1>
          <p className="text-muted-foreground/60">
            Your exported videos
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-border/50"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
        <input
          placeholder="Search exports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="premium-input h-10 w-full pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40"
        />
      </div>

      {error && (
        <ErrorState
          title="Failed to load exports"
          message={error.message}
          onRetry={() => window.location.reload()}
        />
      )}

      {isLoading && (
        <div className="premium-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Project</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Format</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Resolution</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Size</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Status</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Date</TableHead>
                <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <ExportRowSkeleton key={i} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title={searchQuery ? "No exports match your search" : "No exports yet"}
          description={searchQuery ? "Try a different search term" : "Your exported videos will appear here once you export a project."}
          action={
            !searchQuery && (
              <Button asChild className="gap-2 bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25">
                <a href="/dashboard/create">Create a Video</a>
              </Button>
            )
          }
          variant="illustration"
        />
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="premium-card overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Project</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Format</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Resolution</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Size</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Status</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Date</TableHead>
                <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((exp) => {
                const status = statusConfig[exp.status] ?? {
                  label: exp.status,
                  dot: "bg-muted-foreground",
                };
                return (
                  <TableRow key={exp.id} className="border-border/50 transition-colors hover:bg-accent/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10">
                          <FileVideo className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">
                          {exp.metadata?.projectName as string ?? exp.projectId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="uppercase text-sm font-mono text-muted-foreground/70">{exp.format}</TableCell>
                    <TableCell className="text-muted-foreground/70">{exp.resolution ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground/70">
                      {exp.fileSize
                        ? `${(exp.fileSize / (1024 * 1024)).toFixed(1)} MB`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={cn("status-dot", status.dot, status.dot === "bg-success" && "shadow-[0_0_6px_hsl(var(--success)/0.5)]")} />
                        <span className="text-sm">{status.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground/60">
                      {formatDistanceToNow(new Date(exp.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground/50 hover:text-foreground"
                        disabled={exp.status !== "completed"}
                        onClick={() => handleDownload(exp)}
                      >
                        {exp.status === "processing" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : exp.status === "completed" ? (
                          <ArrowDownToLine className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </motion.div>
      )}
    </div>
  );
}
