"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ProjectCard, ProjectCardSkeleton } from "@/components/dashboard/project-card";
import {
  FolderOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import type { Project, ProjectStatus } from "@/types";

const filters: { label: string; value: ProjectStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Processing", value: "processing" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export default function LibraryPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeFilter, setActiveFilter] = useState<ProjectStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({ limit: String(perPage * 3) });
        if (activeFilter !== "all") params.set("status", activeFilter);
        const response = await fetch(`/api/user/projects?${params}`);
        if (!response.ok) throw new Error("Failed to load projects");
        const data = await response.json();
        setProjects(data.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };
    loadProjects();
  }, [activeFilter]);

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    setPage(1);
  }, [activeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="gradient-text text-3xl font-bold tracking-tight">
            Project Library
          </h1>
          <p className="text-muted-foreground/60">
            Browse and manage all your projects
          </p>
        </div>
        <Button asChild className="gap-2 bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25">
          <Link href="/dashboard/create">
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                activeFilter === f.value
                  ? "bg-primary/15 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.1)]"
                  : "text-muted-foreground/70 hover:bg-accent/30 hover:text-foreground bg-muted/30",
              )}
            >
              <span className={cn(
                "status-dot mr-1.5",
                f.value === "completed" && "bg-success",
                f.value === "processing" && "bg-warning",
                f.value === "draft" && "bg-muted-foreground",
                f.value === "failed" && "bg-destructive",
                f.value === "all" && "bg-primary/50",
              )} />
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
          <input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="premium-input h-10 w-full pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40"
          />
        </div>
      </div>

      {error && (
        <ErrorState
          title="Failed to load projects"
          message={error.message}
          onRetry={() => window.location.reload()}
        />
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && !error && paginated.length === 0 && (
        <EmptyState
          icon={<FolderOpen className="h-12 w-12" />}
          title={
            searchQuery
              ? "No projects match your search"
              : "No projects yet"
          }
          description={
            searchQuery
              ? "Try a different search term"
              : "Create your first project to get started."
          }
          action={
            !searchQuery && (
              <Button asChild className="gap-2 bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25">
                <Link href="/dashboard/create">Create Project</Link>
              </Button>
            )
          }
        />
      )}

      {!isLoading && !error && paginated.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {paginated.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
            </AnimatePresence>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="border-border/50 h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={page === i + 1 ? "default" : "outline"}
                  size="icon"
                  onClick={() => setPage(i + 1)}
                  className={cn(
                    "h-9 w-9",
                    page === i + 1
                      ? "bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25"
                      : "border-border/50",
                  )}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="border-border/50 h-9 w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
