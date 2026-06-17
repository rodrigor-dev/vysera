"use client";

import React, { useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/editor-store';

function getRulerIntervals(zoom: number): { major: number; minor: number; showLabels: boolean } {
  if (zoom >= 100) return { major: 0.5, minor: 0.1, showLabels: true };
  if (zoom >= 50) return { major: 1, minor: 0.5, showLabels: true };
  if (zoom >= 20) return { major: 2, minor: 1, showLabels: true };
  if (zoom >= 10) return { major: 5, minor: 2, showLabels: true };
  return { major: 10, minor: 5, showLabels: false };
}

interface TimelineRulerProps {
  width: number;
  onSeek: (time: number) => void;
}

export const TimelineRuler = React.memo(function TimelineRuler({ width, onSeek }: TimelineRulerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const zoom = useEditorStore((s) => s.state.zoom);
  const duration = useEditorStore((s) => s.state.duration);

  const intervals = useMemo(() => getRulerIntervals(zoom), [zoom]);
  const totalWidth = duration * zoom + 400;
  const renderEnd = duration + 5;

  const majorTicks = useMemo(() => {
    const arr: { time: number; x: number }[] = [];
    for (let t = 0; t <= renderEnd; t += intervals.major) {
      arr.push({ time: t, x: t * zoom });
    }
    return arr;
  }, [renderEnd, intervals.major, zoom]);

  const minorTicks = useMemo(() => {
    if (!intervals.minor) return [];
    const arr: { time: number; x: number }[] = [];
    for (let t = 0; t <= renderEnd; t += intervals.minor) {
      if (t % intervals.major !== 0) {
        arr.push({ time: t, x: t * zoom });
      }
    }
    return arr;
  }, [renderEnd, intervals, zoom]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const scrollEl = document.getElementById('timeline-tracks-container');
      const scrollLeft = scrollEl?.scrollLeft ?? 0;
      const x = e.clientX - rect.left + scrollLeft;
      const time = Math.max(0, Math.min(x / zoom, duration));
      onSeek(time);
    },
    [zoom, duration, onSeek],
  );

  return (
    <div
      ref={containerRef}
      className="relative select-none border-b border-border/30"
      style={{ height: 28, minWidth: totalWidth, width: totalWidth }}
      onMouseDown={handleClick}
    >
      <svg className="h-full w-full" style={{ overflow: 'visible' }}>
        {minorTicks.map((tick) => (
          <line
            key={`minor-${tick.time}`}
            x1={tick.x} y1={20} x2={tick.x} y2={26}
            className="stroke-border/30" strokeWidth={1}
          />
        ))}
        {majorTicks.map((tick) => (
          <React.Fragment key={`major-${tick.time}`}>
            <line x1={tick.x} y1={12} x2={tick.x} y2={26} className="stroke-border/50" strokeWidth={1} />
            {intervals.showLabels && (
              <text x={tick.x + 4} y={10} className="fill-muted-foreground/60" fontSize={9} fontFamily="JetBrains Mono, monospace">
                {tick.time % 1 === 0
                  ? `${Math.floor(tick.time / 60)}:${(tick.time % 60).toString().padStart(2, '0')}`
                  : (tick.time % 60).toFixed(1)}
              </text>
            )}
          </React.Fragment>
        ))}
      </svg>
    </div>
  );
});
