"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { toast } from "sonner";
import {
  LayoutTemplate,
  Sparkles,
  Play,
  Clock,
  Film,
  ArrowRight,
  Clapperboard,
  Mic,
  Gamepad2,
  Globe,
  Moon,
  Gem,
  Drama,
  Podcast,
  Scissors,
  Star,
  Music,
  Zap,
  Palette,
} from "lucide-react";
import type { Template } from "@/types";

const categories = [
  "All",
  "Social Media",
  "Marketing",
  "Educational",
  "Entertainment",
  "Promotional",
];

const templateGradients = [
  "from-violet-600/30 via-fuchsia-600/20 to-violet-600/10",
  "from-blue-600/30 via-cyan-600/20 to-blue-600/10",
  "from-emerald-600/30 via-teal-600/20 to-emerald-600/10",
  "from-orange-600/30 via-rose-600/20 to-orange-600/10",
  "from-pink-600/30 via-purple-600/20 to-pink-600/10",
  "from-amber-600/30 via-yellow-600/20 to-amber-600/10",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
};

function TemplateCardSkeleton() {
  return (
    <div className="premium-card overflow-hidden">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-9 w-full mt-3" />
      </div>
    </div>
  );
}

const featuredTemplates = [
  { id: "1", name: "Cinema", desc: "Epic cinematic intro with dramatic transitions", icon: Clapperboard, gradient: "from-violet-600/30 via-fuchsia-600/20 to-violet-600/10" },
  { id: "2", name: "Vlog", desc: "Casual storytelling for daily content", icon: Film, gradient: "from-blue-600/30 via-cyan-600/20 to-blue-600/10" },
  { id: "3", name: "Viral", desc: "High-energy clips for maximum engagement", icon: Sparkles, gradient: "from-emerald-600/30 via-teal-600/20 to-emerald-600/10" },
  { id: "4", name: "Shorts", desc: "Vertical short-form content optimized", icon: Scissors, gradient: "from-orange-600/30 via-rose-600/20 to-orange-600/10" },
  { id: "5", name: "Reels", desc: "Instagram Reels with trending effects", icon: Star, gradient: "from-pink-600/30 via-purple-600/20 to-pink-600/10" },
  { id: "6", name: "Motivacional", desc: "Inspirational quotes with dynamic visuals", icon: Drama, gradient: "from-amber-600/30 via-yellow-600/20 to-amber-600/10" },
  { id: "7", name: "Podcast", desc: "Audio-first visual with waveform sync", icon: Podcast, gradient: "from-violet-600/30 via-fuchsia-600/20 to-violet-600/10" },
  { id: "8", name: "Clipe", desc: "Music video style with beat synchronization", icon: Music, gradient: "from-blue-600/30 via-cyan-600/20 to-blue-600/10" },
  { id: "9", name: "Game", desc: "Gaming montage with high-energy effects", icon: Gamepad2, gradient: "from-emerald-600/30 via-teal-600/20 to-emerald-600/10" },
  { id: "10", name: "Futurista", desc: "Cyberpunk neon aesthetic with glitch effects", icon: Globe, gradient: "from-orange-600/30 via-rose-600/20 to-orange-600/10" },
  { id: "11", name: "Dark", desc: "Moody dark theme with subtle transitions", icon: Moon, gradient: "from-pink-600/30 via-purple-600/20 to-pink-600/10" },
  { id: "12", name: "Luxo", desc: "Premium luxury brand showcase", icon: Gem, gradient: "from-amber-600/30 via-yellow-600/20 to-amber-600/10" },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({ limit: "30" });
        if (activeCategory !== "All") params.set("category", activeCategory);
        const response = await fetch(`/api/video/templates?${params}`);
        if (!response.ok) throw new Error("Failed to load templates");
        const data = await response.json();
        setTemplates(data.templates ?? []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };
    loadTemplates();
  }, [activeCategory]);

  const handleUseTemplate = (template: Template | typeof featuredTemplates[0]) => {
    toast.success(`Using template: ${template.name}`);
  };

  const displayTemplates = templates.length > 0 ? templates : featuredTemplates;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="gradient-text text-3xl font-bold tracking-tight">
          Templates
        </h1>
        <p className="text-muted-foreground/60">
          Start with a pre-made template
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
              activeCategory === cat
                ? "bg-primary/15 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.1)]"
                : "text-muted-foreground/70 hover:bg-accent/30 hover:text-foreground bg-muted/30",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {error && (
        <ErrorState
          title="Failed to load templates"
          message={error.message}
          onRetry={() => window.location.reload()}
        />
      )}

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && !error && displayTemplates.length === 0 && (
        <EmptyState
          icon={<LayoutTemplate className="h-12 w-12" />}
          title="No templates available"
          description={activeCategory !== "All"
            ? `No templates found in "${activeCategory}" category`
            : "Templates will appear here once available."
          }
        />
      )}

      {!isLoading && !error && displayTemplates.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {displayTemplates.map((template, index) => {
            const grad = templateGradients[index % templateGradients.length];
            return (
              <motion.div
                key={template.id}
                variants={cardVariants}
                whileHover={{ y: -4 }}
                className="premium-card group overflow-hidden"
              >
                <div
                  className={cn(
                    "relative flex aspect-video items-center justify-center bg-gradient-to-br",
                    grad,
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <Button
                      size="icon"
                      className="h-12 w-12 rounded-full bg-white/90 text-black shadow-lg shadow-black/20 backdrop-blur-sm hover:bg-white hover:scale-105 transition-all"
                    >
                      <Play className="h-6 w-6" />
                    </Button>
                  </div>
                  <div className="flex flex-col items-center">
                    {"icon" in template && template.icon ? (
                      <template.icon className="h-10 w-10 text-white/20" />
                    ) : (
                      <LayoutTemplate className="h-10 w-10 text-white/20" />
                    )}
                  </div>
                  {"category" in template && template.category && (
                    <Badge className="absolute top-3 left-3 bg-black/40 text-white/80 backdrop-blur-sm border-0 text-[10px]">
                      {template.category}
                    </Badge>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold">
                    {"name" in template ? template.name : (template as any).name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground/70">
                    {"description" in template
                      ? (template.description ?? "No description")
                      : template.desc}
                  </p>

                  <Button
                    size="sm"
                    className="mt-3 w-full gap-2 bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25 hover:from-primary/90 hover:to-purple-500/90 transition-all duration-300"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <Sparkles className="h-4 w-4" />
                    Use Template
                    <ArrowRight className="h-3.5 w-3.5 ml-auto opacity-60" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
