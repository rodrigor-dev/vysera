"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editor-store";
import { VyseraLogo } from "@/components/shared/vysera-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExportDialog } from "./export-dialog";
import {
  Undo2,
  Redo2,
  Download,
  Settings,
  ArrowLeft,
  Grid3x3,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Clock,
} from "lucide-react";

export function EditorHeader() {
  const projectName = useEditorStore((s) => s.state.projectName);
  const isDirty = useEditorStore((s) => s.state.isDirty);
  const snapEnabled = useEditorStore((s) => s.state.snapEnabled);
  const zoom = useEditorStore((s) => s.state.zoom);
  const projectId = useEditorStore((s) => s.state.projectId);
  const videoSrc = useEditorStore((s) => s.state.videoSrc);
  const {
    setProjectName,
    undo,
    redo,
    toggleSnap,
    setZoom,
    pushHistory,
  } = useEditorStore.getState();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(projectName);
  const [exportOpen, setExportOpen] = useState(false);

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      setProjectName(nameInput.trim());
    } else {
      setNameInput(projectName);
    }
    setEditingName(false);
  };

  return (
    <div className="glass-strong flex h-12 items-center gap-2 rounded-2xl px-3">
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground/50 hover:text-foreground"
        asChild
      >
        <a href="/dashboard">
          <ArrowLeft className="h-4 w-4" />
        </a>
      </Button>

      <Separator orientation="vertical" className="mx-1 h-5 bg-border/20" />

      <div className="flex items-center gap-2">
        <VyseraLogo size="sm" variant="icon" className="h-5 w-5" />
        <div className="flex items-center gap-2">
          {editingName ? (
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
              className="h-6 w-44 px-2 text-xs font-medium"
              autoFocus
            />
          ) : (
            <button
              onClick={() => {
                setNameInput(projectName);
                setEditingName(true);
              }}
              className="rounded-md px-1.5 py-0.5 text-sm font-semibold text-foreground/90 transition-colors hover:bg-white/5"
            >
              {projectName}
            </button>
          )}
          {isDirty ? (
            <Badge variant="warning" className="h-5 gap-1 border-0 px-2 text-[9px] font-medium">
              <Clock className="h-2.5 w-2.5" />
              Unsaved
            </Badge>
          ) : (
            <Badge variant="success" className="h-5 gap-1 border-0 px-2 text-[9px] font-medium">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Saved
            </Badge>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <div className="flex items-center gap-0.5 rounded-lg border border-border/20 bg-white/5 p-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => { pushHistory(); undo(); }}
            className="h-7 w-7 text-muted-foreground/50 hover:text-foreground"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <div className="h-4 w-px bg-border/20" />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => redo()}
            className="h-7 w-7 text-muted-foreground/50 hover:text-foreground"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-5 bg-border/20" />

        <button
          onClick={() => toggleSnap()}
          className={cn(
            "flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11px] font-medium transition-all",
            snapEnabled
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground/50 hover:bg-white/5 hover:text-foreground/70",
          )}
        >
          <Grid3x3 className="h-3 w-3" />
          Snap
        </button>

        <div className="flex items-center gap-0.5 rounded-lg border border-border/20 bg-white/5 px-1.5 py-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setZoom(Math.max(10, zoom - 10))}
            className="h-6 w-6 text-muted-foreground/50 hover:text-foreground"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <span className="min-w-[32px] text-center text-[10px] font-mono text-muted-foreground/70">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setZoom(Math.min(400, zoom + 10))}
            className="h-6 w-6 text-muted-foreground/50 hover:text-foreground"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-5 bg-border/20" />

        <Button
          size="sm"
          variant="default"
          className="h-7 gap-1.5 bg-gradient-to-r from-primary to-purple-500 px-3 text-[11px] text-white shadow-lg shadow-primary/25"
          onClick={() => setExportOpen(true)}
        >
          <Download className="h-3 w-3" />
          Export
        </Button>
        <ExportDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
          projectId={projectId}
          projectName={projectName}
          inputPath={videoSrc || ''}
        />

        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7 text-muted-foreground/50 hover:text-foreground"
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
