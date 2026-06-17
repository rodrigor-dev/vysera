export type TrackType = "video" | "audio" | "text" | "sticker" | "overlay" | "effect";

export interface Clip {
  id: string;
  trackId: string;
  type: TrackType;
  name: string;
  src?: string;
  thumbnail?: string;
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
  text?: TextClipData;
  colorGrade?: ColorGradeData;
  audioFilters?: AudioFilterData;
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

export interface Keyframe {
  id: string;
  clipId: string;
  property: string;
  time: number;
  value: number;
  easing: "linear" | "ease-in" | "ease-out" | "ease-in-out" | "bounce";
}

export interface Transition {
  id: string;
  type: TransitionType;
  duration: number;
  direction?: string;
  clipId: string;
  placement: "start" | "end" | "between";
}

export type TransitionType =
  | "fade"
  | "crossfade"
  | "dissolve"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "slide-down"
  | "zoom-in"
  | "zoom-out"
  | "wipe-left"
  | "wipe-right"
  | "glitch"
  | "blur"
  | "pixelate"
  | "none";

export interface ClipEffect {
  id: string;
  type: string;
  name: string;
  params: Record<string, number | string | boolean>;
  enabled: boolean;
}

export interface TextClipData {
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  textAlign: "left" | "center" | "right";
  lineHeight: number;
  letterSpacing: number;
  animation: "none" | "fade-in" | "slide-in" | "typewriter" | "bounce" | "zoom-in";
  shadow: boolean;
  stroke: boolean;
  strokeColor: string;
  strokeWidth: number;
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
  lut?: string;
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

export interface EditorState {
  projectId: string;
  projectName: string;
  tracks: Track[];
  duration: number;
  fps: number;
  resolution: { width: number; height: number };
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
  saveStatus: "saved" | "unsaved" | "saving";
}

export interface EditorSnapshot {
  tracks: Track[];
  currentTime: number;
  timestamp: number;
}

export type ToolType =
  | "select"
  | "cut"
  | "text"
  | "stickers"
  | "transitions"
  | "effects"
  | "audio"
  | "speed"
  | "keyframes";

export type ToolCategory = {
  id: ToolType;
  label: string;
  icon: string;
  shortcut: string;
};
