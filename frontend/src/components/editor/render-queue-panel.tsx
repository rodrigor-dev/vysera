"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  FileVideo,
  List,
} from "lucide-react";

interface QueueJob {
  id: string;
  exportId: string;
  status: "queued" | "rendering" | "completed" | "failed";
  progress: number;
  stage: string;
  projectName?: string;
  position?: number;
}

interface RenderQueuePanelProps {
  open: boolean;
  onClose: () => void;
}

export function RenderQueuePanel({ open, onClose }: RenderQueuePanelProps) {
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/exports?limit=10&status=active");
      if (!res.ok) return;
      const data = await res.json();
      setJobs(
        (data.data ?? []).map((exp: any) => ({
          id: `export-${exp.id}`,
          exportId: exp.id,
          status: exp.status === "rendering" || exp.status === "queued" ? exp.status : "completed",
          progress: exp.progress || 0,
          stage: exp.stage || exp.status,
          projectName: exp.metadata?.projectName || exp.projectId,
        })),
      );
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, [open, fetchQueue]);

  const activeJobs = jobs.filter((j) => j.status === "rendering" || j.status === "queued");
  const recentJobs = jobs.filter((j) => j.status === "completed" || j.status === "failed").slice(0, 5);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed right-4 top-16 z-40 flex h-[calc(100vh-6rem)] w-80 flex-col rounded-2xl border border-border/30 bg-gradient-to-b from-card/95 to-card/80 shadow-2xl backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between border-b border-border/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Render Queue</span>
              {activeJobs.length > 0 && (
                <Badge variant="default" className="h-5 px-1.5 text-[10px]">
                  {activeJobs.length}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} className="h-6 w-6">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <FileVideo className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground/40">No active renders</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeJobs.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
                      Active ({activeJobs.length})
                    </p>
                    <div className="space-y-2">
                      {activeJobs.map((job) => (
                        <QueueCard key={job.id} job={job} />
                      ))}
                    </div>
                  </div>
                )}

                {recentJobs.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40">
                      Recent
                    </p>
                    <div className="space-y-1">
                      {recentJobs.map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center gap-2 rounded-xl border border-border/10 bg-white/[0.02] px-3 py-2"
                        >
                          {job.status === "completed" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">{job.projectName || "Export"}</p>
                            <p className="text-[10px] text-muted-foreground/40 capitalize">{job.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function QueueCard({ job }: { job: QueueJob }) {
  return (
    <div className={cn(
      "rounded-xl border px-3 py-2.5 transition-colors",
      job.status === "rendering"
        ? "border-primary/20 bg-primary/[0.03]"
        : "border-border/10 bg-white/[0.02]",
    )}>
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg",
          job.status === "rendering" && "bg-primary/20",
          job.status === "queued" && "bg-muted/30",
        )}>
          {job.status === "rendering" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : (
            <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{job.projectName || "Export"}</p>
          <p className="text-[10px] text-muted-foreground/50 capitalize">
            {job.stage}
            {job.position && ` (#${job.position} in queue)`}
          </p>
        </div>
      </div>
      {job.status === "rendering" && (
        <div className="mt-2">
          <Progress value={job.progress} className="h-1" indicatorClassName="bg-gradient-to-r from-primary via-purple-500 to-cyan-500" />
          <p className="mt-1 text-right text-[10px] text-muted-foreground/40">{job.progress}%</p>
        </div>
      )}
    </div>
  );
}
