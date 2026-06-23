"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ExportProgress } from "./export-progress";
import { ExportPresets } from "./export-presets";
import {
  FileVideo,
  Download,
  X,
  Loader2,
  Check,
  Sparkles,
  SlidersHorizontal,
  Smartphone,
  Monitor,
  Youtube,
  Music2,
  Twitter,
} from "lucide-react";

const RESOLUTIONS = [
  { value: "p720", label: "720p HD", w: 1280, h: 720 },
  { value: "p1080", label: "1080p Full HD", w: 1920, h: 1080 },
  { value: "k2", label: "2K QHD", w: 2560, h: 1440 },
  { value: "k4", label: "4K UHD", w: 3840, h: 2160 },
] as const;

const FORMATS = [
  { value: "mp4", label: "MP4", mime: "video/mp4", desc: "Best compatibility" },
  { value: "mov", label: "MOV", mime: "video/quicktime", desc: "ProRes quality" },
  { value: "webm", label: "WebM", mime: "video/webm", desc: "Small file size" },
] as const;

const FPS_OPTIONS = [24, 30, 60] as const;

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  inputPath: string;
}

export function ExportDialog({ open, onOpenChange, projectId, projectName, inputPath }: ExportDialogProps) {
  const [activeTab, setActiveTab] = useState("presets");
  const [format, setFormat] = useState("mp4");
  const [resolution, setResolution] = useState("p1080");
  const [fps, setFps] = useState(30);
  const [platform, setPlatform] = useState<string | undefined>();
  const [quality, setQuality] = useState("standard");
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    exportId: string;
    jobId: string;
  } | null>(null);

  const handleUsePreset = (preset: { format: string; resolution: string; fps: number; platform: string }) => {
    setFormat(preset.format);
    setResolution(preset.resolution);
    setFps(preset.fps);
    setPlatform(preset.platform);
    setActiveTab("custom");
  };

  const handleExport = async () => {
    setExporting(true);
    setExportResult(null);

    try {
      const res = await fetch("/api/exports/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          format,
          resolution,
          fps,
          quality,
          platform,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to start export");
        setExporting(false);
        return;
      }

      if (!data?.export?.id || !data?.job?.id) {
        toast.error("Invalid server response");
        setExporting(false);
        return;
      }

      setExportResult({ exportId: data.export.id, jobId: data.job.id });
      toast.success("Export started");
    } catch (err) {
      toast.error("Failed to start export. Check your connection.");
      setExporting(false);
    }
  };

  const handleComplete = () => {
    setExporting(false);
    setExportResult(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (exporting && exportResult) return;
    setExportResult(null);
    setExporting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5 text-primary" />
            Export Video
          </DialogTitle>
          <DialogDescription>
            Choose your export settings for {projectName}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {exportResult ? (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ExportProgress
                exportId={exportResult.exportId}
                projectName={projectName}
                onComplete={handleComplete}
              />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="presets" className="flex-1 gap-2">
                    <Sparkles className="h-4 w-4" />
                    Presets
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="flex-1 gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Custom
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="presets" className="space-y-4 pt-4">
                  <ExportPresets onSelect={handleUsePreset} />
                </TabsContent>

                <TabsContent value="custom" className="space-y-5 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground/70">Format</Label>
                      <Select value={format} onValueChange={setFormat}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FORMATS.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              <div className="flex items-center gap-2">
                                <FileVideo className="h-3.5 w-3.5 text-muted-foreground/60" />
                                <span>{f.label}</span>
                                <span className="text-[10px] text-muted-foreground/40">({f.desc})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground/70">Resolution</Label>
                      <Select value={resolution} onValueChange={setResolution}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RESOLUTIONS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              <div className="flex items-center gap-2">
                                <Monitor className="h-3.5 w-3.5 text-muted-foreground/60" />
                                <span>{r.label}</span>
                                <span className="text-[10px] text-muted-foreground/40">({r.w}x{r.h})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground/70">Frame Rate</Label>
                      <Select value={fps.toString()} onValueChange={(v) => setFps(parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FPS_OPTIONS.map((f) => (
                            <SelectItem key={f} value={f.toString()}>
                              {f} fps
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground/70">Quality</Label>
                      <Select value={quality} onValueChange={setQuality}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft (Fast)</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="premium">Premium (Slow)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground/70">Platform Optimization</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: undefined, icon: X, label: "None", desc: "No optimization" },
                        { id: "tiktok", icon: Music2, label: "TikTok", desc: "9:16, 60fps" },
                        { id: "instagram", icon: Smartphone, label: "Instagram", desc: "1:1, 30fps" },
                        { id: "instagram-reel", icon: Smartphone, label: "Reels", desc: "9:16, 30fps" },
                        { id: "youtube", icon: Youtube, label: "YouTube", desc: "16:9, 30fps" },
                        { id: "youtube_shorts", icon: Youtube, label: "Shorts", desc: "9:16, 60fps" },
                        { id: "twitter", icon: Twitter, label: "X/Twitter", desc: "16:9, 30fps" },
                      ].map((p) => (
                        <button
                          key={p.id || "none"}
                          onClick={() => setPlatform(p.id)}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200",
                            platform === p.id
                              ? "border-primary/50 bg-primary/10 text-primary shadow-[0_0_12px_-4px_hsl(var(--primary)/0.3)]"
                              : "border-border/30 bg-white/[0.02] text-muted-foreground/70 hover:border-border/60 hover:text-foreground/80",
                          )}
                        >
                          <p.icon className={cn("h-3.5 w-3.5", p.id === platform && "text-primary")} />
                          <div className="text-left">
                            <div>{p.label}</div>
                            <div className="text-[9px] opacity-60">{p.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/20 bg-primary/[0.02] p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                      <FileVideo className="h-3.5 w-3.5 text-primary/60" />
                      <span>Exporting as </span>
                      <Badge variant="outline" className="border-primary/20 bg-primary/5 px-1.5 text-[10px] font-mono text-primary/80">
                        {format.toUpperCase()}
                      </Badge>
                      <span>at</span>
                      <Badge variant="outline" className="border-primary/20 bg-primary/5 px-1.5 text-[10px] font-mono text-primary/80">
                        {RESOLUTIONS.find((r) => r.value === resolution)?.w}x{RESOLUTIONS.find((r) => r.value === resolution)?.h}
                      </Badge>
                      <span>at</span>
                      <Badge variant="outline" className="border-primary/20 bg-primary/5 px-1.5 text-[10px] font-mono text-primary/80">
                        {fps}fps
                      </Badge>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 border-t border-border/20 pt-4">
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Export
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
