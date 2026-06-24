"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/auth-store";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video, Upload, LayoutTemplate, ArrowRight,
  FolderKanban, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import type { Project } from "@/types";

const quickActions = [
  {
    title: "Create Video",
    description: "Let AI generate a video for you",
    icon: Video,
    href: "/dashboard/create",
    gradient: "from-violet-600 to-fuchsia-600",
    iconBg: "from-violet-500/20 to-fuchsia-500/20",
  },
  {
    title: "Upload Media",
    description: "Upload videos, images, and audio",
    icon: Upload,
    href: "/dashboard/uploads",
    gradient: "from-blue-600 to-cyan-600",
    iconBg: "from-blue-500/20 to-cyan-500/20",
  },
  {
    title: "Use Template",
    description: "Start from a pre-made template",
    icon: LayoutTemplate,
    href: "/dashboard/templates",
    gradient: "from-emerald-600 to-teal-600",
    iconBg: "from-emerald-500/20 to-teal-500/20",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<{ label: string; value: string; icon: React.ReactNode; trend: number; trendLabel: string }[] | null>(null);
  const [planUsage, setPlanUsage] = useState<{
    plan: { id: string; name: string };
    usage: Record<string, { used: number; limit: number }>;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [projRes, statsRes, usageRes] = await Promise.all([
          fetch("/api/user/projects?limit=5", { credentials: "include" }),
          fetch("/api/user/dashboard", { credentials: "include" }),
          fetch("/api/subscriptions/usage", { credentials: "include" }),
        ]);
        if (projRes.ok) {
          const data = await projRes.json();
          setProjects(data.data ?? []);
        }
        if (statsRes.ok) {
          const data = await statsRes.json();
          const s = data.stats;
          if (s) {
            setStats([
              { label: "Total Projects", value: String(s.totalProjects ?? 0), icon: <FolderKanban className="h-5 w-5" />, trend: 0, trendLabel: "all time" },
              { label: "Completed", value: String(s.completedProjects ?? 0), icon: <CheckCircle2 className="h-5 w-5" />, trend: 0, trendLabel: "finished exports" },
              { label: "Templates", value: String(s.totalTemplates ?? 0), icon: <LayoutTemplate className="h-5 w-5" />, trend: 0, trendLabel: "saved templates" },
              { label: "Uploads", value: String(s.totalUploads ?? 0), icon: <Upload className="h-5 w-5" />, trend: 0, trendLabel: "files uploaded" },
            ]);
          }
        }
        if (usageRes.ok) {
          const data = await usageRes.json();
          setPlanUsage(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const userName =
    user?.name ?? user?.email?.split("@")[0] ?? "there";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="space-y-1">
        <h1 className="gradient-text text-3xl font-bold tracking-tight">
          Welcome back, {userName}
        </h1>
        <p className="text-muted-foreground/60">
          Here&apos;s what&apos;s happening with your projects.
        </p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <StatsCards isLoading={isLoading} />
      </motion.div>

      {planUsage && (
        <motion.div variants={itemVariants} className="premium-card p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Seu plano</h2>
                <Badge variant={planUsage.plan.id === "free" ? "secondary" : "default"}>
                  {planUsage.plan.name}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground/70">
                Limites aplicados automaticamente no backend para proteger custos e liberar cobrança mensal.
              </p>
            </div>
            {planUsage.plan.id === "free" && (
              <Button asChild>
                <Link href="/dashboard/upgrade">Fazer upgrade PRO</Link>
              </Button>
            )}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              ["Projetos", planUsage.usage.projects],
              ["Exports hoje", planUsage.usage.exportsToday],
              ["Uploads no mês", planUsage.usage.uploadsThisMonth],
            ].map(([label, item]) => {
              const usage = item as { used: number; limit: number };
              const pct = usage.limit > 0 ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0;
              return (
                <div key={label as string} className="rounded-xl border border-border/50 bg-background/50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{label as string}</span>
                    <span className="text-muted-foreground">{usage.used}/{usage.limit}</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => (
            <Link key={action.title} href={action.href}>
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="group cursor-pointer"
              >
                <div className="premium-card relative overflow-hidden p-6">
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                      action.iconBg,
                    )}
                  />
                  <div className="relative flex items-start gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
                        action.gradient,
                      )}
                    >
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{action.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground/70">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 h-5 w-5 text-muted-foreground/20 transition-all group-hover:text-primary group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <RecentProjects
          projects={projects}
          isLoading={isLoading}
          error={error}
          onRetry={() => window.location.reload()}
        />
      </motion.div>
    </motion.div>
  );
}


