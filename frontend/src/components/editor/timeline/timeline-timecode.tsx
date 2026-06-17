"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export function formatTimecode(seconds: number, fps: number = 30): string {
  const sign = seconds < 0 ? '-' : '';
  const abs = Math.abs(seconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = Math.floor(abs % 60);
  const f = Math.floor((abs % 1) * fps);
  return `${sign}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
}

export function formatTimeShort(seconds: number): string {
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = Math.floor(abs % 60);
  const ms = Math.floor((abs % 1) * 100);
  if (m > 0) return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  return `${s}.${ms.toString().padStart(2, '0')}`;
}

interface TimelineTimecodeProps {
  seconds: number;
  fps?: number;
  variant?: 'full' | 'short' | 'compact';
  className?: string;
}

export const TimelineTimecode = React.memo(function TimelineTimecode({
  seconds,
  fps = 30,
  variant = 'full',
  className,
}: TimelineTimecodeProps) {
  const display = variant === 'short'
    ? formatTimeShort(seconds)
    : variant === 'compact'
      ? formatTimecode(seconds, fps).slice(3)
      : formatTimecode(seconds, fps);

  return (
    <span
      className={cn(
        'font-mono text-xs tabular-nums tracking-wider',
        variant === 'compact' ? 'text-[10px]' : 'text-xs',
        className,
      )}
    >
      {display}
    </span>
  );
});
