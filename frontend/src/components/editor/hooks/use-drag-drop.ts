"use client";

import { useState, useCallback, useRef } from "react";
import { useEditorStore } from "@/store/editor-store";

export type DragType = "clip" | "track" | "trim-start" | "trim-end" | "keyframe" | null;

export interface DragPosition {
  x: number;
  y: number;
}

export interface DropTarget {
  trackId: string | null;
  time: number;
}

export interface DragDropState {
  isDragging: boolean;
  dragType: DragType;
  dragData: Record<string, unknown> | null;
  dragPosition: DragPosition;
  dropTarget: DropTarget;
}

function getDropTargetFromPosition(
  y: number,
  x: number,
  zoom: number,
  scrollX: number,
  scrollY: number,
): DropTarget {
  const tracks = useEditorStore.getState().state.tracks;

  const timelineY = y + scrollY;
  const timelineX = x + scrollX;

  let accumulatedY = 0;
  let targetTrackId: string | null = null;

  for (const track of tracks) {
    const trackStart = accumulatedY;
    const trackEnd = accumulatedY + track.height + 4;

    if (timelineY >= trackStart && timelineY <= trackEnd) {
      targetTrackId = track.id;
      break;
    }
    accumulatedY = trackEnd;
  }

  const time = Math.max(0, timelineX / zoom);

  return { trackId: targetTrackId, time };
}

export function useDragDrop() {
  const [dragState, setDragState] = useState<DragDropState>({
    isDragging: false,
    dragType: null,
    dragData: null,
    dragPosition: { x: 0, y: 0 },
    dropTarget: { trackId: null, time: 0 },
  });

  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;

  const startDrag = useCallback(
    (type: DragType, data: Record<string, unknown>, clientX: number, clientY: number) => {
      const store = useEditorStore.getState();
      const { zoom, scrollX, scrollY } = store.state;

      const target = getDropTargetFromPosition(clientY, clientX, zoom, scrollX, scrollY);

      setDragState({
        isDragging: true,
        dragType: type,
        dragData: data,
        dragPosition: { x: clientX, y: clientY },
        dropTarget: target,
      });
    },
    [],
  );

  const onDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragStateRef.current.isDragging) return;

      const store = useEditorStore.getState();
      const { zoom, scrollX, scrollY, snapEnabled, snapThreshold } = store.state;

      const target = getDropTargetFromPosition(clientY, clientX, zoom, scrollX, scrollY);

      if (snapEnabled && dragStateRef.current.dragType === "clip") {
        const timelineX = clientX + scrollX;
        const rawTime = Math.max(0, timelineX / zoom);

        const tracks = store.state.tracks;
        const dragClipId =
          dragStateRef.current.dragData?.clipId as string | undefined;
        const snapPoints: number[] = [0];
        for (const track of tracks) {
          for (const clip of track.clips) {
            if (clip.id === dragClipId) continue;
            snapPoints.push(clip.startTime);
            snapPoints.push(clip.endTime);
          }
        }

        let snappedTime = rawTime;
        let minDist = snapThreshold / zoom;
        for (const point of snapPoints) {
          const dist = Math.abs(rawTime - point);
          if (dist < minDist) {
            minDist = dist;
            snappedTime = point;
          }
        }

        target.time = snappedTime;
      }

      setDragState((prev) => ({
        ...prev,
        dragPosition: { x: clientX, y: clientY },
        dropTarget: target,
      }));
    },
    [],
  );

  const endDrag = useCallback(() => {
    if (!dragStateRef.current.isDragging) return;

    const finalState = dragStateRef.current;

    if (finalState.dragType === "clip") {
      const clipId = finalState.dragData?.clipId as string | undefined;
      const newTrackId = finalState.dropTarget.trackId;
      const newTime = finalState.dropTarget.time;

      if (clipId && newTrackId) {
        const store = useEditorStore.getState();
        store.moveClip(clipId, newTrackId, newTime);
      }
    }

    setDragState({
      isDragging: false,
      dragType: null,
      dragData: null,
      dragPosition: { x: 0, y: 0 },
      dropTarget: { trackId: null, time: 0 },
    });
  }, []);

  const canDrop = useCallback(
    (trackId: string | null): boolean => {
      if (!dragState.isDragging) return false;
      if (!trackId) return false;

      if (dragState.dragType === "clip") {
        const tracks = useEditorStore.getState().state.tracks;
        const targetTrack = tracks.find((t) => t.id === trackId);
        if (!targetTrack) return false;

        const dragClip = dragState.dragData;
        const clipType = dragClip?.type as string | undefined;

        if (clipType && targetTrack.type !== clipType) {
          if (targetTrack.type === "video" && (clipType === "text" || clipType === "sticker" || clipType === "overlay")) {
            return true;
          }
          return false;
        }

        return true;
      }

      if (dragState.dragType === "trim-start" || dragState.dragType === "trim-end") {
        return true;
      }

      if (dragState.dragType === "keyframe") {
        return true;
      }

      return false;
    },
    [dragState],
  );

  return {
    dragState,
    startDrag,
    onDrag,
    endDrag,
    canDrop,
  };
}
