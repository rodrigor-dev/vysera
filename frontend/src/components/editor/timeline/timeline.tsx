"use client";

import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/editor-store';
import { TimelineToolbar } from './timeline-toolbar';
import { TimelineRuler } from './timeline-ruler';
import { TimelineTrack } from './timeline-track';
import { TimelinePlayhead } from './timeline-playhead';
import { TimelineContextMenu, type ContextMenuState } from './timeline-context-menu';
import { TimelineTimecode } from './timeline-timecode';

const HEADER_WIDTH = 200;

export function Timeline() {
  const store = useEditorStore();
  const s = store.state;
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const rulerScrollRef = useRef<HTMLDivElement>(null);
  const tracksScrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  const sortedTracks = useMemo(() => [...s.tracks].sort((a, b) => a.order - b.order), [s.tracks]);

  const trackPositions = useMemo(() => {
    const pos: Record<string, { top: number; height: number }> = {};
    let y = 0;
    for (const t of sortedTracks) {
      pos[t.id] = { top: y, height: t.height };
      y += t.height;
    }
    return pos;
  }, [sortedTracks]);

  const totalHeight = useMemo(
    () => sortedTracks.reduce((acc, t) => acc + t.height, 0),
    [sortedTracks],
  );
  const totalWidth = Math.max(s.duration * s.zoom + 400, containerWidth);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const syncScroll = useCallback(() => {
    const tracksEl = tracksScrollRef.current;
    const rulerEl = rulerScrollRef.current;
    if (!tracksEl || !rulerEl) return;
    rulerEl.scrollLeft = tracksEl.scrollLeft;
    store.setScrollX(tracksEl.scrollLeft);
    store.setScrollY(tracksEl.scrollTop);
  }, [store]);

  useEffect(() => {
    const el = tracksScrollRef.current;
    if (!el) return;
    const handler = () => syncScroll();
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, [syncScroll]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, trackId?: string, clipId?: string) => {
      e.preventDefault();
      store.selectClip(clipId ?? null);
      store.selectTrack(trackId ?? null);
      setContextMenu({ x: e.clientX, y: e.clientY, clipId, trackId });
    },
    [store],
  );

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.timeline-clip')) return;
      store.selectClip(null);
      store.selectTrack(null);
    },
    [store],
  );

  const handleTimelineContext = useCallback(
    (e: React.MouseEvent) => {
      if (
        (e.target as HTMLElement).closest('[class*="track-header"]') ||
        (e.target as HTMLElement).closest('[class*="timeline-clip"]')
      ) return;
      handleContextMenu(e);
    },
    [handleContextMenu],
  );

  const handleRulerSeek = useCallback(
    (time: number) => store.seek(time),
    [store],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-xl',
        'glass-strong bg-background/80 backdrop-blur-xl border border-border/50',
      )}
    >
      <TimelineToolbar />

      <div className="flex flex-col overflow-hidden" style={{ flex: 1 }}>
        <div className="flex shrink-0">
          <div className="shrink-0 border-r border-border/30 bg-muted/10" style={{ width: HEADER_WIDTH, minWidth: HEADER_WIDTH }}>
            <div className="h-[28px]" />
          </div>
          <div ref={rulerScrollRef} className="overflow-hidden" style={{ flex: 1 }}>
            <TimelineRuler width={totalWidth} onSeek={handleRulerSeek} />
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="shrink-0 border-r border-border/30 bg-muted/10" style={{ width: HEADER_WIDTH, minWidth: HEADER_WIDTH }}>
            {sortedTracks.map((track, idx) => (
              <div
                key={track.id}
                className={cn(
                  'track-header flex cursor-pointer items-center border-b border-border/20 px-2 text-[10px] transition-colors',
                  s.selectedTrackId === track.id && 'bg-primary/10',
                  idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]',
                )}
                style={{ height: track.height }}
                onClick={() => store.selectTrack(track.id)}
                onContextMenu={(e) => handleContextMenu(e, track.id)}
              >
                <span className="truncate text-muted-foreground/60">{track.name}</span>
              </div>
            ))}
          </div>

          <div
            ref={tracksScrollRef}
            id="timeline-tracks-container"
            className="overflow-auto"
            style={{ flex: 1 }}
            onClick={handleTimelineClick}
            onContextMenu={handleTimelineContext}
          >
            <div className="relative" style={{ width: totalWidth, height: Math.max(totalHeight, 100), minHeight: '100%' }}>
              {sortedTracks.map((track) => (
                <TimelineTrack
                  key={track.id}
                  track={track}
                  totalDuration={s.duration}
                  zoom={s.zoom}
                  onContextMenu={handleContextMenu}
                  isSelected={s.selectedTrackId === track.id}
                  trackOffset={trackPositions[track.id]?.top ?? 0}
                />
              ))}
              <TimelinePlayhead trackAreaHeight={totalHeight} totalWidth={totalWidth} />
            </div>
          </div>
        </div>
      </div>

      <div className={cn('flex h-6 shrink-0 items-center border-t border-border/30 px-3', 'bg-muted/10')}>
        <div className="flex items-center gap-3 text-[9px] text-muted-foreground/40">
          <span className="font-mono"><TimelineTimecode seconds={s.currentTime} fps={s.fps} variant="full" /></span>
          <span className="text-muted-foreground/20">|</span>
          <span className="font-mono"><TimelineTimecode seconds={s.duration} fps={s.fps} variant="full" /></span>
          <span className="text-muted-foreground/20">|</span>
          <span>{Math.round(s.zoom)}%</span>
          <span className="text-muted-foreground/20">|</span>
          <span>{s.fps} fps</span>
          <span className="text-muted-foreground/20">|</span>
          <span>{s.tracks.length} track{s.tracks.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className={cn('h-1.5 w-1.5 rounded-full', s.isPlaying ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-muted-foreground/30')} />
        </div>
      </div>

      <TimelineContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} />
    </div>
  );
}

export {
  TimelineTrack,
  TimelineToolbar,
  TimelineRuler,
  TimelinePlayhead,
  TimelineTimecode,
  TimelineContextMenu,
};
