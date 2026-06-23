"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import {
  Play,
  Edit,
  Download,
  Trash2,
  MoreHorizontal,
  Clock,
  FileVideo,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project, ProjectStatus } from "@/types";

const statusConfig: Record<
  ProjectStatus,
  { label: string; dot: string }
> = {
  draft: { label: "Draft", dot: "bg-muted-foreground" },
  processing: { label: "Processing", dot: "bg-warning" },
  completed: { label: "Completed", dot: "bg-success" },
  failed: { label: "Failed", dot: "bg-destructive" },
};

const gradients = [
  "from-violet-600/30 via-fuchsia-600/20 to-violet-600/10",
  "from-blue-600/30 via-cyan-600/20 to-blue-600/10",
  "from-emerald-600/30 via-teal-600/20 to-emerald-600/10",
  "from-orange-600/30 via-rose-600/20 to-orange-600/10",
  "from-pink-600/30 via-purple-600/20 to-pink-600/10",
  "from-amber-600/30 via-yellow-600/20 to-amber-600/10",
];

interface ProjectCardProps {
  project: Project;
  index?: number;
  onEdit?: (project: Project) => void;
  onExport?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onPlay?: (project: Project) => void;
}

export function ProjectCard({
  project,
  index = 0,
  onEdit,
  onExport,
  onDelete,
  onPlay,
}: ProjectCardProps) {
  const gradient = gradients[index % gradients.length];
  const status = statusConfig[project.status] || statusConfig.draft;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <div className="premium-card relative overflow-hidden">
        <div
          className={cn(
            "relative flex aspect-video items-center justify-center bg-gradient-to-br",
            gradient,
          )}
        >
          {project.thumbnail && (
            <img
              src={project.thumbnail}
              alt={project.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100">
            {project.status === "completed" && (
              <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-white/90 text-black shadow-lg shadow-black/20 backdrop-blur-sm hover:bg-white"
                onClick={() => onPlay?.(project)}
              >
                <Play className="h-5 w-5" />
              </Button>
            )}
            <Button
              size="icon"
              className="h-10 w-10 rounded-full bg-white/90 text-black shadow-lg shadow-black/20 backdrop-blur-sm hover:bg-white"
              onClick={() => onEdit?.(project)}
            >
              <Edit className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full bg-white/90 text-black shadow-lg shadow-black/20 backdrop-blur-sm hover:bg-white"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-strong border-border/50">
                <DropdownMenuLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                  Actions
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={() => onExport?.(project)} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem
                  onClick={() => onDelete?.(project)}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {!project.thumbnail && (
            <div className="flex flex-col items-center gap-1">
              <FileVideo className="h-8 w-8 text-white/20" />
              <span className="text-xs font-medium text-white/30">
                {project.title?.charAt(0).toUpperCase() ?? "?"}
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold">{project.title}</h3>
            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-background/50 px-2 py-0.5">
              <span className={cn("status-dot", status.dot, status.dot === "bg-success" && "shadow-[0_0_6px_hsl(var(--success)/0.5)]")} />
              <span className="text-[11px] font-medium text-muted-foreground">
                {status.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground/50">
            <Clock className="h-3 w-3" />
            <span>
              {project.updatedAt
                ? formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })
                : "Unknown"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="premium-card overflow-hidden">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
