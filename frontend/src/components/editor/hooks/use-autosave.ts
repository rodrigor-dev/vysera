"use client";

import { useEffect, useCallback, useRef } from "react";
import { useEditorStore } from "@/store/editor-store";

const AUTOSAVE_KEY = "vysera-editor-autosave";
const DEFAULT_INTERVAL = 30000;

interface AutosaveData {
  state: Record<string, unknown>;
  timestamp: number;
}

export function useAutosave() {
  const state = useEditorStore((s) => s.state);
  const markSaved = useEditorStore((s) => s.markSaved);
  const markDirty = useEditorStore((s) => s.markDirty);
  const setLastSaved = useEditorStore((s) => s.setLastSaved);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSavingRef = useRef(false);

  const saveToLocalStorage = useCallback(() => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    try {
      const data: AutosaveData = {
        state: JSON.parse(JSON.stringify(state)),
        timestamp: Date.now(),
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
      markSaved();
      setLastSaved(Date.now());
    } catch (err) {
      console.error("Autosave to localStorage failed:", err);
    } finally {
      isSavingRef.current = false;
    }
  }, [state, markSaved, setLastSaved]);

  const saveToServer = useCallback(async () => {
    try {
      const response = await fetch("/api/editor/autosave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: state.projectId,
          tracks: state.tracks,
          currentTime: state.currentTime,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        console.warn("Server autosave returned", response.status);
      }
    } catch {
      // Silently fail — autosave is best-effort
    }
  }, [state.projectId, state.tracks, state.currentTime]);

  const saveNow = useCallback(async () => {
    saveToLocalStorage();
    if (navigator.onLine) {
      await saveToServer();
    }
  }, [saveToLocalStorage, saveToServer]);

  useEffect(() => {
    const interval = state.autosaveInterval ?? DEFAULT_INTERVAL;
    if (interval <= 0) return;

    intervalRef.current = setInterval(() => {
      const currentState = useEditorStore.getState().state;
      if (currentState.isDirty) {
        saveNow();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.autosaveInterval, saveNow]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const currentState = useEditorStore.getState().state;
      if (currentState.isDirty) {
        saveToLocalStorage();
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveToLocalStorage]);

  return {
    lastSaved: state.lastSaved,
    isDirty: state.isDirty,
    saveNow,
  };
}
