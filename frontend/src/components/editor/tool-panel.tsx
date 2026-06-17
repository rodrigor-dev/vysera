"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editor-store";
import type { ToolType } from "@/components/editor/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TextPanel } from "@/components/editor/panels/text-panel";
import { EffectsPanel } from "@/components/editor/panels/effects-panel";
import { AudioPanel } from "@/components/editor/panels/audio-panel";
import { TransitionsPanel } from "@/components/editor/panels/transitions-panel";
import { KeyframesPanel } from "@/components/editor/panels/keyframes-panel";
import { StickersPanel } from "@/components/editor/panels/stickers-panel";
import {
  MousePointer2,
  Scissors,
  Type,
  Sticker,
  Shuffle,
  Palette,
  Music,
  Zap,
  KeyRound,
  RotateCcw,
  Maximize,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const toolItems: { id: ToolType; label: string; icon: typeof MousePointer2; shortcut: string }[] = [
  { id: "select", label: "Select", icon: MousePointer2, shortcut: "V" },
  { id: "cut", label: "Cut", icon: Scissors, shortcut: "C" },
  { id: "text", label: "Text", icon: Type, shortcut: "T" },
  { id: "stickers", label: "Stickers", icon: Sticker, shortcut: "S" },
  { id: "transitions", label: "Transitions", icon: Shuffle, shortcut: "R" },
  { id: "effects", label: "Effects", icon: Palette, shortcut: "E" },
  { id: "audio", label: "Audio", icon: Music, shortcut: "A" },
  { id: "speed", label: "Speed", icon: Zap, shortcut: "D" },
  { id: "keyframes", label: "Keyframes", icon: KeyRound, shortcut: "K" },
];

export function ToolPanel() {
  const activeTool = useEditorStore((s) => s.state.activeTool);
  const selectedClipId = useEditorStore((s) => s.state.selectedClipId);
  const tracks = useEditorStore((s) => s.state.tracks);
  const currentTime = useEditorStore((s) => s.state.currentTime);
  const playbackSpeed = useEditorStore((s) => s.state.playbackSpeed);
  const duration = useEditorStore((s) => s.state.duration);
  const { setActiveTool, selectClip, pushHistory, setPlaybackSpeed } = useEditorStore.getState();

  const selectedClip = selectedClipId
    ? tracks.flatMap((t) => t.clips).find((c) => c.id === selectedClipId)
    : null;

  return (
    <div className="glass-strong flex h-full flex-col overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15">
          <MousePointer2 className="h-3 w-3 text-primary" />
        </div>
        <span className="text-sm font-semibold">Tools</span>
      </div>

      <div className="flex flex-col gap-0.5 border-b border-border/30 p-2">
        {toolItems.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-primary/20 to-purple-500/15 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.1)]"
                  : "text-muted-foreground/60 hover:bg-white/5 hover:text-foreground/80",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-tool-bg"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-purple-500/15"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div
                className={cn(
                  "relative z-10 flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                  isActive ? "bg-primary/25" : "bg-white/5 group-hover:bg-white/10",
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", isActive && "text-primary")} />
              </div>
              <span className="relative z-10">{tool.label}</span>
              <kbd className="relative z-10 ml-auto rounded-md border border-border/20 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/40">
                {tool.shortcut}
              </kbd>
            </button>
          );
        })}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTool === "select" && (
                <div className="space-y-3">
                  {selectedClip ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15">
                          <MousePointer2 className="h-3 w-3 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{selectedClip.name}</p>
                          <p className="text-[10px] text-muted-foreground/50">{selectedClip.type}</p>
                        </div>
                      </div>
                      <Separator className="bg-border/20" />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground/60">Position X</label>
                          <Input
                            type="number"
                            value={selectedClip.x}
                            onChange={() => {}}
                            className="h-7 text-[11px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground/60">Position Y</label>
                          <Input
                            type="number"
                            value={selectedClip.y}
                            onChange={() => {}}
                            className="h-7 text-[11px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground/60">Width</label>
                          <Input
                            type="number"
                            value={selectedClip.width}
                            onChange={() => {}}
                            className="h-7 text-[11px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground/60">Height</label>
                          <Input
                            type="number"
                            value={selectedClip.height}
                            onChange={() => {}}
                            className="h-7 text-[11px]"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground/60">Rotation</label>
                        <div className="flex items-center gap-2">
                          <RotateCcw className="h-3 w-3 text-muted-foreground/40" />
                          <input
                            type="range"
                            min={-180}
                            max={180}
                            value={selectedClip.rotation}
                            className="w-full accent-primary"
                          />
                          <span className="min-w-[32px] text-right font-mono text-[10px] text-muted-foreground/60">
                            {selectedClip.rotation}°
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground/60">Scale</label>
                        <div className="flex items-center gap-2">
                          <Maximize className="h-3 w-3 text-muted-foreground/40" />
                          <input
                            type="range"
                            min={10}
                            max={200}
                            value={Math.round(selectedClip.scale * 100)}
                            className="w-full accent-primary"
                          />
                          <span className="min-w-[32px] text-right font-mono text-[10px] text-muted-foreground/60">
                            {Math.round(selectedClip.scale * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 rounded-xl bg-white/5 py-6 text-center">
                      <MousePointer2 className="h-6 w-6 text-muted-foreground/20" />
                      <p className="text-xs text-muted-foreground/40">Select a clip to edit</p>
                    </div>
                  )}
                </div>
              )}

              {activeTool === "cut" && (
                <div className="space-y-3">
                  <div className="flex flex-col items-center gap-2 rounded-xl bg-white/5 py-4 text-center">
                    <Scissors className="h-6 w-6 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground/50">
                      Playhead at {currentTime.toFixed(1)}s
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="w-full gap-2 bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25"
                    onClick={() => pushHistory()}
                  >
                    <Scissors className="h-3.5 w-3.5" /> Split at Playhead
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full gap-2 border-border/50 text-destructive hover:text-destructive"
                  >
                    <Scissors className="h-3.5 w-3.5" /> Razor Mode
                  </Button>
                </div>
              )}

              {activeTool === "text" && <TextPanel />}
              {activeTool === "stickers" && <StickersPanel />}
              {activeTool === "transitions" && <TransitionsPanel />}
              {activeTool === "effects" && <EffectsPanel />}
              {activeTool === "audio" && <AudioPanel />}

              {activeTool === "speed" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground/60">Speed</label>
                      <span className="font-mono text-xs text-primary">{playbackSpeed.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={4}
                      step={0.01}
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0.25, 0.5, 1, 2, 3, 4].map((s) => (
                      <button
                        key={s}
                        onClick={() => setPlaybackSpeed(s)}
                        className={cn(
                          "rounded-lg py-1.5 text-[11px] font-medium transition-all",
                          playbackSpeed === s
                            ? "bg-primary/20 text-primary"
                            : "bg-white/5 text-muted-foreground/50 hover:text-foreground/70",
                        )}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                  <Separator className="bg-border/20" />
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground/60">Duration</label>
                    <p className="font-mono text-xs text-foreground/80">
                      {duration.toFixed(1)}s → {(duration / playbackSpeed).toFixed(1)}s
                    </p>
                  </div>
                </div>
              )}

              {activeTool === "keyframes" && <KeyframesPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
