"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editor-store";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sun,
  Contrast,
  Droplets,
  Camera,
  Highlighter,
  Shadow,
  Thermometer,
  Fan,
  CircleDot,
  Focus,
  Sparkles,
  Film,
  Tv,
  Palette,
  Mountain,
  Diamond,
} from "lucide-react";

interface Preset {
  id: string;
  name: string;
  icon: typeof Sun;
  gradient: string;
  values: Record<string, number>;
}

const presets: Preset[] = [
  {
    id: "cinematic",
    name: "Cinematic",
    icon: Film,
    gradient: "from-amber-600/20 to-orange-600/15",
    values: { contrast: 0.3, saturation: -0.1, exposure: -0.1, highlights: -0.2, shadows: 0.2, temperature: 0.1, vignette: 0.5, sharpen: 0.3 },
  },
  {
    id: "vibrant",
    name: "Vibrant",
    icon: Sparkles,
    gradient: "from-pink-500/20 to-purple-500/15",
    values: { saturation: 0.4, contrast: 0.2, exposure: 0.1, highlights: 0.1, sharpen: 0.2 },
  },
  {
    id: "vintage",
    name: "Vintage",
    icon: Tv,
    gradient: "from-yellow-600/20 to-amber-600/15",
    values: { saturation: -0.3, temperature: 0.2, contrast: -0.1, vignette: 0.4, exposure: -0.1 },
  },
  {
    id: "dark",
    name: "Dark",
    icon: Shadow,
    gradient: "from-slate-700/20 to-slate-900/15",
    values: { brightness: -0.3, exposure: -0.3, contrast: 0.2, highlights: -0.3, shadows: -0.2, vignette: 0.3 },
  },
  {
    id: "clean",
    name: "Clean",
    icon: Droplets,
    gradient: "from-cyan-500/20 to-blue-500/15",
    values: { saturation: -0.2, contrast: 0.1, temperature: -0.1, sharpen: 0.4, exposure: 0.05 },
  },
  {
    id: "futuristic",
    name: "Futuristic",
    icon: Mountain,
    gradient: "from-cyan-400/20 to-violet-500/15",
    values: { contrast: 0.4, saturation: 0.2, temperature: -0.3, tint: 0.2, sharpen: 0.5, highlights: 0.2, shadows: -0.2 },
  },
  {
    id: "gold",
    name: "Gold",
    icon: Diamond,
    gradient: "from-yellow-400/20 to-amber-500/15",
    values: { temperature: 0.3, saturation: 0.2, contrast: 0.1, exposure: 0.1, highlights: 0.2, vignette: 0.2 },
  },
  {
    id: "moody",
    name: "Moody",
    icon: Camera,
    gradient: "from-violet-700/20 to-slate-800/15",
    values: { contrast: 0.3, saturation: -0.3, exposure: -0.2, highlights: -0.3, shadows: 0.3, temperature: -0.1, vignette: 0.6 },
  },
];

function SliderControl({
  label,
  value,
  icon: Icon,
  min = -1,
  max = 1,
  step = 0.01,
  onChange,
}: {
  label: string;
  value: number;
  icon?: typeof Sun;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="h-3 w-3 text-muted-foreground/40" />}
          <label className="text-[10px] text-muted-foreground/60">{label}</label>
        </div>
        <span className="font-mono text-[10px] text-primary">{value > 0 ? "+" : ""}{value.toFixed(2)}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-primary"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)/0.3) 0%, hsl(var(--primary)/0.8) ${pct}%, hsl(var(--muted-foreground)/0.15) ${pct}%, hsl(var(--muted-foreground)/0.15) 100%)`,
          }}
        />
      </div>
    </div>
  );
}

const lutOptions = [
  { value: "", label: "None" },
  { value: "warm", label: "Warm Tone" },
  { value: "cool", label: "Cool Tone" },
  { value: "film", label: "Film Stock" },
  { value: "teal-orange", label: "Teal & Orange" },
  { value: "bw", label: "Black & White" },
  { value: "cinematic", label: "Cinematic" },
];

