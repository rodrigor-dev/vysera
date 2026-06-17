"use client";

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors,
  Copy,
  ClipboardPaste,
  Trash2,
  Gauge,
  Sparkles,
  Palette,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/editor-store';

type ClipType = 'video' | 'audio' | 'text' | 'sticker' | 'overlay';

export interface ContextMenuState {
  x: number;
  y: number;
  clipId?: string;
  trackId?: string;
}

interface TimelineContextMenuProps {
  menu: ContextMenuState | null;
  onClose: () => void;
}

export function TimelineContextMenu({ menu, onClose }: TimelineContextMenuProps) {
  const store = useEditorStore();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!menu) return;
    const handler = () => handleClose();
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('click', handler);
    window.addEventListener('keydown', keyHandler);
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', keyHandler);
    };
  }, [menu, handleClose]);

  const handleAction = useCallback(
    (action: () => void) => {
      action();
      handleClose();
    },
    [handleClose],
  );

  if (!menu) return null;

  const st = store.state;
  const actions: {
    id: string;
    label: string;
    icon: React.ElementType;
    shortcut?: string;
    danger?: boolean;
    divider?: boolean;
    disabled?: boolean;
    action: () => void;
  }[] = [];

  if (menu.clipId) {
    actions.push(
      {
        id: 'split',
        label: 'Split',
        icon: Scissors,
        shortcut: 'S',
        action: () => store.splitClip(menu.clipId!, st.currentTime),
      },
      {
        id: 'duplicate',
        label: 'Duplicate',
        icon: Copy,
        shortcut: 'Ctrl+D',
        action: () => store.duplicateClip(menu.clipId!),
      },
      {
        id: 'copy',
        label: 'Copy',
        icon: Copy,
        shortcut: 'Ctrl+C',
        action: () => {},
      },
      {
        id: 'paste',
        label: 'Paste',
        icon: ClipboardPaste,
        shortcut: 'Ctrl+V',
        action: () => {},
        divider: true,
      },
      {
        id: 'speed',
        label: 'Speed / Duration',
        icon: Gauge,
        action: () => {},
      },
      {
        id: 'effects',
        label: 'Effects',
        icon: Sparkles,
        action: () => {},
      },
      {
        id: 'color-grade',
        label: 'Color Grade',
        icon: Palette,
        action: () => {},
        divider: true,
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: Trash2,
        danger: true,
        shortcut: 'Del',
        action: () => store.removeClip(menu.clipId!),
      },
    );
  }

  if (menu.trackId && !menu.clipId) {
    actions.push(
      {
        id: 'add-clip',
        label: 'Add Clip',
        icon: Copy,
        action: () => {
          const track = st.tracks.find((t) => t.id === menu.trackId);
          if (!track) return;
          const clipTypeMap: Record<string, ClipType> = {
            video: 'video', audio: 'audio', text: 'text', sticker: 'sticker', overlay: 'overlay', effect: 'video',
          };
          store.addClip(menu.trackId!, {
            type: clipTypeMap[track.type] ?? 'video',
            startTime: st.currentTime,
            endTime: st.currentTime + 3,
          });
        },
      },
      {
        id: 'duplicate-track',
        label: 'Duplicate Track',
        icon: Copy,
        divider: true,
        action: () => {
          const origTrack = st.tracks.find((t) => t.id === menu.trackId);
          if (origTrack) store.addTrack(origTrack.type);
        },
      },
      {
        id: 'delete-track',
        label: 'Delete Track',
        icon: Trash2,
        danger: true,
        action: () => store.removeTrack(menu.trackId!),
      },
    );
  }

  if (!menu.clipId && !menu.trackId) {
    actions.push(
      { id: 'add-video', label: 'Add Video Track', icon: Copy, action: () => store.addTrack('video') },
      { id: 'add-audio', label: 'Add Audio Track', icon: Copy, action: () => store.addTrack('audio') },
      { id: 'add-text', label: 'Add Text Track', icon: Copy, action: () => store.addTrack('text') },
      {
        id: 'add-overlay', label: 'Add Overlay Track', icon: Copy, divider: true,
        action: () => store.addTrack('overlay'),
      },
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        key="cm-backdrop"
        className="fixed inset-0 z-[9999]"
        onClick={handleClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          key="cm-menu"
          className={cn(
            'absolute min-w-[200px] overflow-hidden rounded-xl border border-border/50',
            'bg-gradient-to-b from-card/95 to-card/80 p-1.5',
            'shadow-2xl backdrop-blur-xl',
          )}
          style={{ left: menu.x, top: menu.y }}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          {actions.map((item, idx) => (
            <React.Fragment key={item.id}>
              {item.divider && idx > 0 && (
                <div className="my-1 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
              )}
              <button
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150',
                  'hover:bg-primary/10',
                  item.danger
                    ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                    : 'text-foreground/80 hover:text-foreground',
                  item.disabled && 'pointer-events-none opacity-40',
                )}
                onClick={() => handleAction(item.action)}
                disabled={item.disabled}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.shortcut && (
                  <span className="text-[10px] text-muted-foreground/50">{item.shortcut}</span>
                )}
              </button>
            </React.Fragment>
          ))}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
