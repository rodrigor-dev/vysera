"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Music2,
  Smartphone,
  Youtube,
  Twitter,
  Monitor,
  Check,
  Zap,
  Clapperboard,
} from "lucide-react";

interface Preset {
  id: string;
  name: string;
  description: string;
  icon: typeof Music2;
  color: string;
  format: string;
  resolution: string;
  fps: number;
  platform: string;
  badge?: string;
}

const PRESETS: Preset[] = [
  {
    id: "tiktok",
    name: "TikTok",
    description: "Vertical 9:16, 60fps, vibrant",
    icon: Music2,
    color: "from-pink-500/20 via-purple-500/20 to-cyan-500/20",
    format: "mp4",
    resolution: "p1080",
    fps: 60,
    platform: "tiktok",
    badge: "Popular",
  },
  {
    id: "instagram",
    name: "Instagram Post",
    description: "Square 1:1, 30fps, vibrant",
    icon: Smartphone,
    color: "from-orange-500/20 via-pink-500/20 to-purple-500/20",
    format: "mp4",
    resolution: "p1080",
    fps: 30,
    platform: "instagram",
    badge: "Popular",
  },
  {
    id: "instagram-reel",
    name: "Instagram Reel",
    description: "Vertical 9:16, 30fps, optimized",
    icon: Clapperboard,
    color: "from-pink-500/20 via-red-500/20 to-orange-500/20",
    format: "mp4",
    resolution: "p1080",
    fps: 30,
    platform: "instagram-reel",
    badge: "Trending",
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Full HD 16:9, 30fps, high quality",
    icon: Youtube,
    color: "from-red-500/20 via-red-600/20 to-rose-500/20",
    format: "mp4",
    resolution: "p1080",
    fps: 30,
    platform: "youtube",
  },
  {
    id: "youtube-shorts",
    name: "YouTube Shorts",
    description: "Vertical 9:16, 60fps",
    icon: Youtube,
    color: "from-red-500/20 via-red-600/20 to-rose-500/20",
    format: "mp4",
    resolution: "p1080",
    fps: 60,
    platform: "youtube_shorts",
    badge: "New",
  },
  {
    id: "twitter",
    name: "X / Twitter",
    description: "Optimized 16:9, 30fps",
    icon: Twitter,
    color: "from-sky-500/20 via-blue-500/20 to-indigo-500/20",
    format: "mp4",
    resolution: "p720",
    fps: 30,
    platform: "twitter",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Professional 16:9",
    icon: Monitor,
    color: "from-blue-500/20 via-blue-600/20 to-indigo-500/20",
    format: "mp4",
    resolution: "p1080",
    fps: 30,
    platform: "linkedin",
  },
  {
    id: "hd",
    name: "HD Export",
    description: "Standard 1080p, 30fps",
    icon: Zap,
    color: "from-primary/20 via-purple-500/20 to-cyan-500/20",
    format: "mp4",
    resolution: "p1080",
    fps: 30,
    platform: "",
  },
  {
    id: "4k",
    name: "4K Master",
    description: "Ultra HD, 60fps, maximum quality",
    icon: Zap,
    color: "from-yellow-500/20 via-orange-500/20 to-red-500/20",
    format: "mp4",
    resolution: "k4",
    fps: 60,
    platform: "youtube-4k",
    badge: "Premium",
  },
];

interface ExportPresetsProps {
  onSelect: (preset: { format: string; resolution: string; fps: number; platform: string }) => void;
}

export function ExportPresets({ onSelect }: ExportPresetsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {PRESETS.map((preset, i) => (
        <motion.button
          key={preset.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={() =>
            onSelect({
              format: preset.format,
              resolution: preset.resolution,
              fps: preset.fps,
              platform: preset.platform,
            })
          }
          className={cn(
            "group relative flex flex-col items-start gap-2 rounded-xl border border-border/30 bg-gradient-to-br p-3 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-[0_0_20px_-8px_hsl(var(--primary)/0.2)]",
            preset.color,
          )}
        >
          {preset.badge && (
            <span className={cn(
              "absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider",
              preset.badge === "Popular" && "bg-primary/20 text-primary",
              preset.badge === "Trending" && "bg-purple-500/20 text-purple-400",
              preset.badge === "New" && "bg-cyan-500/20 text-cyan-400",
              preset.badge === "Premium" && "bg-yellow-500/20 text-yellow-400",
            )}>
              {preset.badge}
            </span>
          )}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">
            <preset.icon className="h-3.5 w-3.5 text-foreground/70" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground/90">{preset.name}</p>
            <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground/60">
              {preset.description}
            </p>
          </div>
          <div className="mt-auto flex items-center gap-1.5">
            <span className="rounded-md border border-border/20 bg-white/5 px-1 py-0.5 text-[9px] font-mono text-muted-foreground/50">
              {preset.resolution.toUpperCase()}
            </span>
            <span className="rounded-md border border-border/20 bg-white/5 px-1 py-0.5 text-[9px] font-mono text-muted-foreground/50">
              {preset.fps}fps
            </span>
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
            <div className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground shadow-lg">
              <Check className="h-3 w-3" />
              Select
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
