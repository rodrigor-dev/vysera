"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editor-store";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  Circle,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * 30);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}:${f.toString().padStart(2, "0")}`;
}

function formatShort(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function PreviewPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fsState, setFsState] = useState(false);
  const [showVol, setShowVol] = useState(false);

  const state = useEditorStore((s) => s.state);
  const {
    togglePlayback,
    seek,
    setPlaybackSpeed,
    setVolume,
    setMuted,
    setIsFullscreen,
    previousFrame,
    nextFrame,
    stop,
  } = useEditorStore.getState();

  const videoSrcState = useEditorStore((s) => s.state.videoSrc);
  const isPlaying = useEditorStore((s) => s.state.isPlaying);
  const currentTime = useEditorStore((s) => s.state.currentTime);
  const duration = useEditorStore((s) => s.state.duration);
  const playbackSpeed = useEditorStore((s) => s.state.playbackSpeed);
  const volume = useEditorStore((s) => s.state.volume);
  const muted = useEditorStore((s) => s.state.muted);
  const fps = useEditorStore((s) => s.state.fps);
  const showFrameNumbers = useEditorStore((s) => s.state.showFrameNumbers);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setFsState(true);
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFsState(false);
      setIsFullscreen(false);
    }
  }, [setIsFullscreen]);

  useEffect(() => {
    const h = () => {
      const fs = !!document.fullscreenElement;
      setFsState(fs);
      setIsFullscreen(fs);
    };
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, [setIsFullscreen]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = muted ? 0 : volume;
  }, [volume, muted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrcState) return;
    if (Math.abs(video.currentTime - currentTime) > 0.5) {
      video.currentTime = currentTime;
    }
  }, [currentTime, videoSrcState]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    seek(video.currentTime);
  };

  const handleVideoEnded = () => {
    useEditorStore.getState().pause();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(ratio * duration);
    if (videoRef.current) {
      videoRef.current.currentTime = ratio * duration;
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " ") {
        e.preventDefault();
        togglePlayback();
      }
    },
    [togglePlayback],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const speeds = [0.25, 0.5, 1, 1.5, 2];

  return (
    <div
      ref={containerRef}
      className={cn(
        "glass-strong flex flex-col overflow-hidden rounded-2xl",
        fsState && "fixed inset-0 z-50 rounded-none",
      )}
    >
      <div className="flex items-center gap-3 border-b border-border/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="h-5 gap-1.5 border-0 bg-red-500/20 px-2 text-[10px] text-red-400">
            <Circle className="h-1.5 w-1.5 fill-red-400" />
            REC
          </Badge>
          <span className="font-mono text-[11px] text-muted-foreground/70">
            {formatShort(currentTime)} / {formatShort(duration)}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Badge variant="outline" className="h-5 border-0 bg-white/5 px-2 text-[10px] font-mono text-muted-foreground/60">
            {fps} FPS
          </Badge>
          {showFrameNumbers && (
            <Badge variant="outline" className="h-5 border-0 bg-white/5 px-2 text-[10px] font-mono text-muted-foreground/60">
              FR {Math.floor(currentTime * fps)}
            </Badge>
          )}
        </div>
      </div>

      <div className="relative flex aspect-video items-center justify-center bg-black/90">
        {videoSrcState ? (
          <>
            <video
              ref={videoRef}
              src={videoSrcState}
              className="absolute inset-0 h-full w-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              playsInline
              preload="auto"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full object-contain pointer-events-none"
              width={1920}
              height={1080}
            />
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground/40">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-muted-foreground/20 bg-white/5">
              <Play className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium">No video loaded</span>
          </div>
        )}
        {!isPlaying && videoSrcState && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <Button
              size="icon"
              onClick={(e) => { e.stopPropagation(); togglePlayback(); }}
              className="h-14 w-14 rounded-full bg-white/90 text-black shadow-2xl backdrop-blur-sm hover:bg-white hover:scale-105"
            >
              <Play className="ml-0.5 h-6 w-6" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-border/30 px-4 py-3">
        <div
          className="group relative h-1.5 cursor-pointer rounded-full bg-white/10 transition-all hover:h-2"
          onClick={handleSeek}
        >
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-primary to-purple-500"
            style={{ width: `${progress}%` }}
            layout
          />
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100"
            style={{ left: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => previousFrame()} className="text-muted-foreground/70 hover:text-foreground">
            <SkipBack className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => togglePlayback()}
            className="h-8 w-8 rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-white/10"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => nextFrame()} className="text-muted-foreground/70 hover:text-foreground">
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => stop()} className="text-muted-foreground/70 hover:text-foreground">
            <Square className="h-3.5 w-3.5" />
          </Button>

          <div className="mx-2 h-4 w-px bg-border/30" />

          <span className="min-w-[60px] font-mono text-[11px] text-muted-foreground/70">
            {formatShort(currentTime)} / {formatShort(duration)}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon-sm"
                onMouseEnter={() => setShowVol(true)}
                onMouseLeave={() => setShowVol(false)}
                className="text-muted-foreground/70 hover:text-foreground"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </Button>
              {showVol && (
                <div
                  className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2"
                  onMouseEnter={() => setShowVol(true)}
                  onMouseLeave={() => setShowVol(false)}
                >
                  <div className="flex h-28 items-center rounded-xl border border-border/30 bg-card/95 p-2 shadow-xl backdrop-blur-xl">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(volume * 100)}
                      onChange={(e) => setVolume(Number(e.target.value) / 100)}
                      className="h-20 w-1.5 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                      style={{
                        writingMode: "vertical-lr",
                        direction: "rtl",
                        background: `linear-gradient(to top, hsl(var(--primary)) ${volume * 50}%, hsl(var(--muted-foreground)/0.2) ${volume * 50}%)`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-0.5 rounded-lg border border-border/20 bg-white/5 px-1.5 py-0.5">
              {speeds.map((s) => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-all",
                    playbackSpeed === s
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground/50 hover:text-foreground/70",
                  )}
                >
                  {s}x
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleFullscreen}
              className="text-muted-foreground/70 hover:text-foreground"
            >
              {fsState ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
