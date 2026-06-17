"use client";

import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editor-store";
import type { TextClipData } from "@/components/editor/types";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";

const fonts = [
  "Inter", "Geist", "Arial", "Helvetica", "Georgia", "Times New Roman",
  "Courier New", "Verdana", "Trebuchet MS", "Impact", "Comic Sans MS",
];

const fontWeights = [
  { label: "Thin", value: 100 },
  { label: "Extra Light", value: 200 },
  { label: "Light", value: 300 },
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Semi Bold", value: 600 },
  { label: "Bold", value: 700 },
  { label: "Extra Bold", value: 800 },
  { label: "Black", value: 900 },
];

const presetColors = [
  "#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff",
  "#ffff00", "#ff00ff", "#00ffff", "#ff8800", "#ff0088",
  "#88ff00", "#0088ff", "#8800ff", "#ff4444", "#44ff44",
  "#4444ff", "#ffaa00", "#aa00ff",
];

const animations = [
  { value: "none", label: "None" },
  { value: "fade-in", label: "Fade In" },
  { value: "slide-in", label: "Slide In" },
  { value: "typewriter", label: "Typewriter" },
  { value: "bounce", label: "Bounce" },
  { value: "zoom-in", label: "Zoom In" },
];

export function TextPanel() {
  const selectedClipId = useEditorStore((s) => s.state.selectedClipId);
  const tracks = useEditorStore((s) => s.state.tracks);
  const { updateClip, setTextData } = useEditorStore.getState();

  const selectedClip = selectedClipId
    ? tracks.flatMap((t) => t.clips).find((c) => c.id === selectedClipId)
    : null;

  const textData = selectedClip?.text;

  if (!textData) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl bg-white/5 py-6 text-center">
        <Type className="h-6 w-6 text-muted-foreground/20" />
        <p className="text-xs text-muted-foreground/40">Select a text clip to edit</p>
      </div>
    );
  }

  const updateText = (data: Partial<TextClipData>) => {
    if (selectedClipId) setTextData(selectedClipId, data);
    if (selectedClipId) updateClip(selectedClipId, { text: { ...textData, ...data } });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground/60">Text Content</label>
        <textarea
          value={textData.content}
          onChange={(e) => updateText({ content: e.target.value })}
          placeholder="Enter your text..."
          rows={3}
          className="premium-input w-full resize-none px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40"
        />
      </div>

      <Separator className="bg-border/20" />

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground/60">Font</label>
          <Select value={textData.fontFamily} onValueChange={(v) => updateText({ fontFamily: v })}>
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fonts.map((f) => (
                <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground/60">Weight</label>
          <Select
            value={String(textData.fontWeight)}
            onValueChange={(v) => updateText({ fontWeight: Number(v) })}
          >
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontWeights.map((fw) => (
                <SelectItem key={fw.value} value={String(fw.value)} className="text-xs">
                  {fw.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-muted-foreground/60">Font Size</label>
          <span className="font-mono text-[10px] text-primary">{textData.fontSize}px</span>
        </div>
        <input
          type="range"
          min={12}
          max={200}
          value={textData.fontSize}
          onChange={(e) => updateText({ fontSize: Number(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>

      <Separator className="bg-border/20" />

      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground/60">Text Color</label>
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-lg border border-border/50"
            style={{ backgroundColor: textData.color }}
          />
          <Input
            value={textData.color}
            onChange={(e) => updateText({ color: e.target.value })}
            className="h-7 flex-1 text-[11px] font-mono"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {presetColors.map((c) => (
            <button
              key={c}
              onClick={() => updateText({ color: c })}
              className={cn(
                "h-5 w-5 rounded-md border transition-all",
                textData.color === c
                  ? "scale-110 border-primary shadow-[0_0_6px_hsl(var(--primary)/0.3)]"
                  : "border-border/30 hover:scale-110",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] text-muted-foreground/60">Background</label>
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-lg border border-border/50"
            style={{ backgroundColor: textData.backgroundColor }}
          />
          <Input
            value={textData.backgroundColor}
            onChange={(e) => updateText({ backgroundColor: e.target.value })}
            className="h-7 flex-1 text-[11px] font-mono"
            placeholder="transparent"
          />
        </div>
        {textData.backgroundColor !== "transparent" && textData.backgroundColor !== "" && (
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground/60">Opacity</label>
            <input
              type="range"
              min={0}
              max={100}
              value={textData.backgroundOpacity * 100}
              onChange={(e) => updateText({ backgroundOpacity: Number(e.target.value) / 100 })}
              className="flex-1 accent-primary"
            />
            <span className="min-w-[24px] text-right font-mono text-[10px] text-muted-foreground/60">
              {Math.round(textData.backgroundOpacity * 100)}%
            </span>
          </div>
        )}
      </div>

      <Separator className="bg-border/20" />

      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground/60">Alignment</label>
        <div className="flex gap-1">
          {[
            { value: "left" as const, icon: AlignLeft },
            { value: "center" as const, icon: AlignCenter },
            { value: "right" as const, icon: AlignRight },
          ].map((al) => {
            const Icon = al.icon;
            return (
              <button
                key={al.value}
                onClick={() => updateText({ textAlign: al.value })}
                className={cn(
                  "flex h-7 flex-1 items-center justify-center rounded-lg transition-all",
                  textData.textAlign === al.value
                    ? "bg-primary/20 text-primary"
                    : "bg-white/5 text-muted-foreground/50 hover:text-foreground/70",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-muted-foreground/60">Line Height</label>
          <span className="font-mono text-[10px] text-primary">{textData.lineHeight.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.1}
          value={textData.lineHeight}
          onChange={(e) => updateText({ lineHeight: Number(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-muted-foreground/60">Letter Spacing</label>
          <span className="font-mono text-[10px] text-primary">{textData.letterSpacing}px</span>
        </div>
        <input
          type="range"
          min={-5}
          max={20}
          step={0.5}
          value={textData.letterSpacing}
          onChange={(e) => updateText({ letterSpacing: Number(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>

      <Separator className="bg-border/20" />

      <div className="space-y-1">
        <label className="text-[10px] text-muted-foreground/60">Animation</label>
        <Select
          value={textData.animation}
          onValueChange={(v) => updateText({ animation: v as TextClipData["animation"] })}
        >
          <SelectTrigger className="h-7 text-[11px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {animations.map((a) => (
              <SelectItem key={a.value} value={a.value} className="text-xs">{a.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-muted-foreground/60">Shadow</label>
          <Switch checked={textData.shadow} onCheckedChange={(v) => updateText({ shadow: v })} />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-muted-foreground/60">Stroke</label>
          <Switch checked={textData.stroke} onCheckedChange={(v) => updateText({ stroke: v })} />
        </div>
      </div>

      {textData.stroke && (
        <div className="space-y-1.5 rounded-xl bg-white/5 p-2">
          <label className="text-[10px] text-muted-foreground/60">Stroke Color</label>
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded-md border border-border/50"
              style={{ backgroundColor: textData.strokeColor }}
            />
            <Input
              value={textData.strokeColor}
              onChange={(e) => updateText({ strokeColor: e.target.value })}
              className="h-6 flex-1 text-[10px] font-mono"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-muted-foreground/60">Width</label>
            <span className="font-mono text-[10px] text-primary">{textData.strokeWidth}px</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={textData.strokeWidth}
            onChange={(e) => updateText({ strokeWidth: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>
      )}
    </div>
  );
}

function Type(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}