export function EffectsPanel() {
  const selectedClipId = useEditorStore((s) => s.state.selectedClipId);
  const tracks = useEditorStore((s) => s.state.tracks);
  const { setColorGrade, updateClip } = useEditorStore.getState();
  const [presetHover, setPresetHover] = useState<string | null>(null);

  const selectedClip = selectedClipId
    ? tracks.flatMap((t) => t.clips).find((c) => c.id === selectedClipId)
    : null;

  const colorGrade = selectedClip?.colorGrade;

  if (!colorGrade) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl bg-white/5 py-6 text-center">
        <Palette className="h-6 w-6 text-muted-foreground/20" />
        <p className="text-xs text-muted-foreground/40">Select a clip to grade</p>
      </div>
    );
  }

  const applyPreset = (preset: Preset) => {
    if (selectedClipId) {
      const updated = { ...colorGrade, ...preset.values };
      setColorGrade(selectedClipId, preset.values);
      updateClip(selectedClipId, { colorGrade: updated });
    }
  };

  const updateGrade = (data: Record<string, number>) => {
    if (selectedClipId) {
      setColorGrade(selectedClipId, data);
      updateClip(selectedClipId, { colorGrade: { ...colorGrade, ...data } });
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-[10px] font-semibold text-muted-foreground/80">Color Grading</label>
        <SliderControl label="Brightness" value={colorGrade.brightness} icon={Sun} onChange={(v) => updateGrade({ brightness: v })} />
        <SliderControl label="Contrast" value={colorGrade.contrast} icon={Contrast} onChange={(v) => updateGrade({ contrast: v })} />
        <SliderControl label="Saturation" value={colorGrade.saturation} icon={Droplets} onChange={(v) => updateGrade({ saturation: v })} />
        <SliderControl label="Exposure" value={colorGrade.exposure} icon={Camera} onChange={(v) => updateGrade({ exposure: v })} />
        <SliderControl label="Highlights" value={colorGrade.highlights} icon={Highlighter} onChange={(v) => updateGrade({ highlights: v })} />
        <SliderControl label="Shadows" value={colorGrade.shadows} icon={Shadow} onChange={(v) => updateGrade({ shadows: v })} />

        <div className="grid grid-cols-2 gap-2">
          <SliderControl label="Temperature" value={colorGrade.temperature} icon={Thermometer} onChange={(v) => updateGrade({ temperature: v })} />
          <SliderControl label="Tint" value={colorGrade.tint} icon={Fan} onChange={(v) => updateGrade({ tint: v })} />
        </div>

        <SliderControl label="Vignette" value={colorGrade.vignette} icon={CircleDot} min={0} max={1} onChange={(v) => updateGrade({ vignette: v })} />
        <SliderControl label="Sharpen" value={colorGrade.sharpen} icon={Focus} min={0} max={1} onChange={(v) => updateGrade({ sharpen: v })} />
      </div>

      <Separator className="bg-border/20" />

      <div className="space-y-2">
        <label className="text-[10px] font-semibold text-muted-foreground/80">Presets</label>
        <div className="grid grid-cols-4 gap-1.5">
          {presets.map((preset) => {
            const Icon = preset.icon;
            const isHovered = presetHover === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                onMouseEnter={() => setPresetHover(preset.id)}
                onMouseLeave={() => setPresetHover(null)}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-xl p-2 transition-all duration-200",
                  preset.gradient,
                  isHovered && "scale-105 shadow-lg",
                )}
              >
                {isHovered && (
                  <motion.div
                    layoutId="preset-glow"
                    className="absolute inset-0 rounded-xl ring-1 ring-primary/30"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="h-4 w-4 text-foreground/60" />
                <span className="text-[9px] font-medium text-foreground/70">{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-border/20" />

      <div className="space-y-2">
        <label className="text-[10px] font-semibold text-muted-foreground/80">LUT</label>
        <Select
          value={colorGrade.lut || ""}
          onValueChange={(v) => updateGrade({ lut: v || undefined as any })}
        >
          <SelectTrigger className="h-7 text-[11px]">
            <SelectValue placeholder="Select LUT" />
          </SelectTrigger>
          <SelectContent>
            {lutOptions.map((lut) => (
              <SelectItem key={lut.value} value={lut.value} className="text-xs">{lut.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {colorGrade.lut && (
          <SliderControl
            label="LUT Intensity"
            value={colorGrade.lutIntensity}
            icon={Palette}
            min={0}
            max={1}
            onChange={(v) => updateGrade({ lutIntensity: v })}
          />
        )}
      </div>
    </div>
  );
}
