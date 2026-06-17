"use client";

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/editor-store';
import type { Clip } from '@/components/editor/types';

type ClipType = Clip['type'];
import { TimelineTimecode } from './timeline-timecode';

function getClipColor(type: ClipType): string {
  switch (type) {
    case 'video': return 'from-blue-500/80 to-blue-600/80';
    case 'audio': return 'from-green-500/80 to-green-600/80';
    case 'text': return 'from-purple-500/80 to-purple-600/80';
    case 'sticker': return 'from-orange-500/80 to-orange-600/80';
    case 'overlay': return 'from-cyan-500/80 to-cyan-600/80';
    default: return 'from-gray-500/80 to-gray-600/80';
  }
}

function snapTime(
  time: number,
  snapEnabled: boolean,
  snapThreshold: number,
  excludeClipId: string,
  tracks: import('@/components/editor/types').Track[],
  zoom: number,
): number {
  if (!snapEnabled) return time;
  const threshold = snapThreshold / zoom;
  const allClips = tracks.flatMap((t) => t.clips).filter((c) => c.id !== excludeClipId);
  const edges = new Set<number>();
  for (const clip of allClips) {
    edges.add(clip.startTime);
    edges.add(clip.endTime);
  }
  let closest = time;
  let minDist = threshold;
  for (const edge of edges) {
    const dist = Math.abs(time - edge);
    if (dist < minDist) {
      minDist = dist;
      closest = edge;
    }
  }
  return closest;
}

interface TimelineClipProps {
  clip: Clip;
  zoom: number;
  trackHeight: number;
  onContextMenu: (e: React.MouseEvent, clipId: string) => void;
  isSelected: boolean;
}

