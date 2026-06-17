"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TimelineDropIndicatorProps {
  visible: boolean;
  x: number;
  trackTop: number;
  trackHeight: number;
}

export const TimelineDropIndicator = React.memo(function TimelineDropIndicator({
  visible,
  x,
  trackTop,
  trackHeight,
}: TimelineDropIndicatorProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none absolute z-50"
          style={{ left: x, top: trackTop, height: trackHeight }}
          initial={{ opacity: 0, scaleX: 0.5 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0, scaleX: 0.5 }}
          transition={{ duration: 0.1 }}
        >
          <div
            className={cn(
              'absolute inset-y-0 left-0 w-0.5',
              'bg-gradient-to-b from-primary/90 via-primary/60 to-primary/90',
              'shadow-[0_0_8px_rgba(139,92,246,0.6)]',
            )}
          />
          <div
            className={cn(
              'absolute -left-[3px] top-0 h-3 w-1.5 rounded-br-sm rounded-tr-sm',
              'bg-primary shadow-[0_0_6px_rgba(139,92,246,0.5)]',
            )}
          />
          <div
            className={cn(
              'absolute -left-[3px] bottom-0 h-3 w-1.5 rounded-br-sm rounded-tr-sm',
              'bg-primary shadow-[0_0_6px_rgba(139,92,246,0.5)]',
            )}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export const SnapIndicator = React.memo(function SnapIndicator({
  visible,
  x,
}: {
  visible: boolean;
  x: number;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none absolute inset-y-0 z-40"
          style={{ left: x }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.08 }}
        >
          <div className="absolute inset-y-0 left-0 w-px bg-primary/70 shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
});
