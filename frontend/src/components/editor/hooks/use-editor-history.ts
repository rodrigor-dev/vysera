"use client";

import { useCallback } from "react";
import { useEditorStore } from "@/store/editor-store";

export function useEditorHistory() {
  const state = useEditorStore((s) => s.state);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const pushHistory = useEditorStore((s) => s.pushHistory);

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);

  const pushSnapshot = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  return {
    canUndo,
    canRedo,
    undo: handleUndo,
    redo: handleRedo,
    pushSnapshot,
    historyIndex: state.historyIndex,
    historyLength: state.history.length,
  };
}
