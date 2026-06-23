"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileVideo,
  FileImage,
  FileAudio,
  Trash2,
  Clock,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";

interface UploadItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: string;
  projectId?: string | null;
  createdAt: string;
}

const typeIcons: Record<string, typeof FileVideo> = {
  video: FileVideo,
  image: FileImage,
  audio: FileAudio,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function UploadsPage() {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchUploads = async () => {
    try {
      setError(null);
      const res = await fetch("/api/user/uploads", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch uploads");
      const data = await res.json();
      setUploads(data.uploads ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this upload?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/user/uploads/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setUploads((prev) => prev.filter((u) => u.id !== id));
      toast.success("Upload deleted");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  const getType = (mime: string): string => {
    if (mime.startsWith("video")) return "video";
    if (mime.startsWith("image")) return "image";
    if (mime.startsWith("audio")) return "audio";
    return "video";
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-10 w-10 text-destructive/50" />
        <p className="text-sm text-muted-foreground/60">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchUploads}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="gradient-text text-2xl font-bold">Uploads</h1>
        <p className="text-sm text-muted-foreground/60">
          {uploads.length} file{uploads.length !== 1 ? "s" : ""} uploaded
        </p>
      </div>

      {uploads.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-[40vh] flex-col items-center justify-center gap-4"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-border/50 bg-white/5">
            <Upload className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium text-foreground/80">No uploads yet</h3>
            <p className="mt-1 text-xs text-muted-foreground/50">
              Files you upload will appear here
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {uploads.map((item) => {
            const Icon = typeIcons[getType(item.fileType)] || FileVideo;
            return (
              <motion.div
                key={item.id}
                variants={itemVariants}
                className="premium-card group relative overflow-hidden p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground/30 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                  >
                    {deleting === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="truncate text-sm font-medium">{item.fileName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
                    <span>{formatSize(item.fileSize)}</span>
                    <span>·</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-5 border-0 text-[10px]",
                        item.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : item.status === "processing"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-muted/50 text-muted-foreground/50"
                      )}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground/30">
                    <Clock className="h-3 w-3" />
                    {item.createdAt
                      ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })
                      : "Unknown"}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
