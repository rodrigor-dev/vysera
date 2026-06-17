"use client";

import React, { useCallback } from 'react';
import {
  Magnet,
  ZoomIn,
  ZoomOut,
  Maximize,
  Scissors,
  Plus,
  Undo2,
  Redo2,
  Video,
  Music,
  Type,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/editor-store';
import { TimelineTimecode } from './timeline-timecode';

export const TimelineToolbar = React.memo(function TimelineToolbar() {
  const store = useEditorStore();
  const s = store.state;

  const handleSplit = useCallback(() => {
    if (s.selectedClipId) {
      store.splitClip(s.selectedClipId, s.currentTime);
    }
  }, [s.selectedClipId, s.currentTime, store]);

  const selectedClip = s.selectedClipId
    ? s.tracks.flatMap((t) => t.clips).find((c) => c.id === s.selectedClipId)
    : null;

  const addTrackOpts = [
    { type: 'video' as const, label: 'Video Track', icon: Video },
    { type: 'audio' as const, label: 'Audio Track', icon: Music },
    { type: 'text' as const, label: 'Text Track', icon: Type },
    { type: 'overlay' as const, label: 'Overlay Track', icon: Layers },
  ];

  return (
    <div className={cn('flex h-10 items-center gap-1.5 border-b border-border/30 px-3', 'bg-muted/10')}>
      <div className="flex items-center gap-1">
        <button
          className={cn(
            'rounded-lg p-1.5 transition-colors',
            s.snapEnabled
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground/60 hover:text-foreground hover:bg-white/5',
          )}
          onClick={() => store.setSnapEnabled(!s.snapEnabled)}
          title={`Snap ${s.snapEnabled ? 'On' : 'Off'}`}
        >
          <Magnet className="h-4 w-4" />
        </button>
        <div className="mx-1 h-5 w-px bg-border/30" />
        <button
          className="rounded-lg p-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
          onClick={() => store.zoomOut()}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="w-12 text-center text-[10px] font-mono text-muted-foreground/70">
          {Math.round(s.zoom)}%
        </span>
        <button
          className="rounded-lg p-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
          onClick={() => store.zoomIn()}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          className="rounded-lg p-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
          onClick={() => store.zoomToFit()}
          title="Zoom to Fit"
        >
          <Maximize className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mx-2 h-5 w-px bg-border/30" />

      <div className="flex items-center gap-1">
        <button
          className={cn(
            'rounded-lg p-1.5 transition-colors',
            'text-muted-foreground/60 hover:text-foreground hover:bg-white/5',
            !s.selectedClipId && 'pointer-events-none opacity-40',
          )}
          onClick={handleSplit}
          title="Split Clip (S)"
        >
          <Scissors className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-2 h-5 w-px bg-border/30" />

      <div className="relative group flex items-center">
        <button
          className="rounded-lg p-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-white/5"
          title="Add Track"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div
          className={cn(
            'absolute left-0 top-full z-50 mt-1 hidden min-w-[160px] overflow-hidden rounded-xl',
            'border border-border/50 bg-card/95 p-1 shadow-2xl backdrop-blur-xl',
            'group-hover:block',
          )}
        >
          {addTrackOpts.map((opt) => (
            <button
              key={opt.type}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground/80 hover:bg-primary/10 hover:text-foreground"
              onClick={() => store.addTrack(opt.type)}
            >
              <opt.icon className="h-4 w-4" /> {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-2 h-5 w-px bg-border/30" />

      <div className="flex items-center gap-1">
        <button
          className={cn(
            'rounded-lg p-1.5 transition-colors',
            'text-muted-foreground/60 hover:text-foreground hover:bg-white/5',
            s.historyIndex <= 0 && 'pointer-events-none opacity-30',
          )}
          onClick={() => store.undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          className={cn(
            'rounded-lg p-1.5 transition-colors',
            'text-muted-foreground/60 hover:text-foreground hover:bg-white/5',
            s.historyIndex >= s.history.length - 1 && 'pointer-events-none opacity-30',
          )}
          onClick={() => store.redo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
          <span className="font-mono">
            <TimelineTimecode seconds={s.currentTime} fps={s.fps} variant="full" className="text-muted-foreground/70" />
          </span>
          <span className="text-muted-foreground/30">/</span>
          <span className="font-mono text-muted-foreground/40">
            <TimelineTimecode seconds={s.duration} fps={s.fps} variant="full" className="text-muted-foreground/40" />
          </span>
        </div>
        {selectedClip && (
          <span className="truncate text-[10px] text-muted-foreground/50">
            Clip: {selectedClip.name}
          </span>
        )}
      </div>
    </div>
  );
});
