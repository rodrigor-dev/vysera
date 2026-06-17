"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import {
  Edit,
  Download,
  Trash2,
  MoreHorizontal,
  Eye,
  FileVideo,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
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

interface RecentProjectsProps {
  projects?: Project[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onEdit?: (project: Project) => void;
  onExport?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  className?: string;
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

export function RecentProjects({
  projects = [],
  isLoading = false,
  error = null,
  onRetry,
  onEdit,
  onExport,
  onDelete,
  className,
}: RecentProjectsProps) {
  if (error) {
    return (
      <ErrorState
        title="Failed to load projects"
        message={error.message}
        onRetry={onRetry}
        className={className}
      />
    );
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between px-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="premium-card overflow-hidden">
          <TableSkeleton />
        </div>
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className={className}>
        <EmptyState
          icon={<FileVideo className="h-12 w-12" />}
          title="No recent projects"
          description="Create your first video project to get started."
          action={
            <Button asChild className="gap-2 bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25">
              <a href="/dashboard/create">Create Project</a>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      <div className="mb-4 flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold">Recent Projects</h2>
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
          <a href="/dashboard/library">View all</a>
        </Button>
      </div>
      <div className="premium-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Project</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Status</TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Modified</TableHead>
              <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project, index) => {
              const status = statusConfig[project.status];
              return (
                <motion.tr
                  key={project.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group border-border/50 transition-colors hover:bg-accent/30"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10">
                        <FileVideo className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{project.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={cn("status-dot", status.dot, status.dot === "bg-success" && "shadow-[0_0_6px_hsl(var(--success)/0.5)]")} />
                      <span className="text-sm">{status.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground/60">
                    {formatDistanceToNow(new Date(project.updatedAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 transition-all group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-strong border-border/50">
                        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                          Actions
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuItem
                          onClick={() => onEdit?.(project)}
                          disabled={project.status === "processing"}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onExport?.(project)}
                          disabled={project.status !== "completed"}
                          className="gap-2"
                        >
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
                  </TableCell>
                </motion.tr>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
