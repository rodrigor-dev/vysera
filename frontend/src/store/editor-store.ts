import { create } from "zustand";
import type * as types from "@/components/editor/types";

const generateId = () => crypto.randomUUID();

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function createDefaultClip(trackId: string, type: types.TrackType, partial: Partial<types.Clip>): types.Clip {
  return {
    trackId,
    type,
    name: `New ${type} clip`,
    startTime: 0,
    endTime: 5,
    duration: 5,
    trimStart: 0,
    trimEnd: 0,
    speed: 1,
    volume: 1,
    opacity: 1,
    x: 0,
    y: 0,
    width: type === "text" ? 400 : type === "sticker" ? 200 : 1920,
    height: type === "text" ? 100 : type === "sticker" ? 200 : 1080,
    rotation: 0,
    scale: 1,
    effects: [],
    keyframes: [],
    transitions: [],
    locked: false,
    muted: false,
    visible: true,
    ...partial,
    id: partial.id ?? generateId(),
  };
}

const defaultColorGrade: types.ColorGradeData = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  temperature: 0,
  tint: 0,
  vignette: 0,
  sharpen: 0,
  lutIntensity: 0,
};

const defaultAudioFilter: types.AudioFilterData = {
  volume: 1,
  bass: 0,
  treble: 0,
  reverb: 0,
  echo: 0,
  noiseGate: false,
  noiseReduction: false,
  normalization: false,
};

const defaultTextData: types.TextClipData = {
  content: "Text",
  fontFamily: "Inter",
  fontSize: 48,
  fontWeight: 700,
  color: "#ffffff",
  backgroundColor: "#00000000",
  backgroundOpacity: 0,
  textAlign: "center",
  lineHeight: 1.2,
  letterSpacing: 0,
  animation: "none",
  shadow: false,
  stroke: false,
  strokeColor: "#000000",
  strokeWidth: 2,
};

function createInitialEditorState(): types.EditorState {
  const state: types.EditorState = {
    projectId: generateId(),
    projectName: "Untitled Project",
    tracks: [],
    duration: 60,
    fps: 30,
    resolution: { width: 1920, height: 1080 },
    currentTime: 0,
    isPlaying: false,
    playbackSpeed: 1,
    volume: 1,
    muted: false,
    zoom: 100,
    scrollX: 0,
    scrollY: 0,
    selectedClipId: null,
    selectedTrackId: null,
    snapEnabled: true,
    snapThreshold: 10,
    selectedClipIds: [],
    rangeStart: 0,
    rangeEnd: 0,
    history: [],
    historyIndex: -1,
    maxHistory: 50,
    lastSaved: null,
    isDirty: false,
    autosaveInterval: 30000,
    showExportModal: false,
    showSettingsModal: false,
    activeTool: "select" as types.ToolType,
    leftPanelOpen: true,
    rightPanelOpen: false,
    showFrameNumbers: false,
    isFullscreen: false,
    videoSrc: null,
    isLoading: false,
    projectLoaded: false,
    saveStatus: "unsaved" as const,
  };

  const initialSnapshot: types.EditorSnapshot = {
    tracks: [],
    currentTime: 0,
    timestamp: Date.now(),
  };

  state.history = [initialSnapshot];
  state.historyIndex = 0;

  return state;
}

function snapTime(time: number, snapThreshold: number, snapPoints: number[]): number {
  if (snapPoints.length === 0 || snapThreshold <= 0) return time;

  let closestSnap = time;
  let minDist = snapThreshold;

  for (const point of snapPoints) {
    const dist = Math.abs(time - point);
    if (dist < minDist) {
      minDist = dist;
      closestSnap = point;
    }
  }

  return closestSnap;
}

function getSnapPoints(tracks: types.Track[], excludeClipId?: string): number[] {
  const points: number[] = [0];

  for (const track of tracks) {
    for (const clip of track.clips) {
      if (clip.id === excludeClipId) continue;
      points.push(clip.startTime);
      points.push(clip.endTime);
      points.push(clip.startTime + (clip.endTime - clip.startTime) / 2);
    }
  }

  return points;
}

