"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editor-store";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Volume2, VolumeX, Speaker, Radio, GitFork, Minimize2, Maximize, Music } from "lucide-react";

const waveformBars = 48;

function generateWaveform(): number[] {
  const bars: number[] = [];
  for (let i = 0; i < waveformBars; i++) {
    bars.push(Math.random() * 0.8 + 0.2);
  }
  return bars;
}

export function AudioPanel() {
  const selectedClipId = useEditorStore((s) => s.state.selectedClipId);
  const tracks = useEditorStore((s) => s.state.tracks);
  const volume = useEditorStore((s) => s.state.volume);
  const muted = useEditorStore((s) => s.state.muted);
  const { setAudioFilter, updateClip, setVolume, setMuted } = useEditorStore.getState();
  const waveform = useMemo(() => generateWaveform(), []);

  const selectedClip = selectedClipId
    ? tracks.flatMap((t) => t.clips).find((c) => c.id === selectedClipId)
    : null;

  const audioFilter = selectedClip?.audioFilters;

  if (!audioFilter) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl bg-white/5 py-6 text-center">
        <Music className="h-6 w-6 text-muted-foreground/20" />
        <p className="text-xs text-muted-foreground/40">Select an audio clip</p>
      </div>
    );
  }

  const updateFilter = (data: Record<string, any>) => {
    if (selectedClipId) {
      setAudioFilter(selectedClipId, data);
      updateClip(selectedClipId, { audioFilters: { ...audioFilter, ...data } });
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Volume2 className="h-3 w-3 text-muted-foreground/40" />
            <label className="text-[10px] text-muted-foreground/60">Volume</label>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMuted(!muted)}
              className={cn(
                "rounded-md p-1 transition-all",
                muted ? "bg-red-500/20 text-red-400" : "text-muted-foreground/50 hover:text-foreground/70",
              )}
            >
              {muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </button>
            <span className="font-mono text-[10px] text-primary">{Math.round(volume * 100)}%</span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
          className="w-full accent-primary"
        />
      </div>

      <Separator className="bg-border/20" />

      <div className="space-y-2">
        <label className="text-[10px] font-semibold text-muted-foreground/80">Equalizer</label>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Speaker className="h-3 w-3 text-muted-foreground/40" />
              <label className="text-[10px] text-muted-foreground/60">Bass</label>
            </div>
            <span className="font-mono text-[10px] text-primary">{audioFilter.bass > 0 ? "+" : ""}{audioFilter.bass.toFixed(1)} dB</span>
          </div>
          <input
            type="range"
            min={-20}
            max={20}
            step={0.5}
            value={audioFilter.bass}
            onChange={(e) => updateFilter({ bass: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Radio className="h-3 w-3 text-muted-foreground/40" />
              <label className="text-[10px] text-muted-foreground/60">Treble</label>
            </div>
            <span className="font-mono text-[10px] text-primary">{audioFilter.treble > 0 ? "+" : ""}{audioFilter.treble.toFixed(1)} dB</span>
          </div>
          <input
            type="range"
            min={-20}
            max={20}
            step={0.5}
            value={audioFilter.treble}
            onChange={(e) => updateFilter({ treble: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>
      </div>

      <Separator className="bg-border/20" />

      <div className="space-y-2">
        <label className="text-[10px] font-semibold text-muted-foreground/80">Effects</label>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Music className="h-3 w-3 text-muted-foreground/40" />
              <label className="text-[10px] text-muted-foreground/60">Reverb</label>
            </div>
            <span className="font-mono text-[10px] text-primary">{Math.round(audioFilter.reverb * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(audioFilter.reverb * 100)}
            onChange={(e) => updateFilter({ reverb: Number(e.target.value) / 100 })}
            className="w-full accent-primary"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <GitFork className="h-3 w-3 text-muted-foreground/40" />
              <label className="text-[10px] text-muted-foreground/60">Echo</label>
            </div>
            <span className="font-mono text-[10px] text-primary">{Math.round(audioFilter.echo * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(audioFilter.echo * 100)}
            onChange={(e) => updateFilter({ echo: Number(e.target.value) / 100 })}
            className="w-full accent-primary"
          />
        </div>
      </div>

      <Separator className="bg-border/20" />

      <div className="space-y-2">
        <label className="text-[10px] font-semibold text-muted-foreground/80">Advanced</label>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Minimize2 className="h-3 w-3 text-muted-foreground/40" />
              <label className="text-[10px] text-muted-foreground/60">Noise Gate</label>
            </div>
            <Switch checked={audioFilter.noiseGate} onCheckedChange={(v) => updateFilter({ noiseGate: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Maximize className="h-3 w-3 text-muted-foreground/40" />
              <label className="text-[10px] text-muted-foreground/60">Noise Reduction</label>
            </div>
            <Switch checked={audioFilter.noiseReduction} onCheckedChange={(v) => updateFilter({ noiseReduction: v })} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Volume2 className="h-3 w-3 text-muted-foreground/40" />
              <label className="text-[10px] text-muted-foreground/60">Normalization</label>
            </div>
            <Switch checked={audioFilter.normalization} onCheckedChange={(v) => updateFilter({ normalization: v })} />
          </div>
        </div>
      </div>

      <Separator className="bg-border/20" />

      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-muted-foreground/80">Waveform</label>
        <div className="flex h-16 items-end gap-[1.5px] rounded-xl bg-black/30 p-2">
          {waveform.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all duration-100"
              style={{
                height: `${h * 100}%`,
                background: `linear-gradient(to top, hsl(var(--primary)/0.3), hsl(var(--primary)/0.8))`,
                opacity: Math.random() > 0.3 ? 1 : 0.4,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
