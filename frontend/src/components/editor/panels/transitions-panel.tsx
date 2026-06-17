"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TransitionType } from "@/components/editor/types";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Minus,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  ArrowDownToLine,
  ZoomIn,
  ZoomOut,
  ArrowLeftToLine as WipeLeft,
  ArrowRightToLine as WipeRight,
  CloudLightning,
  Boxes,
  Sparkles,
} from "lucide-react";

interface TransitionDef {
  type: TransitionType;
  label: string;
  icon: typeof Minus;
  gradient: string;
}

const transitionDefs: TransitionDef[] = [
  { type: "fade", label: "Fade", icon: Minus, gradient: "from-slate-500/20 to-slate-600/15" },
  { type: "crossfade", label: "Crossfade", icon: Sparkles, gradient: "from-violet-500/20 to-purple-500/15" },
  { type: "dissolve", label: "Dissolve", icon: Boxes, gradient: "from-indigo-500/20 to-violet-500/15" },
  { type: "slide-left", label: "Slide Left", icon: ArrowLeftToLine, gradient: "from-blue-500/20 to-cyan-500/15" },
  { type: "slide-right", label: "Slide Right", icon: ArrowRightToLine, gradient: "from-blue-500/20 to-cyan-500/15" },
  { type: "slide-up", label: "Slide Up", icon: ArrowUpToLine, gradient: "from-emerald-500/20 to-green-500/15" },
  { type: "slide-down", label: "Slide Down", icon: ArrowDownToLine, gradient: "from-emerald-500/20 to-green-500/15" },
  { type: "zoom-in", label: "Zoom In", icon: ZoomIn, gradient: "from-amber-500/20 to-orange-500/15" },
  { type: "zoom-out", label: "Zoom Out", icon: ZoomOut, gradient: "from-amber-500/20 to-orange-500/15" },
  { type: "wipe-left", label: "Wipe Left", icon: WipeLeft, gradient: "from-rose-500/20 to-pink-500/15" },
  { type: "wipe-right", label: "Wipe Right", icon: WipeRight, gradient: "from-rose-500/20 to-pink-500/15" },
  { type: "glitch", label: "Glitch", icon: CloudLightning, gradient: "from-red-500/20 to-orange-500/15" },
  { type: "blur", label: "Blur", icon: Boxes, gradient: "from-cyan-500/20 to-sky-500/15" },
  { type: "pixelate", label: "Pixelate", icon: Boxes, gradient: "from-lime-500/20 to-green-500/15" },
];

export function TransitionsPanel() {
  const [selected, setSelected] = useState<TransitionType>("fade");
  const [duration, setDuration] = useState(0.5);
  const [placement, setPlacement] = useState<"start" | "end" | "between">("between");

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-semibold text-muted-foreground/80">Transition Type</label>
      <div className="grid grid-cols-3 gap-1.5">
        {transitionDefs.map((td) => {
          const Icon = td.icon;
          const isSelected = selected === td.type;
          return (
            <button
              key={td.type}
              onClick={() => setSelected(td.type)}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-xl p-2 transition-all duration-200",
                td.gradient,
                isSelected && "ring-1 ring-primary/50 shadow-[0_0_12px_hsl(var(--primary)/0.15)]",
                !isSelected && "hover:scale-[1.02]",
              )}
            >
              {isSelected && (
                <motion.div
                  layoutId="transition-selected"
                  className="absolute inset-0 rounded-xl ring-1 ring-primary/50"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5 text-foreground/60" />
              <span className="relative z-10 text-[8px] font-medium text-foreground/70">{td.label}</span>
            </button>
          );
        })}
      </div>

      <Separator className="bg-border/20" />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-muted-foreground/60">Duration</label>
          <span className="font-mono text-[10px] text-primary">{duration.toFixed(1)}s</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={3}
          step={0.1}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex gap-1">
          {[0.1, 0.3, 0.5, 1, 2, 3].map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={cn(
                "flex-1 rounded-md py-1 text-[9px] font-medium transition-all",
                duration === d
                  ? "bg-primary/20 text-primary"
                  : "bg-white/5 text-muted-foreground/50 hover:text-foreground/70",
              )}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-border/20" />

      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground/60">Apply to</label>
        <Select
          value={placement}
          onValueChange={(v) => setPlacement(v as typeof placement)}
        >
          <SelectTrigger className="h-7 text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="start" className="text-xs">Clip Start</SelectItem>
            <SelectItem value="end" className="text-xs">Clip End</SelectItem>
            <SelectItem value="between" className="text-xs">Between Clips</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <button
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium transition-all",
          "bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25",
          "hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5",
          "active:translate-y-0",
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Apply Transition
      </button>
    </div>
  );
}