export const TimelineClip = React.memo(function TimelineClip({
  clip,
  zoom,
  trackHeight,
  onContextMenu,
  isSelected,
}: TimelineClipProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isTrimming, setIsTrimming] = useState<'left' | 'right' | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [dragStart, setDragStart] = useState({ mouseX: 0, startTime: 0, endTime: 0 });
  const clipRef = useRef<HTMLDivElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);
  const [renameValue, setRenameValue] = useState(clip.name);

  const store = useEditorStore();
  const clipWidth = (clip.endTime - clip.startTime) * zoom;
  const clipLeft = clip.startTime * zoom;
  const clipHeight = trackHeight - 6;
  const colorClass = getClipColor(clip.type);
  const speedChanged = clip.speed !== 1.0;
  const isAudio = clip.type === 'audio';

  useEffect(() => {
    if (isRenaming && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [isRenaming]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 || clip.locked) return;
      if ((e.target as HTMLElement).closest('.trim-handle')) return;
      e.preventDefault();
      store.pushHistory();
      store.selectClip(clip.id);
      setIsDragging(true);
      setDragStart({ mouseX: e.clientX, startTime: clip.startTime, endTime: clip.endTime });
    },
    [clip, store],
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const st = useEditorStore.getState();
      const deltaX = e.clientX - dragStart.mouseX;
      const deltaTime = deltaX / st.state.zoom;
      let newStart = dragStart.startTime + deltaTime;
      newStart = Math.max(0, newStart);
      newStart = snapTime(newStart, st.state.snapEnabled, st.state.snapThreshold, clip.id, st.state.tracks, st.state.zoom);
      st.updateClip(clip.id, {
        startTime: newStart,
        endTime: newStart + (dragStart.endTime - dragStart.startTime),
      });
    };
    const handleMouseUp = (e: MouseEvent) => {
      setIsDragging(false);
      const st = useEditorStore.getState();
      const deltaX = e.clientX - dragStart.mouseX;
      const deltaTime = deltaX / st.state.zoom;
      let newStart = dragStart.startTime + deltaTime;
      newStart = Math.max(0, snapTime(newStart, st.state.snapEnabled, st.state.snapThreshold, clip.id, st.state.tracks, st.state.zoom));

      const tracksEl = document.getElementById('timeline-tracks-container');
      if (tracksEl) {
        const rect = tracksEl.getBoundingClientRect();
        const relY = e.clientY - rect.top + st.state.scrollY;
        let accY = 0;
        let targetTrackId = clip.trackId;
        for (const track of st.state.tracks) {
          if (relY >= accY && relY < accY + track.height) {
            targetTrackId = track.id;
            break;
          }
          accY += track.height;
        }
        if (targetTrackId !== clip.trackId) {
          st.moveClip(clip.id, targetTrackId, newStart);
        } else {
          st.updateClip(clip.id, {
            startTime: newStart,
            endTime: newStart + (dragStart.endTime - dragStart.startTime),
          });
        }
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, clip.id, clip.trackId, store]);

  const handleTrimStart = useCallback(
    (e: React.MouseEvent, side: 'left' | 'right') => {
      e.preventDefault();
      e.stopPropagation();
      if (clip.locked) return;
      store.pushHistory();
      setIsTrimming(side);
      setDragStart({ mouseX: e.clientX, startTime: clip.startTime, endTime: clip.endTime });
    },
    [clip, store],
  );

  useEffect(() => {
    if (!isTrimming) return;
    const handleMouseMove = (e: MouseEvent) => {
      const st = useEditorStore.getState();
      const deltaX = e.clientX - dragStart.mouseX;
      const deltaTime = deltaX / st.state.zoom;
      if (isTrimming === 'left') {
        let newStart = dragStart.startTime + deltaTime;
        newStart = Math.max(0, Math.min(newStart, dragStart.endTime - 0.1));
        st.updateClip(clip.id, { startTime: newStart });
      } else {
        let newEnd = dragStart.endTime + deltaTime;
        newEnd = Math.max(dragStart.startTime + 0.1, newEnd);
        st.updateClip(clip.id, { endTime: newEnd });
      }
    };
    const handleMouseUp = () => setIsTrimming(null);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isTrimming, dragStart, clip.id]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (clip.locked) return;
      setRenameValue(clip.name);
      setIsRenaming(true);
    },
    [clip],
  );

  const handleRenameSubmit = useCallback(() => {
    if (renameValue.trim()) {
      store.updateClip(clip.id, { name: renameValue.trim() });
    }
    setIsRenaming(false);
  }, [renameValue, clip.id, store]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleRenameSubmit();
      if (e.key === 'Escape') setIsRenaming(false);
    },
    [handleRenameSubmit],
  );

  const handleContext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      store.selectClip(clip.id);
      onContextMenu(e, clip.id);
    },
    [clip.id, store, onContextMenu],
  );

  if (clipWidth < 2) return null;

  return (
    <motion.div
      ref={clipRef}
      className={cn(
        'absolute cursor-pointer select-none overflow-hidden rounded-md transition-shadow',
        isDragging && 'z-50 opacity-80 shadow-2xl',
        isTrimming && 'z-40',
        !isDragging && !isTrimming && 'z-10',
        isSelected && 'ring-2 ring-primary/70 shadow-lg shadow-primary/30',
        clip.locked && 'opacity-60',
      )}
      style={{ left: clipLeft, top: 3, width: clipWidth, height: clipHeight }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContext}
      whileHover={{ scaleY: 1.02 }}
      layout
    >
      <div className={cn('h-full w-full rounded-md bg-gradient-to-r', colorClass)}>
        {isAudio && (
          <div className="absolute inset-0 flex items-end justify-around px-0.5 py-1 opacity-40">
            {Array.from({ length: Math.min(Math.floor(clipWidth / 4), 16) }).map((_, i) => (
              <div
                key={i}
                className="w-[2px] rounded-full bg-white"
                style={{ height: `${30 + Math.sin(i * 1.5) * 30 + Math.random() * 20}%` }}
              />
            ))}
          </div>
        )}

        {isRenaming ? (
          <input
            ref={renameRef}
            className="absolute inset-0 bg-transparent px-2 text-[10px] font-medium text-white outline-none placeholder:text-white/50"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="flex h-full flex-col justify-center px-2">
            {clipWidth > 30 && (
              <span className="truncate text-[10px] font-medium leading-tight text-white drop-shadow-sm">
                {clip.name}
              </span>
            )}
            {clipWidth > 50 && (
              <span className="text-[8px] leading-tight text-white/70">
                <TimelineTimecode seconds={clip.endTime - clip.startTime} variant="compact" />
              </span>
            )}
          </div>
        )}

        {speedChanged && clipWidth > 40 && (
          <div className="absolute bottom-1 right-1 rounded-sm bg-black/40 px-1 py-0.5 text-[8px] font-mono text-white/90">
            {clip.speed}x
          </div>
        )}

        {clip.locked && (
          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/30">
            <svg className="h-4 w-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        )}
      </div>

      <div
        className="trim-handle absolute left-0 top-0 h-full w-2 cursor-col-resize rounded-l-md hover:bg-white/20 active:bg-white/30 transition-colors"
        onMouseDown={(e) => handleTrimStart(e, 'left')}
      />
      <div
        className="trim-handle absolute right-0 top-0 h-full w-2 cursor-col-resize rounded-r-md hover:bg-white/20 active:bg-white/30 transition-colors"
        onMouseDown={(e) => handleTrimStart(e, 'right')}
      />

      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-md ring-2 ring-primary/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        />
      )}
    </motion.div>
  );
});
