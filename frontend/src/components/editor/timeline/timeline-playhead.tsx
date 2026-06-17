"use client";

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/editor-store';
import { TimelineTimecode } from './timeline-timecode';

interface TimelinePlayheadProps {
  trackAreaHeight: number;
  totalWidth: number;
}

export const TimelinePlayhead = React.memo(function TimelinePlayhead({
  trackAreaHeight,
  totalWidth,
}: TimelinePlayheadProps) {
  const store = useEditorStore();
  const { currentTime, zoom, duration } = store.state;
  const [isDragging, setIsDragging] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);
  const x = currentTime * zoom;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const st = useEditorStore.getState();
      const tracksEl = document.getElementById('timeline-tracks-container');
      if (!tracksEl) return;
      const rect = tracksEl.getBoundingClientRect();
      const scrollLeft = tracksEl.scrollLeft;
      const px = e.clientX - rect.left + scrollLeft;
      const time = Math.max(0, Math.min(px / st.state.zoom, st.state.duration));
      st.seek(time);
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (totalWidth > 0 && x > totalWidth) return null;

  return (
    <div
      className={cn('pointer-events-none absolute inset-y-0 z-30', isDragging && 'z-40')}
      style={{ left: x }}
    >
      <div
        ref={handleRef}
        className="pointer-events-auto absolute -left-[7px] z-10 cursor-ew-resize"
        style={{ top: -4 }}
        onMouseDown={handleMouseDown}
      >
        <motion.div
          className={cn(
            'flex items-center gap-1 rounded-b-md px-2 py-0.5',
            'bg-primary shadow-lg shadow-primary/40',
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="h-2 w-2 rotate-45 bg-white" />
        </motion.div>
        {isDragging && (
          <div
            className={cn(
              'absolute left-1/2 top-7 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-0.5',
              'bg-primary/90 text-[10px] font-mono text-white shadow-lg',
            )}
          >
            <TimelineTimecode seconds={currentTime} variant="compact" />
          </div>
        )}
      </div>
      <div
        className={cn(
          'absolute left-0 top-6 w-0.5',
          'bg-gradient-to-b from-primary/90 via-primary/60 to-primary/30',
          'shadow-[0_0_8px_rgba(139,92,246,0.5)]',
        )}
        style={{ height: Math.max(trackAreaHeight - 6, 0) }}
      />
    </div>
  );
});
