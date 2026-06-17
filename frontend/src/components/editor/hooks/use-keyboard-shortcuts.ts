"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@/store/editor-store";

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  onSave?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true, onSave, onCopy, onPaste } = options;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      const store = useEditorStore.getState();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      if (ctrl && !isInputFocused) {
        switch (e.key.toLowerCase()) {
          case "z": {
            e.preventDefault();
            if (shift) {
              store.redo();
            } else {
              store.undo();
            }
            return;
          }
          case "s": {
            e.preventDefault();
            if (optionsRef.current.onSave) {
              optionsRef.current.onSave();
            }
            return;
          }
          case "c": {
            if (optionsRef.current.onCopy) {
              e.preventDefault();
              optionsRef.current.onCopy();
            }
            return;
          }
          case "v": {
            if (optionsRef.current.onPaste) {
              e.preventDefault();
              optionsRef.current.onPaste();
            }
            return;
          }
          case "d": {
            e.preventDefault();
            if (store.state.selectedClipId) {
              store.duplicateClip(store.state.selectedClipId);
            }
            return;
          }
        }
        return;
      }

      if (isInputFocused) return;

      switch (e.key) {
        case " ": {
          e.preventDefault();
          store.togglePlayback();
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          const newTime = Math.max(0, store.state.currentTime - 1 / store.state.fps);
          store.setCurrentTime(newTime);
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          const newTime = Math.min(store.state.duration, store.state.currentTime + 1 / store.state.fps);
          store.setCurrentTime(newTime);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const newVol = Math.min(1, store.state.volume + 0.1);
          store.markDirty();
          // volume is on state
          useEditorStore.setState({
            state: { ...store.state, volume: newVol },
          });
          break;
        }
        case "ArrowDown": {
          e.preventDefault();
          const newVol = Math.max(0, store.state.volume - 0.1);
          store.markDirty();
          useEditorStore.setState({
            state: { ...store.state, volume: newVol },
          });
          break;
        }
        case "Delete":
        case "Backspace": {
          e.preventDefault();
          if (store.state.selectedClipId) {
            store.removeClip(store.state.selectedClipId);
          }
          break;
        }
        case "s":
        case "S": {
          e.preventDefault();
          store.setSnapEnabled(!store.state.snapEnabled);
          break;
        }
        case "i":
        case "I": {
          e.preventDefault();
          useEditorStore.setState({
            state: { ...store.state, rangeStart: store.state.currentTime },
          });
          break;
        }
        case "o":
        case "O": {
          e.preventDefault();
          useEditorStore.setState({
            state: { ...store.state, rangeEnd: store.state.currentTime },
          });
          break;
        }
        case "=":
        case "+": {
          e.preventDefault();
          store.zoomIn();
          break;
        }
        case "-": {
          e.preventDefault();
          store.zoomOut();
          break;
        }
      }
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);
}