function findClipInTracks(
  tracks: types.Track[],
  clipId: string,
): { track: types.Track; clip: types.Clip; trackIndex: number; clipIndex: number } | null {
  for (let ti = 0; ti < tracks.length; ti++) {
    const track = tracks[ti];
    if (!track) continue;
    for (let ci = 0; ci < track.clips.length; ci++) {
      const clip = track.clips[ci];
      if (!clip) continue;
      if (clip.id === clipId) {
        return { track, clip, trackIndex: ti, clipIndex: ci };
      }
    }
  }
  return null;
}

interface EditorStore {
  state: types.EditorState;

  addTrack: (type: types.TrackType, name?: string) => void;
  removeTrack: (trackId: string) => void;
  moveTrack: (trackId: string, newOrder: number) => void;
  updateTrack: (trackId: string, updates: Partial<types.Track>) => void;

  addClip: (trackId: string, clip: Partial<types.Clip>) => string;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<types.Clip>) => void;
  moveClip: (clipId: string, newTrackId: string, newStartTime: number) => void;
  splitClip: (clipId: string, time: number) => void;
  trimClipStart: (clipId: string, delta: number) => void;
  trimClipEnd: (clipId: string, delta: number) => void;
  duplicateClip: (clipId: string) => void;

  play: () => void;
  pause: () => void;
  togglePlayback: () => void;
  seek: (time: number) => void;
  setCurrentTime: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;

  selectClip: (clipId: string | null) => void;
  selectTrack: (trackId: string | null) => void;
  addToSelection: (clipId: string) => void;
  clearSelection: () => void;

  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  setScrollX: (x: number) => void;
  setScrollY: (y: number) => void;

  addEffect: (clipId: string, effect: types.ClipEffect) => void;
  removeEffect: (clipId: string, effectId: string) => void;
  updateEffect: (clipId: string, effectId: string, params: Partial<types.ClipEffect>) => void;

  addKeyframe: (clipId: string, keyframe: types.Keyframe) => void;
  removeKeyframe: (clipId: string, keyframeId: string) => void;
  updateKeyframe: (clipId: string, keyframeId: string, updates: Partial<types.Keyframe>) => void;

  addTransition: (clipId: string, transition: types.Transition) => void;
  removeTransition: (clipId: string, transitionId: string) => void;

  setColorGrade: (clipId: string, grade: Partial<types.ColorGradeData>) => void;
  setAudioFilter: (clipId: string, filter: Partial<types.AudioFilterData>) => void;
  setTextData: (clipId: string, text: Partial<types.TextClipData>) => void;

  setSnapEnabled: (enabled: boolean) => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  markSaved: () => void;
  markDirty: () => void;
  setLastSaved: (time: number) => void;

  loadProject: (project: Partial<types.EditorState>) => void;
  resetProject: () => void;

  setExportModal: (show: boolean) => void;
  setSettingsModal: (show: boolean) => void;

  setActiveTool: (tool: types.ToolType) => void;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  toggleSnap: () => void;
  setIsFullscreen: (full: boolean) => void;
  setShowFrameNumbers: (show: boolean) => void;
  setVideoSrc: (src: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setProjectLoaded: (loaded: boolean) => void;
  setSaveStatus: (status: "saved" | "unsaved" | "saving") => void;
  setMuted: (muted: boolean) => void;
  setProjectName: (name: string) => void;
  setVolume: (volume: number) => void;
  previousFrame: () => void;
  nextFrame: () => void;
  stop: () => void;
}

