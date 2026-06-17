"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  FileVideo,
  Clock,
} from "lucide-react";

interface ExportProgressProps {
  exportId: string;
  projectName: string;
  onComplete: () => void;
}

const STAGES = ["Queued", "Rendering", "Finalizing", "Completed"];

export function ExportProgress({ exportId, projectName, onComplete }: ExportProgressProps) {
  const [status, setStatus] = useState<string>("queued");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("Waiting in queue...");
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (status === "completed" || status === "failed") return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const pollProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/exports/${exportId}/progress`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Export not found");
          return;
        }
        return;
      }

      const data = await res.json();

      if (data.progress) {
        setStatus(data.progress.status);
        setProgress(data.progress.progress);
        if (data.progress.stage) setStage(data.progress.stage);
        if (data.progress.error) setError(data.progress.error);
      }

      if (data.progress.status === "completed") {
        setDownloadUrl(`/api/exports/${exportId}/download`);
        setProgress(100);
        setStage("Completed");
        toast.success("Export completed!");
      }

      if (data.progress.status === "failed") {
        setError(data.progress.error || "Export failed");
        toast.error("Export failed");
      }
    } catch {
      // silent retry
    }
  }, [exportId]);

  useEffect(() => {
    if (status === "completed" || status === "failed" || status === "cancelled") return;
    const interval = setInterval(pollProgress, 1500);
    pollProgress();
    return () => clearInterval(interval);
  }, [pollProgress, status]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/exports/${exportId}/cancel`, { method: "POST" });
      if (res.ok) {
        setStatus("cancelled");
        setStage("Cancelled");
        toast.success("Export cancelled");
      }
    } catch {
      toast.error("Failed to cancel");
    }
    setCancelling(false);
  };

  const handleDownload = () => {
    if (downloadUrl) window.open(downloadUrl, "_blank");
  };

  const stageIndex = STAGES.findIndex(
    (s) => s.toLowerCase() === status || (status === "rendering" && s === "Rendering"),
  );

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isDone = ["completed", "failed", "cancelled"].includes(status);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl",
          status === "completed" && "bg-success/20",
          status === "failed" && "bg-destructive/20",
          !isDone && "bg-primary/20",
        )}>
          {status === "completed" ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : status === "failed" || status === "cancelled" ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{projectName}</p>
          <p className="text-xs text-muted-foreground/60">{stage}</p>
        </div>
        {!isDone && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCancel}
            disabled={cancelling}
            className="h-7 w-7 text-muted-foreground/50 hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {!isDone && (
        <div className="space-y-2">
          <div className="relative h-2 overflow-hidden rounded-full bg-secondary/50">
            <motion.div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-purple-500 to-cyan-500",
                status === "rendering" && "animate-shimmer bg-[length:200%_100%]",
              )}
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground/60">
            <span>{progress}%</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(elapsed)}
            </span>
          </div>
        </div>
      )}

      {!isDone && (
        <div className="flex items-center gap-2">
          {STAGES.map((s, i) => {
            const isActive = i === stageIndex;
            const isPast = i < stageIndex;
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-mono font-medium transition-all duration-500",
                  isActive && "bg-primary text-white shadow-[0_0_8px_hsl(var(--primary)/0.4)]",
                  isPast && "bg-success/20 text-success",
                  !isActive && !isPast && "bg-muted/30 text-muted-foreground/40",
                )}>
                  {isPast ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={cn(
                  "text-[11px] font-medium transition-colors",
                  isActive && "text-foreground",
                  isPast && "text-success/80",
                  !isActive && !isPast && "text-muted-foreground/40",
                )}>
                  {s}
                </span>
                {i < STAGES.length - 1 && (
                  <div className={cn(
                    "h-px w-6",
                    isPast ? "bg-success/30" : "bg-border/20",
                  )} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="text-xs font-medium text-destructive">Export Failed</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground/70">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-border/20 pt-4">
        {status === "completed" && (
          <Button
            size="sm"
            className="gap-2 bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        )}
        <Button
          variant={isDone ? "default" : "outline"}
          size="sm"
          onClick={onComplete}
        >
          {isDone ? "Close" : "Minimize"}
        </Button>
      </div>
    </div>
  );
}
