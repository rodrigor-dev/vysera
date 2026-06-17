"use client";

import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  Video,
  Music,
  Type,
  Layers,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/editor-store';
import type { Track } from '@/components/editor/types';
import { TimelineClip } from './timeline-clip';

const TrackTypeIcon: Record<string, React.ElementType> = {
  video: Video,
  audio: Music,
  text: Type,
  sticker: Layers,
  overlay: Layers,
  effect: Video,
};

interface TimelineTrackProps {
  track: Track;
  totalDuration: number;
  zoom: number;
  onContextMenu: (e: React.MouseEvent, trackId: string, clipId?: string) => void;
  isSelected: boolean;
  trackOffset: number;
}

export const TimelineTrack = React.memo(function TimelineTrack({
  track,
  totalDuration,
  zoom,
  onContextMenu,
  isSelected,
  trackOffset,
}: TimelineTrackProps) {
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef({ y: 0, height: 0 });
  const store = useEditorStore();
  const selectedClipId = store.state.selectedClipId;

  const Icon = TrackTypeIcon[track.type] ?? Layers;
  const trackWidth = Math.max(totalDuration * zoom + 400, 1000);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      store.selectTrack(track.id);
      onContextMenu(e, track.id);
    },
    [track.id, store, onContextMenu],
  );

  const handleClipContext = useCallback(
    (e: React.MouseEvent, clipId: string) => {
      e.preventDefault();
      onContextMenu(e, track.id, clipId);
    },
    [track.id, onContextMenu],
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      resizeRef.current = { y: e.clientY, height: track.height };
    },
    [track.height],
  );

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - resizeRef.current.y;
      const newHeight = Math.max(24, resizeRef.current.height + delta);
      store.updateTrack(track.id, { height: newHeight });
    };
    const handleMouseUp = () => setIsResizing(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, track.id, store]);

  const toggleMute = useCallback(() => {
    store.updateTrack(track.id, { muted: !track.muted });
  }, [track.id, track.muted, store]);

  const toggleLock = useCallback(() => {
    store.updateTrack(track.id, { locked: !track.locked });
  }, [track.id, track.locked, store]);

  const toggleVisible = useCallback(() => {
    store.updateTrack(track.id, { visible: !track.visible });
  }, [track.id, track.visible, store]);

  return (
    <div
      className={cn(
        'group relative flex border-b border-border/20 transition-colors',
        isSelected && 'bg-primary/5',
        !track.visible && 'opacity-40',
      )}
      style={{ height: track.height, minHeight: 24 }}
      onContextMenu={handleContextMenu}
    >
      <div
        className={cn(
          'flex w-[200px] min-w-[200px] shrink-0 items-center gap-1.5 border-r border-border/30 px-2',
          'bg-muted/20',
          isSelected && 'bg-primary/10',
        )}
      >
        <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-foreground/80">
          {track.name}
        </span>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            className={cn(
              'rounded p-0.5 transition-colors',
              track.muted
                ? 'bg-red-500/20 text-red-400'
                : 'text-muted-foreground/50 hover:text-foreground/80 hover:bg-white/5',
            )}
            onClick={toggleMute}
            title={track.muted ? 'Unmute' : 'Mute'}
          >
            {track.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
          </button>
          <button
            className={cn(
              'rounded p-0.5 transition-colors',
              track.locked
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground/50 hover:text-foreground/80 hover:bg-white/5',
            )}
            onClick={toggleLock}
            title={track.locked ? 'Unlock' : 'Lock'}
          >
            <Lock className="h-3 w-3" />
          </button>
          <button
            className={cn(
              'rounded p-0.5 transition-colors',
              !track.visible
                ? 'text-muted-foreground/40'
                : 'text-muted-foreground/50 hover:text-foreground/80 hover:bg-white/5',
            )}
            onClick={toggleVisible}
            title={track.visible ? 'Hide' : 'Show'}
          >
            {track.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          'relative flex-1',
          track.type === 'video' && 'bg-zinc-900/20',
          track.type === 'audio' && 'bg-zinc-900/10',
          track.type === 'text' && 'bg-zinc-900/15',
          track.type === 'overlay' && 'bg-zinc-900/25',
        )}
        style={{ minWidth: trackWidth, width: trackWidth }}
      >
        {track.clips.map((clip) => (
          <TimelineClip
            key={clip.id}
            clip={clip}
            zoom={zoom}
            trackHeight={track.height}
            onContextMenu={handleClipContext}
            isSelected={clip.id === selectedClipId}
          />
        ))}
      </div>

      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 z-20 h-1.5 cursor-row-resize',
          'opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-60',
          'hover:bg-primary/30 active:bg-primary/50',
        )}
        onMouseDown={handleResizeStart}
      />
    </div>
  );
});
