export type ClipType = 'video' | 'audio' | 'text' | 'sticker' | 'overlay';
export type TrackType = 'video' | 'audio' | 'text' | 'sticker' | 'overlay' | 'effect';
export type ToolType = 'select' | 'cut' | 'transition' | 'text' | 'draw' | 'zoom';

export interface Resolution {
  width: number;
  height: number;
}

export interface ClipEffect {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  params: Record<string, unknown>;
}

export interface Keyframe {
  id: string;
  property: string;
  time: number;
  value: unknown;
  easing?: string;
}

export interface Transition {
  id: string;
  type: string;
  duration: number;
  direction?: string;
}

export interface ColorGradeData {
  brightness: number;
  contrast: number;
  saturation: number;
  exposure: number;
  highlights: number;
  shadows: number;
  temperature: number;
  tint: number;
  vignette: number;
  sharpen: number;
  lutIntensity: number;
}

export interface AudioFilterData {
  volume: number;
  bass: number;
  treble: number;
  reverb: number;
  echo: number;
  noiseGate: boolean;
  noiseReduction: boolean;
  normalization: boolean;
}

export interface TextClipData {
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  textAlign: string;
  lineHeight: number;
  letterSpacing: number;
  animation: string;
  shadow: boolean;
  stroke: boolean;
  strokeColor: string;
  strokeWidth: number;
}

export interface Clip {
  id: string;
  trackId: string;
  type: ClipType;
  name: string;
  src?: string;
  startTime: number;
  endTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  speed: number;
  volume: number;
  opacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  effects: ClipEffect[];
  keyframes: Keyframe[];
  transitions: Transition[];
  colorGrade?: ColorGradeData;
  audioFilters?: AudioFilterData;
  text?: TextClipData;
  locked: boolean;
  muted: boolean;
  visible: boolean;
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  clips: Clip[];
  height: number;
  locked: boolean;
  muted: boolean;
  visible: boolean;
  order: number;
}

export interface EditorSnapshot {
  tracks: Track[];
  currentTime: number;
  timestamp: number;
}

export interface EditorState {
  projectId: string;
  projectName: string;
  tracks: Track[];
  duration: number;
  fps: number;
  resolution: Resolution;
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  volume: number;
  muted: boolean;
  zoom: number;
  scrollX: number;
  scrollY: number;
  selectedClipId: string | null;
  selectedTrackId: string | null;
  snapEnabled: boolean;
  snapThreshold: number;
  selectedClipIds: string[];
  rangeStart: number;
  rangeEnd: number;
  history: EditorSnapshot[];
  historyIndex: number;
  maxHistory: number;
  lastSaved: number | null;
  isDirty: boolean;
  autosaveInterval: number;
  showExportModal: boolean;
  showSettingsModal: boolean;
  activeTool: ToolType;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  showFrameNumbers: boolean;
  isFullscreen: boolean;
  videoSrc: string | null;
  isLoading: boolean;
  projectLoaded: boolean;
  saveStatus: 'saved' | 'unsaved' | 'saving';
}

export interface EditorStore {
  state: EditorState;

  addTrack: (type: TrackType, name?: string) => void;
  removeTrack: (trackId: string) => void;
  moveTrack: (trackId: string, newOrder: number) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;

  addClip: (trackId: string, clip: Partial<Clip>) => string;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
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

  addEffect: (clipId: string, effect: ClipEffect) => void;
  removeEffect: (clipId: string, effectId: string) => void;
  updateEffect: (clipId: string, effectId: string, params: Partial<ClipEffect>) => void;

  addKeyframe: (clipId: string, keyframe: Keyframe) => void;
  removeKeyframe: (clipId: string, keyframeId: string) => void;
  updateKeyframe: (clipId: string, keyframeId: string, updates: Partial<Keyframe>) => void;

  addTransition: (clipId: string, transition: Transition) => void;
  removeTransition: (clipId: string, transitionId: string) => void;

  setColorGrade: (clipId: string, grade: Partial<ColorGradeData>) => void;
  setAudioFilter: (clipId: string, filter: Partial<AudioFilterData>) => void;
  setTextData: (clipId: string, text: Partial<TextClipData>) => void;

  setSnapEnabled: (enabled: boolean) => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;

  markSaved: () => void;
  markDirty: () => void;
  setLastSaved: (time: number) => void;

  loadProject: (project: Partial<EditorState>) => void;
  resetProject: () => void;

  setExportModal: (show: boolean) => void;
  setSettingsModal: (show: boolean) => void;

  setActiveTool: (tool: ToolType) => void;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  toggleSnap: () => void;
  setIsFullscreen: (full: boolean) => void;
  setShowFrameNumbers: (show: boolean) => void;
  setVideoSrc: (src: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setProjectLoaded: (loaded: boolean) => void;
  setSaveStatus: (status: 'saved' | 'unsaved' | 'saving') => void;
  setMuted: (muted: boolean) => void;
  setProjectName: (name: string) => void;
}
