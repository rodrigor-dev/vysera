"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editor-store";
import { EditorHeader } from "@/components/editor/editor-header";
import { PreviewPanel } from "@/components/editor/preview-panel";
import { ToolPanel } from "@/components/editor/tool-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Film,
  Clock,
  Monitor,
  MemoryStick,
  Square,
  Layers,
} from "lucide-react";

function StatusBar() {
  const currentTime = useEditorStore((s) => s.state.currentTime);
  const duration = useEditorStore((s) => s.state.duration);
  const fps = useEditorStore((s) => s.state.fps);

  const formatTc = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    const f = Math.floor((s % 1) * fps);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}:${f.toString().padStart(2, "0")}`;
  };

  return (
    <div className="glass-strong flex h-8 items-center gap-3 rounded-xl px-3">
      <div className="flex items-center gap-1.5">
        <Clock className="h-3 w-3 text-muted-foreground/40" />
        <span className="font-mono text-[10px] text-muted-foreground/70">{formatTc(currentTime)}</span>
      </div>
      <div className="h-3 w-px bg-border/20" />
      <div className="flex items-center gap-1.5">
        <Monitor className="h-3 w-3 text-muted-foreground/40" />
        <span className="font-mono text-[10px] text-muted-foreground/60">{fps} FPS</span>
      </div>
      <div className="h-3 w-px bg-border/20" />
      <div className="flex items-center gap-1.5">
        <Film className="h-3 w-3 text-muted-foreground/40" />
        <span className="font-mono text-[10px] text-muted-foreground/60">0 clips</span>
      </div>
      <div className="h-3 w-px bg-border/20" />
      <div className="flex items-center gap-1.5">
        <MemoryStick className="h-3 w-3 text-muted-foreground/40" />
        <span className="font-mono text-[10px] text-muted-foreground/60">0 MB</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-0.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-[9px] text-muted-foreground/50">Ready</span>
        </div>
        <Badge variant="outline" className="h-4 border-0 bg-white/5 px-1.5 text-[8px] font-mono text-muted-foreground/40">
          1920×1080
        </Badge>
      </div>
    </div>
  );
}

export function EditorLayout() {
  const leftPanelOpen = useEditorStore((s) => s.state.leftPanelOpen);
  const { setLeftPanelOpen } = useEditorStore.getState();

  return (
    <div className="flex h-screen flex-col gap-1.5 bg-[#0a0a0a] p-1.5">
      <EditorHeader />

      <div className="flex flex-1 gap-1.5 overflow-hidden">
        {leftPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="shrink-0"
          >
            <ToolPanel />
          </motion.div>
        )}

        <div className="flex flex-1 flex-col gap-1.5 overflow-hidden">
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              className="h-7 w-7 shrink-0 text-muted-foreground/50 hover:text-foreground"
            >
              {leftPanelOpen ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
            </Button>

            <div className="flex-1">
              <PreviewPanel />
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-1.5 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 text-muted-foreground/40 hover:text-foreground"
                >
                  <Layers className="h-3 w-3" />
                </Button>
                <span className="text-[11px] font-medium text-muted-foreground/60">Timeline</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 text-muted-foreground/40 hover:text-foreground"
                >
                  <Square className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="glass-strong flex flex-1 items-center justify-center rounded-2xl">
              <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
                <Film className="h-8 w-8" />
                <span className="text-xs font-medium">Timeline</span>
                <span className="text-[10px]">Import components/editor/timeline here</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <StatusBar />
    </div>
  );
}