export const useEditorStore = create<EditorStore>()((set, get) => ({
  state: createInitialEditorState(),

  pushHistory: () => {
    const { state } = get();
    const snapshot: types.EditorSnapshot = {
      tracks: deepClone(state.tracks),
      currentTime: state.currentTime,
      timestamp: Date.now(),
    };

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(snapshot);

    while (newHistory.length > state.maxHistory) {
      newHistory.shift();
    }

    set({
      state: {
        ...state,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isDirty: true,
      },
    });
  },

  undo: () => {
    const { state } = get();
    if (state.historyIndex <= 0) return;

    const newIndex = state.historyIndex - 1;
    const snapshot = state.history[newIndex];
    if (!snapshot) return;

    set({
      state: {
        ...state,
        tracks: deepClone(snapshot.tracks),
        currentTime: snapshot.currentTime,
        historyIndex: newIndex,
        isDirty: true,
      },
    });
  },

  redo: () => {
    const { state } = get();
    if (state.historyIndex >= state.history.length - 1) return;

    const newIndex = state.historyIndex + 1;
    const snapshot = state.history[newIndex];
    if (!snapshot) return;

    set({
      state: {
        ...state,
        tracks: deepClone(snapshot.tracks),
        currentTime: snapshot.currentTime,
        historyIndex: newIndex,
        isDirty: true,
      },
    });
  },

  addTrack: (type, name) => {
    get().pushHistory();
    const { state } = get();

    const typeLabels: Record<types.TrackType, string> = {
      video: "Video",
      audio: "Audio",
      text: "Text",
      sticker: "Sticker",
      overlay: "Overlay",
      effect: "Effect",
    };

    const newTrack: types.Track = {
      id: generateId(),
      name: name ?? `${typeLabels[type] ?? type} Track ${state.tracks.length + 1}`,
      type,
      clips: [],
      height: type === "audio" ? 60 : type === "text" ? 80 : 100,
      locked: false,
      muted: false,
      visible: true,
      order: state.tracks.length,
    };

    set({
      state: {
        ...state,
        tracks: [...state.tracks, newTrack],
      },
    });
  },

  removeTrack: (trackId) => {
    get().pushHistory();
    const { state } = get();

    const tracks = state.tracks.filter((t) => t.id !== trackId);
    const targetTrack = state.tracks.find((t) => t.id === trackId);
    const hadSelectedClip = targetTrack?.clips.some((c) => c.id === state.selectedClipId) ?? false;

    set({
      state: {
        ...state,
        tracks,
        selectedTrackId: state.selectedTrackId === trackId ? null : state.selectedTrackId,
        selectedClipId: hadSelectedClip ? null : state.selectedClipId,
        selectedClipIds: hadSelectedClip ? [] : state.selectedClipIds,
      },
    });
  },

  moveTrack: (trackId, newOrder) => {
    get().pushHistory();
    const { state } = get();

    const sorted = [...state.tracks].sort((a, b) => a.order - b.order);
    const trackIdx = sorted.findIndex((t) => t.id === trackId);
    if (trackIdx === -1) return;

    const track = sorted[trackIdx];
    if (!track) return;

    const remaining = sorted.filter((t) => t.id !== trackId);
    const clamped = clamp(newOrder, 0, remaining.length);

    const result: types.Track[] = [];
    for (let i = 0; i <= remaining.length; i++) {
      if (i === clamped) {
        result.push({ ...track, order: i });
      } else {
        const src = remaining[i < clamped ? i : i - 1];
        if (src) result.push({ ...src, order: i });
      }
    }

    set({ state: { ...state, tracks: result } });
  },

  updateTrack: (trackId, updates) => {
    get().pushHistory();
    const { state } = get();

    set({
      state: {
        ...state,
        tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, ...updates } : t)),
      },
    });
  },

  addClip: (trackId, partial) => {
    get().pushHistory();
    const { state } = get();

    const track = state.tracks.find((t) => t.id === trackId);
    if (!track) return "";

    const type = partial.type ?? track.type;
    const newClip = createDefaultClip(trackId, type, partial);

    if (state.snapEnabled) {
      const snapPoints = getSnapPoints(state.tracks);
      const snappedTime = snapTime(newClip.startTime, state.snapThreshold, snapPoints);
      newClip.startTime = snappedTime;
      newClip.endTime = snappedTime + (newClip.endTime - newClip.startTime);
    }

    set({
      state: {
        ...state,
        tracks: state.tracks.map((t) =>
          t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t,
        ),
        selectedClipId: newClip.id,
        selectedClipIds: [newClip.id],
      },
    });

    return newClip.id;
  },

  removeClip: (clipId) => {
    get().pushHistory();
    const { state } = get();

    set({
      state: {
        ...state,
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.filter((c) => c.id !== clipId),
        })),
        selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
        selectedClipIds: state.selectedClipIds.filter((id) => id !== clipId),
      },
    });
  },

  updateClip: (clipId, updates) => {
    get().pushHistory();
    const { state } = get();

    set({
      state: {
        ...state,
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)),
        })),
      },
    });
  },

  moveClip: (clipId, newTrackId, newStartTime) => {
    get().pushHistory();
    const { state } = get();

    const found = findClipInTracks(state.tracks, clipId);
    if (!found) return;

    const { clip } = found;
    const duration = clip.endTime - clip.startTime;
    let targetTime = newStartTime;

    if (state.snapEnabled) {
      const snapPoints = getSnapPoints(state.tracks, clipId);
      targetTime = snapTime(targetTime, state.snapThreshold, snapPoints);
    }

    targetTime = Math.max(0, targetTime);

    const updatedClip = { ...clip, trackId: newTrackId, startTime: targetTime, endTime: targetTime + duration };

    set({
      state: {
        ...state,
        tracks: state.tracks.map((t) => {
          if (t.id === found.track.id) {
            return { ...t, clips: t.clips.filter((c) => c.id !== clipId) };
          }
          if (t.id === newTrackId) {
            return { ...t, clips: [...t.clips, updatedClip] };
          }
          return t;
        }),
      },
    });
  },

  splitClip: (clipId, time) => {
    const { state } = get();
    const found = findClipInTracks(state.tracks, clipId);
    if (!found) return;

    const { clip, trackIndex, clipIndex } = found;
    const splitTimelineTime = time;

    if (splitTimelineTime <= clip.startTime || splitTimelineTime >= clip.endTime) return;

    get().pushHistory();
    const { state: updatedState } = get();

    const reFound = findClipInTracks(updatedState.tracks, clipId);
    if (!reFound) return;
    const { clip: freshClip } = reFound;

    const firstDuration = splitTimelineTime - freshClip.startTime;
    const secondDuration = freshClip.endTime - splitTimelineTime;

    const firstClip: types.Clip = {
      ...freshClip,
      id: generateId(),
      endTime: splitTimelineTime,
      trimEnd: freshClip.duration - freshClip.trimStart - firstDuration,
      effects: deepClone(freshClip.effects),
      keyframes: deepClone(freshClip.keyframes.filter((k) => k.time <= firstDuration)),
      transitions: deepClone(freshClip.transitions),
    };

    const secondClip: types.Clip = {
      ...freshClip,
      id: generateId(),
      startTime: splitTimelineTime,
      trimStart: freshClip.trimStart + firstDuration,
      endTime: splitTimelineTime + secondDuration,
      effects: deepClone(freshClip.effects),
      keyframes: deepClone(
        freshClip.keyframes
          .filter((k) => k.time >= firstDuration)
          .map((k) => ({ ...k, time: k.time - firstDuration })),
      ),
      transitions: deepClone(freshClip.transitions),
    };

    const tracks = deepClone(updatedState.tracks);
    const targetTrack = tracks[trackIndex];
    if (!targetTrack) return;
    targetTrack.clips.splice(clipIndex, 1, firstClip, secondClip);

    set({
      state: {
        ...updatedState,
        tracks,
        selectedClipId: firstClip.id,
        selectedClipIds: [firstClip.id],
      },
    });
  },

  trimClipStart: (clipId, delta) => {
    get().pushHistory();
    const { state } = get();

    const found = findClipInTracks(state.tracks, clipId);
    if (!found) return;

    const { clip } = found;
    const effectiveDuration = clip.endTime - clip.startTime;
    const maxTrim = effectiveDuration - 0.1;
    const clampedDelta = clamp(delta, -clip.trimStart, maxTrim);

    const newTrimStart = clip.trimStart + clampedDelta;
    const newStartTime = clip.startTime + clampedDelta;

    set({
      state: {
        ...state,
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId
              ? { ...c, trimStart: Math.max(0, newTrimStart), startTime: newStartTime }
              : c,
          ),
        })),
      },
    });
  },

  trimClipEnd: (clipId, delta) => {
    get().pushHistory();
    const { state } = get();

    const found = findClipInTracks(state.tracks, clipId);
    if (!found) return;

    const { clip } = found;
    const effectiveDuration = clip.endTime - clip.startTime;
    const maxTrim = effectiveDuration - 0.1;
    const clampedDelta = clamp(delta, -clip.trimEnd, maxTrim);

    const newTrimEnd = clip.trimEnd + clampedDelta;
    const newEndTime = clip.endTime - clampedDelta;

    set({
      state: {
        ...state,
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId
              ? { ...c, trimEnd: Math.max(0, newTrimEnd), endTime: newEndTime }
              : c,
          ),
        })),
      },
    });
  },

  duplicateClip: (clipId) => {
    get().pushHistory();
    const { state } = get();

    const found = findClipInTracks(state.tracks, clipId);
    if (!found) return;

    const { clip, trackIndex } = found;
    const duration = clip.endTime - clip.startTime;
    const newClip: types.Clip = {
      ...deepClone(clip),
      id: generateId(),
      startTime: clip.endTime + 0.1,
      endTime: clip.endTime + 0.1 + duration,
    };

    const tracks = deepClone(state.tracks);
    const targetTrack = tracks[trackIndex];
    if (!targetTrack) return;
    targetTrack.clips.push(newClip);

    set({ state: { ...state, tracks } });
  },

  play: () => {
    set((store) => ({
      state: { ...store.state, isPlaying: true },
    }));
  },

  pause: () => {
    set((store) => ({
      state: { ...store.state, isPlaying: false },
    }));
  },

  togglePlayback: () => {
    set((store) => ({
      state: { ...store.state, isPlaying: !store.state.isPlaying },
    }));
  },

  seek: (time) => {
    const { state } = get();
    const clamped = clamp(time, 0, state.duration);
    set({ state: { ...state, currentTime: clamped } });
  },

  setCurrentTime: (time) => {
    const { state } = get();
    const clamped = clamp(time, 0, state.duration);
    set({ state: { ...state, currentTime: clamped } });
  },

  setPlaybackSpeed: (speed) => {
    const clamped = clamp(speed, 0.25, 4);
    set((store) => ({
      state: { ...store.state, playbackSpeed: clamped },
    }));
  },

  selectClip: (clipId) => {
    set((store) => ({
      state: {
        ...store.state,
        selectedClipId: clipId,
        selectedClipIds: clipId ? [clipId] : [],
      },
    }));
  },

  selectTrack: (trackId) => {
    set((store) => ({
      state: { ...store.state, selectedTrackId: trackId },
    }));
  },

  addToSelection: (clipId) => {
    set((store) => ({
      state: {
        ...store.state,
        selectedClipIds: store.state.selectedClipIds.includes(clipId)
          ? store.state.selectedClipIds.filter((id) => id !== clipId)
          : [...store.state.selectedClipIds, clipId],
      },
    }));
  },

  clearSelection: () => {
    set((store) => ({
      state: {
        ...store.state,
        selectedClipId: null,
        selectedClipIds: [],
      },
    }));
  },

  setZoom: (zoom) => {
    const clamped = clamp(zoom, 10, 500);
    set((store) => ({
      state: { ...store.state, zoom: clamped },
    }));
  },

  zoomIn: () => {
    set((store) => ({
      state: {
        ...store.state,
        zoom: clamp(store.state.zoom * 1.3, 10, 500),
      },
    }));
  },

  zoomOut: () => {
    set((store) => ({
      state: {
        ...store.state,
        zoom: clamp(store.state.zoom / 1.3, 10, 500),
      },
    }));
  },

  zoomToFit: () => {
    const { state } = get();
    const timelineWidth = 1200;
    const zoom = state.duration > 0 ? Math.max(10, timelineWidth / state.duration) : 100;
    set({ state: { ...state, zoom: clamp(zoom, 10, 500), scrollX: 0 } });
  },

  setScrollX: (x) => {
    set((store) => ({
      state: { ...store.state, scrollX: Math.max(0, x) },
    }));
  },

  setScrollY: (y) => {
    set((store) => ({
      state: { ...store.state, scrollY: Math.max(0, y) },
    }));
  },

  addEffect: (clipId, effect) => {
    get().pushHistory();
    const { state } = get();

    set({
      state: {
        ...state,
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId ? { ...c, effects: [...c.effects, effect] } : c,
          ),
        })),
      },
    });
  },

  removeEffect: (clipId, effectId) => {
    get().pushHistory();
    const { state } = get();

    set({
      state: {
        ...state,
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId
              ? { ...c, effects: c.effects.filter((e) => e.id !== effectId) }
              : c,
          ),
        })),
      },
    });
  },

  updateEffect: (clipId, effectId, params) => {
    get().pushHistory();
    const { state } = get();

    set({
      state: {
        ...state,
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId
              ? {
                  ...c,
                  effects: c.effects.map((e) =>
                    e.id === effectId
                      ? { ...e, ...params, params: { ...e.params, ...(params.params ?? {}) } }
                      : e,
                  ),
                }
              : c,
          ),
        })),
      },
    });
  },

  addKeyframe: (clipId, keyframe) => {
    get().pushHistory();
    const { state } = get();

    set({
      state: {
        ...state,
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId ? { ...c, keyframes: [...c.keyframes, keyframe] } : c,
          ),
        })),
      },
    });
  },

  removeKeyframe: (clipId, keyframeId) => {
    get().pushHistory();
    const { state } = get();

    set({
      state: {
        ...state,
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId
              ? { ...c, keyframes: c.keyframes.filter((k) => k.id !== keyframeId) }
              : c,
          ),
        })),
      },
    });
  },

  updateKeyframe: (clipId, keyframeId, updates) => {
    get().pushHistory();
    const { state } = get();

    set({
      state: {
        ...state,
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId
              ? {
                  ...c,
                  keyframes: c.keyframes.map((k) =>
                    k.id === keyframeId ? { ...k, ...updates } : k,
                  ),
                }
              : c,
          ),
        })),
      },
    });
  },

  addTransition: (clipId, transition) => {
    get().pushHistory();
    const { state } = get();

    set({
      state: {
        ...state,
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId ? { ...c, transitions: [...c.transitions, transition] } : c,
          ),
        })),
      },
    });
  },

  removeTransition: (clipId, transitionId) => {
    get().pushHistory();
    const { state } = get();

    set({
      state: {
        ...state,
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId
              ? { ...c, transitions: c.transitions.filter((tr) => tr.id !== transitionId) }
              : c,
          ),
        })),
      },
    });
  },

  setColorGrade: (clipId, grade) => {
    get().pushHistory();
    const { state } = get();

    set({
      state: {
        ...state,
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId
              ? { ...c, colorGrade: { ...(c.colorGrade ?? defaultColorGrade), ...grade } }
              : c,
          ),
        })),
      },
    });
  },

  setAudioFilter: (clipId, filter) => {
    get().pushHistory();
    const { state } = get();

    set({
      state: {
        ...state,
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId
              ? { ...c, audioFilters: { ...(c.audioFilters ?? defaultAudioFilter), ...filter } }
              : c,
          ),
        })),
      },
    });
  },

  setTextData: (clipId, text) => {
    get().pushHistory();
    const { state } = get();

    set({
      state: {
        ...state,
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId
              ? { ...c, text: { ...(c.text ?? defaultTextData), ...text } }
              : c,
          ),
        })),
      },
    });
  },

  setSnapEnabled: (enabled) => {
    set((store) => ({
      state: { ...store.state, snapEnabled: enabled },
    }));
  },

  markSaved: () => {
    set((store) => ({
      state: { ...store.state, isDirty: false },
    }));
  },

  markDirty: () => {
    set((store) => ({
      state: { ...store.state, isDirty: true },
    }));
  },

  setLastSaved: (time) => {
    set((store) => ({
      state: { ...store.state, lastSaved: time },
    }));
  },

  loadProject: (project) => {
    const currentState = get().state;
    const newState: types.EditorState = {
      ...currentState,
      ...project,
    };

    const snapshot: types.EditorSnapshot = {
      tracks: deepClone(newState.tracks),
      currentTime: newState.currentTime,
      timestamp: Date.now(),
    };

    newState.history = [snapshot];
    newState.historyIndex = 0;
    newState.isDirty = false;

    set({ state: newState });
  },

  resetProject: () => {
    set({ state: createInitialEditorState() });
  },

  setExportModal: (show) => {
    set((store) => ({
      state: { ...store.state, showExportModal: show },
    }));
  },

  setSettingsModal: (show) => {
    set((store) => ({
      state: { ...store.state, showSettingsModal: show },
    }));
  },

  setActiveTool: (tool) => {
    set((store) => ({ state: { ...store.state, activeTool: tool } }));
  },

  setLeftPanelOpen: (open) => {
    set((store) => ({ state: { ...store.state, leftPanelOpen: open } }));
  },

  setRightPanelOpen: (open) => {
    set((store) => ({ state: { ...store.state, rightPanelOpen: open } }));
  },

  toggleSnap: () => {
    set((store) => ({ state: { ...store.state, snapEnabled: !store.state.snapEnabled } }));
  },

  setIsFullscreen: (full) => {
    set((store) => ({ state: { ...store.state, isFullscreen: full } }));
  },

  setShowFrameNumbers: (show) => {
    set((store) => ({ state: { ...store.state, showFrameNumbers: show } }));
  },

  setVideoSrc: (src) => {
    set((store) => ({ state: { ...store.state, videoSrc: src } }));
  },

  setIsLoading: (loading) => {
    set((store) => ({ state: { ...store.state, isLoading: loading } }));
  },

  setProjectLoaded: (loaded) => {
    set((store) => ({ state: { ...store.state, projectLoaded: loaded } }));
  },

  setSaveStatus: (status) => {
    set((store) => ({ state: { ...store.state, saveStatus: status } }));
  },

  setMuted: (muted) => {
    set((store) => ({ state: { ...store.state, muted } }));
  },

  setProjectName: (name) => {
    set((store) => ({ state: { ...store.state, projectName: name, isDirty: true, saveStatus: "unsaved" as const } }));
  },

  setVolume: (volume) => {
    set((store) => ({ state: { ...store.state, volume: Math.max(0, Math.min(1, volume)) } }));
  },

  previousFrame: () => {
    const { state } = get();
    const frameDur = 1 / state.fps;
    set((store) => ({ state: { ...store.state, currentTime: Math.max(0, store.state.currentTime - frameDur), isPlaying: false } }));
  },

  nextFrame: () => {
    const { state } = get();
    const frameDur = 1 / state.fps;
    set((store) => ({ state: { ...store.state, currentTime: Math.min(store.state.duration, store.state.currentTime + frameDur), isPlaying: false } }));
  },

  stop: () => {
    set((store) => ({ state: { ...store.state, isPlaying: false, currentTime: 0 } }));
  },
}));

export const useStore = useEditorStore;
