"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editor-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Move,
  Maximize,
  RotateCcw,
  Eye,
  Volume2,
  KeyRound,
} from "lucide-react";

const keyframeProperties = [
  { value: "positionX", label: "Position X", icon: Move },
  { value: "positionY", label: "Position Y", icon: Move },
  { value: "scale", label: "Scale", icon: Maximize },
  { value: "rotation", label: "Rotation", icon: RotateCcw },
  { value: "opacity", label: "Opacity", icon: Eye },
  { value: "volume", label: "Volume", icon: Volume2 },
];

const easingOptions = [
  { value: "linear", label: "Linear" },
  { value: "ease-in", label: "Ease In" },
  { value: "ease-out", label: "Ease Out" },
  { value: "ease-in-out", label: "Ease In Out" },
  { value: "bounce", label: "Bounce" },
];

interface DemoKeyframe {
  id: string;
  property: string;
  time: number;
  value: number;
  easing: string;
}

function generateDemoKeyframes(): DemoKeyframe[] {
  return [
    { id: "kf1", property: "positionX", time: 0, value: 0, easing: "linear" },
    { id: "kf2", property: "positionX", time: 5, value: 500, easing: "ease-in-out" },
    { id: "kf3", property: "positionX", time: 10, value: 200, easing: "bounce" },
    { id: "kf4", property: "opacity", time: 0, value: 1, easing: "linear" },
    { id: "kf5", property: "opacity", time: 8, value: 0, easing: "ease-out" },
  ];
}

export function KeyframesPanel() {
  const currentTime = useEditorStore((s) => s.state.currentTime);
  const duration = useEditorStore((s) => s.state.duration);

  const [selectedProperty, setSelectedProperty] = useState("positionX");
  const [keyframes] = useState<DemoKeyframe[]>(generateDemoKeyframes);
  const [selectedKfId, setSelectedKfId] = useState<string | null>(null);
  const [easing, setEasing] = useState("ease-in-out");

  const filteredKeyframes = useMemo(
    () => keyframes.filter((kf) => kf.property === selectedProperty),
    [keyframes, selectedProperty],
  );

  const selectedKf = selectedKfId
    ? filteredKeyframes.find((kf) => kf.id === selectedKfId)
    : null;

  const maxTime = duration;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground/60">Property</label>
        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
          <SelectTrigger className="h-7 text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {keyframeProperties.map((prop) => {
              const Icon = prop.icon;
              return (
                <SelectItem key={prop.value} value={prop.value} className="text-xs">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3 w-3" />
                    {prop.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <Separator className="bg-border/20" />

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1 gap-1.5 bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25"
        >
          <Plus className="h-3 w-3" />
          <span className="text-[10px]">Add</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5 border-border/50"
          disabled={!selectedKfId}
        >
          <Trash2 className="h-3 w-3 text-destructive" />
          <span className="text-[10px]">Remove</span>
        </Button>
      </div>

      <Separator className="bg-border/20" />

      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground/60">Mini Timeline</label>
        <div className="relative h-8 rounded-lg bg-black/30">
          <div
            className="absolute left-0 top-0 h-full w-full rounded-lg"
            style={{
              background: `repeating-linear-gradient(90deg, transparent, transparent 1px, hsl(var(--border)/0.05) 1px, hsl(var(--border)/0.05) 2px)`,
            }}
          />
          {filteredKeyframes.map((kf) => {
            const pct = maxTime > 0 ? (kf.time / maxTime) * 100 : 0;
            const isSelected = selectedKfId === kf.id;
            return (
              <button
                key={kf.id}
                onClick={() => setSelectedKfId(kf.id)}
                className={cn(
                  "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 transition-all",
                  isSelected
                    ? "border-primary bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
                    : "border-muted-foreground/40 bg-card hover:border-muted-foreground/60",
                )}
                style={{ left: `${pct}%` }}
              />
            );
          })}
          <div
            className="absolute top-0 h-full w-0.5 bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.4)]"
            style={{ left: `${(currentTime / maxTime) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[9px] text-muted-foreground/40">
          <span>0s</span>
          <span>{maxTime.toFixed(0)}s</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground/50">
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="flex-1 text-center text-[10px] text-muted-foreground/60">
          {selectedKf
            ? `KF at ${selectedKf.time.toFixed(1)}s`
            : "No keyframe selected"}
        </span>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground/50">
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Separator className="bg-border/20" />

      {selectedKf && (
        <div className="space-y-2 rounded-xl bg-white/5 p-2">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground/60">Time</label>
            <Input
              type="number"
              value={selectedKf.time.toFixed(1)}
              className="h-7 text-[11px] font-mono"
              min={0}
              max={maxTime}
              step={0.1}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground/60">Value</label>
            <Input
              type="number"
              value={selectedKf.value}
              className="h-7 text-[11px] font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground/60">Easing</label>
            <Select value={easing} onValueChange={setEasing}>
              <SelectTrigger className="h-7 text-[11px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {easingOptions.map((eo) => (
                  <SelectItem key={eo.value} value={eo.value} className="text-xs">
                    {eo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Separator className="bg-border/20" />

      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground/60">Keyframes ({filteredKeyframes.length})</label>
        <div className="max-h-[120px] space-y-0.5 overflow-y-auto">
          {filteredKeyframes.map((kf, index) => (
            <button
              key={kf.id}
              onClick={() => setSelectedKfId(kf.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[10px] transition-all",
                selectedKfId === kf.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground/60 hover:bg-white/5 hover:text-foreground/70",
              )}
            >
              <KeyRound className="h-3 w-3 shrink-0" />
              <span className="font-mono">#{index + 1}</span>
              <span className="font-mono text-muted-foreground/40">{kf.time.toFixed(1)}s</span>
              <span className="ml-auto font-mono text-muted-foreground/40">{kf.value}</span>
              <span className="text-[8px] text-muted-foreground/30">{kf.easing}</span>
            </button>
          ))}
          {filteredKeyframes.length === 0 && (
            <p className="py-3 text-center text-[10px] text-muted-foreground/40">
              No keyframes for this property
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
