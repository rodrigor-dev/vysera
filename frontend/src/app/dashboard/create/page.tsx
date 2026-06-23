"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  MonitorSmartphone,
  Layout,
  Crop,
  Upload,
  FileVideo,
  FileImage,
  FileAudio,
  CheckCircle2,
  Check,
  Sparkles,
  Wand2,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Captions,
  ZoomIn,
  Palette,
  MicOff,
  Volume2,
  Music,
  Film,
  Loader2,
  Star,
  Trash2,
  TrendingUp,
  Clock,
  Play,
  Download,
  Clapperboard,
  Mic,
  Gamepad2,
  Globe,
  Moon,
  Gem,
  Drama,
  Podcast,
  Scissors,
} from "lucide-react";

type Step = 1 | 2 | 3 | 4 | 5;
type Format = "vertical" | "horizontal" | "square" | null;
type UploadItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "uploading" | "complete" | "error";
  file: File;
};

const formats = [
  { id: "vertical" as const, label: "Vertical", aspect: "9:16", desc: "TikTok / Reels / Shorts", icon: MonitorSmartphone },
  { id: "horizontal" as const, label: "Horizontal", aspect: "16:9", desc: "YouTube / Vimeo", icon: Layout },
  { id: "square" as const, label: "Square", aspect: "1:1", desc: "Instagram / Facebook", icon: Crop },
];

const allTemplates = [
  { id: "1", name: "Cinema", desc: "Epic cinematic intro with dramatic transitions", category: "Trending", icon: Clapperboard, ai: true },
  { id: "2", name: "Vlog", desc: "Casual storytelling for daily content", category: "Popular", icon: Film, ai: false },
  { id: "3", name: "Viral", desc: "High-energy clips for maximum engagement", category: "Trending", icon: Sparkles, ai: true },
  { id: "4", name: "Shorts", desc: "Vertical short-form content optimized", category: "Popular", icon: Scissors, ai: true },
  { id: "5", name: "Reels", desc: "Instagram Reels with trending effects", category: "Trending", icon: Star, ai: true },
  { id: "6", name: "Motivacional", desc: "Inspirational quotes with dynamic visuals", category: "Popular", icon: Drama, ai: false },
  { id: "7", name: "Podcast", desc: "Audio-first visual with waveform sync", category: "Trending", icon: Podcast, ai: true },
  { id: "8", name: "Clipe", desc: "Music video style with beat synchronization", category: "Popular", icon: Music, ai: true },
  { id: "9", name: "Game", desc: "Gaming montage with high-energy effects", category: "Trending", icon: Gamepad2, ai: true },
  { id: "10", name: "Futurista", desc: "Cyberpunk neon aesthetic with glitch effects", category: "Popular", icon: Globe, ai: false },
  { id: "11", name: "Dark", desc: "Moody dark theme with subtle transitions", category: "Popular", icon: Moon, ai: false },
  { id: "12", name: "Luxo", desc: "Premium luxury brand showcase", category: "Trending", icon: Gem, ai: true },
  { id: "marketing", name: "Marketing", desc: "Professional branding with CTA and voiceover", category: "Trending", icon: TrendingUp, ai: true },
];

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const stepLabels = ["Format", "Uploads", "Template", "Settings", "Review"];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

export default function CreateVideoPage() {
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(0);
  const [format, setFormat] = useState<Format>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateFilter, setTemplateFilter] = useState("All");
  const [captions, setCaptions] = useState(true);
  const [captionStyle, setCaptionStyle] = useState("tiktok");
  const [autoZoom, setAutoZoom] = useState(true);
  const [colorGrading, setColorGrading] = useState(true);
  const [removeSilence, setRemoveSilence] = useState(false);
  const [improveAudio, setImproveAudio] = useState(true);
  const [removeNoise, setRemoveNoise] = useState(false);
  const [transition, setTransition] = useState("fade");
  const [bgMusic, setBgMusic] = useState("none");
  const [quality, setQuality] = useState("standard");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Starting...");
  const [isComplete, setIsComplete] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [narration, setNarration] = useState(true);
  const [narrationVoice, setNarrationVoice] = useState("pt-BR-Female");
  const router = useRouter();
  const progressRef = useRef(0);

  const goNext = () => {
    if (step === 1 && !format) { toast.error("Please select a format"); return; }
    if (step === 3 && !selectedTemplate) { toast.error("Please select a template"); return; }
    if (step < 5) { setDirection(1); setStep((step + 1) as Step); }
  };

  const goBack = () => {
    if (step > 1) { setDirection(-1); setStep((step - 1) as Step); }
  };

  const simulateUpload = useCallback((files: FileList | File[]) => {
    const items: UploadItem[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: "uploading" as const,
      file,
    }));
    setUploads((prev) => [...prev, ...items]);
    items.forEach((item) => {
      const interval = setInterval(() => {
        setUploads((prev) =>
          prev.map((u) => {
            if (u.id !== item.id) return u;
            const next = Math.min(u.progress + Math.floor(Math.random() * 20) + 5, 100);
            if (next >= 100) {
              clearInterval(interval);
              return { ...u, progress: 100, status: "complete" as const };
            }
            return { ...u, progress: next };
          }),
        );
      }, 400);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) simulateUpload(e.dataTransfer.files);
  }, [simulateUpload]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) { simulateUpload(e.target.files); e.target.value = ""; }
  };

  const removeUpload = (id: string) => setUploads((prev) => prev.filter((u) => u.id !== id));

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setStatusText("Creating project...");

    try {
      let pid: string;
      let projectResult: { project: { id: string } };

      // Step 1: Create project
      const projectRes = await fetch("/api/user/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Video - ${new Date().toLocaleDateString()}`,
          format,
        }),
        credentials: "include",
      });
      if (!projectRes.ok) throw new Error("Failed to create project");
      projectResult = await projectRes.json();
      if (!projectResult?.project?.id) throw new Error("Invalid project response");
      pid = projectResult.project.id;
      setProjectId(pid);

      setStatusText("Uploading media...");

      // Step 2: Upload files associated with the project
      const uploadIds: string[] = [];
      for (const item of uploads) {
        const formData = new FormData();
        formData.append("file", item.file);
        const res = await fetch(`/api/upload/video?projectId=${pid}`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || "Upload failed");
        }
        const body = await res.json();
        if (body.upload?.id) uploadIds.push(body.upload.id);
      }

      setStatusText("Starting video processing...");

      // Step 3: Start video processing
      const options: Record<string, unknown> = {
        captions,
        captionStyle,
        autoZoom,
        colorGrading,
        removeSilence,
        improveAudio,
        removeNoise,
        transition,
        bgMusic,
        quality,
      };
      if (selectedTemplate) options.template = selectedTemplate;
      if (selectedTemplate === "marketing") {
        options.narration = { enabled: narration, voice: narrationVoice };
      }

      const createRes = await fetch("/api/video/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: pid,
          uploadIds,
          format: format || "horizontal",
          template: selectedTemplate,
          options,
        }),
        credentials: "include",
      });
      if (!createRes.ok) throw new Error("Failed to start processing");
      const createData = await createRes.json();
      const jid = createData.job?.id;
      setJobId(jid);
      progressRef.current = 0;

      // Step 4: Poll for progress
      const statusMap: Record<number, string> = {
        0: "Analyzing media...",
        15: "Applying template...",
        30: "Generating captions...",
        50: "Color grading and effects...",
        70: "Mixing audio...",
        85: "Rendering final video...",
        95: "Almost done...",
      };

      const poll = async () => {
        if (!jid) {
          setProgress(100);
          setStatusText("Complete!");
          setIsGenerating(false);
          setIsComplete(true);
          return;
        }
        try {
          const pollRes = await fetch(`/api/video/job/${jid}`, { credentials: "include" });
          if (pollRes.ok) {
            const data = await pollRes.json();
            const pct = data.progress?.progress ?? data.job?.progress ?? 0;
            progressRef.current = Math.max(progressRef.current, pct);
            setProgress(progressRef.current);
            const keys = Object.keys(statusMap).map(Number).sort((a, b) => b - a);
            const match = keys.find((k) => progressRef.current >= k);
            if (match !== undefined) {
              const text = statusMap[match];
              if (text) setStatusText(text);
            }

            if (data.job?.status === "completed") {
              setProgress(100);
              setStatusText("Complete!");
              setIsGenerating(false);
              setIsComplete(true);
              toast.success("Video generated successfully!");
              return;
            }
            if (data.job?.status === "failed") {
              throw new Error(data.job?.error || "Processing failed");
            }
          }
        } catch {
          // continue polling
        }
        setTimeout(poll, 2000);
      };
      poll();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      toast.error(message);
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const templateCategories = ["All", "Trending", "Popular"];
  const filteredTemplates = templateFilter === "All"
    ? allTemplates
    : allTemplates.filter((t) => t.category === templateFilter);

  const formatIcons = { vertical: MonitorSmartphone, horizontal: Layout, square: Crop };

  if (isComplete) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="premium-card max-w-lg w-full p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10"
          >
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </motion.div>
          <h2 className="gradient-text text-2xl font-bold mb-2">Video Created!</h2>
          <p className="text-muted-foreground/60 mb-8">Your AI video is ready in the library.</p>
          <div className="relative aspect-video w-full max-w-sm mx-auto mb-8 overflow-hidden rounded-xl bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-violet-600/20 flex items-center justify-center group">
            <Button size="icon" className="h-16 w-16 rounded-full bg-white/90 text-black shadow-xl backdrop-blur-sm hover:bg-white hover:scale-110 transition-all">
              <Play className="h-8 w-8" />
            </Button>
          </div>
          <div className="flex gap-3">
            <Button className="flex-1 gap-2 bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25" asChild>
              <a href="/dashboard/library"><Film className="h-4 w-4" /> View in Library</a>
            </Button>
            <Button variant="outline" className="flex-1 gap-2 border-border/50">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-1">
        <h1 className="gradient-text text-3xl font-bold tracking-tight">Create Video</h1>
        <p className="text-muted-foreground/60">Follow the steps to generate your AI-powered video.</p>
      </div>

      <div className="flex items-center justify-between">
        {stepLabels.map((label, i) => {
          const stepNum = (i + 1) as Step;
          const isActive = step === stepNum;
          const isCompleted = stepNum < step;
          return (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
                  isActive && "bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25",
                  isCompleted && "bg-emerald-500/20 text-emerald-400",
                  !isActive && !isCompleted && "bg-muted/50 text-muted-foreground/50",
                )}>
                  {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
                </div>
                <span className={cn(
                  "text-[11px] font-medium hidden sm:block",
                  isActive ? "text-primary" : "text-muted-foreground/50",
                )}>{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={cn(
                  "flex-1 h-px mx-2",
                  stepNum < step ? "bg-emerald-500/50" : "bg-border/50",
                )} />
              )}
            </div>
          );
        })}
      </div>

      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="gradient-text text-2xl font-bold">Choose Your Format</h2>
                  <p className="text-sm text-muted-foreground/60">Select the aspect ratio for your video</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {formats.map((f) => {
                    const selected = format === f.id;
                    return (
                      <motion.button
                        key={f.id}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFormat(f.id)}
                        className={cn(
                          "premium-card relative flex flex-col items-center gap-4 p-6 text-center transition-all duration-300",
                          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_30px_hsl(var(--primary)/0.15)] glow",
                        )}
                      >
                        {selected && (
                          <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <div className={cn(
                          "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
                          selected ? "bg-gradient-to-br from-primary to-purple-500 text-white shadow-lg shadow-primary/25" : "bg-primary/10 text-primary",
                        )}>
                          <f.icon className="h-8 w-8" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{f.label}</p>
                          <p className="text-2xl font-bold text-primary">{f.aspect}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">{f.desc}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="gradient-text text-2xl font-bold">Upload Your Media</h2>
                  <p className="text-sm text-muted-foreground/60">Drag & drop or browse — supports video, image, and audio</p>
                </div>

                <motion.div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={cn(
                    "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all duration-300",
                    isDragging
                      ? "border-primary bg-primary/5 scale-[1.02] shadow-[0_0_40px_hsl(var(--primary)/0.15)]"
                      : "border-border/50 hover:border-primary/40 glass-strong",
                  )}
                >
                  <input
                    type="file"
                    multiple
                    accept="video/*,image/*,audio/*"
                    onChange={handleFileSelect}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  <motion.div animate={isDragging ? { y: -8, scale: 1.05 } : { y: 0, scale: 1 }} className="flex flex-col items-center gap-3">
                    <div className={cn(
                      "flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300",
                      isDragging ? "bg-gradient-to-br from-primary to-purple-500 shadow-lg shadow-primary/25" : "bg-gradient-to-br from-primary/20 to-purple-500/20",
                    )}>
                      <Upload className={cn("h-10 w-10", isDragging ? "text-white" : "text-primary")} />
                    </div>
                    <p className="text-lg font-semibold">{isDragging ? "Drop files here" : "Drag & drop files here"}</p>
                    <p className="text-sm text-muted-foreground/60">or click to browse &mdash; max 500MB per file</p>
                  </motion.div>
                </motion.div>

                {uploads.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Uploaded Files ({uploads.length})</h3>
                      <label className="cursor-pointer">
                        <span className="flex items-center gap-1 text-xs text-primary hover:underline"><Plus className="h-3 w-3" /> Add more files</span>
                        <input type="file" multiple accept="video/*,image/*,audio/*" onChange={handleFileSelect} className="hidden" />
                      </label>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <AnimatePresence mode="popLayout">
                        {uploads.map((item) => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="premium-card flex items-center gap-3 p-3"
                          >
                            <div className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                              item.status === "complete" && "bg-emerald-500/10",
                              item.status === "uploading" && "bg-primary/10",
                            )}>
                              {item.type.startsWith("video") && <FileVideo className={cn("h-5 w-5", item.status === "complete" ? "text-emerald-400" : "text-primary")} />}
                              {item.type.startsWith("image") && <FileImage className={cn("h-5 w-5", item.status === "complete" ? "text-emerald-400" : "text-primary")} />}
                              {item.type.startsWith("audio") && <FileAudio className={cn("h-5 w-5", item.status === "complete" ? "text-emerald-400" : "text-primary")} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground/60">{formatSize(item.size)}</p>
                              {item.status === "uploading" && (
                                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-border/50">
                                  <motion.div className="h-full rounded-full bg-gradient-to-r from-primary via-purple-500 to-accent" style={{ width: `${item.progress}%` }} transition={{ duration: 0.3, ease: "easeOut" }} />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {item.status === "uploading" && <span className="text-xs text-muted-foreground/60 font-mono min-w-[2rem] text-right">{item.progress}%</span>}
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10" onClick={() => removeUpload(item.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="gradient-text text-2xl font-bold">Choose a Template</h2>
                  <p className="text-sm text-muted-foreground/60">Start with a pre-designed layout or let AI build one</p>
                </div>

                <div className="flex flex-wrap justify-center gap-2">
                  {templateCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setTemplateFilter(cat)}
                      className={cn(
                        "rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                        templateFilter === cat
                          ? "bg-primary/15 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.1)]"
                          : "text-muted-foreground/70 hover:bg-accent/30 hover:text-foreground bg-muted/30",
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTemplates.map((t, i) => {
                    const selected = selectedTemplate === t.id;
                    const gradients = [
                      "from-violet-600/30 via-fuchsia-600/20 to-violet-600/10",
                      "from-blue-600/30 via-cyan-600/20 to-blue-600/10",
                      "from-emerald-600/30 via-teal-600/20 to-emerald-600/10",
                      "from-orange-600/30 via-rose-600/20 to-orange-600/10",
                      "from-pink-600/30 via-purple-600/20 to-pink-600/10",
                      "from-amber-600/30 via-yellow-600/20 to-amber-600/10",
                    ];
                    return (
                      <motion.button
                        key={t.id}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={cn(
                          "premium-card relative overflow-hidden text-left transition-all duration-300",
                          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_30px_hsl(var(--primary)/0.15)] glow",
                        )}
                      >
                        {selected && (
                          <div className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <div className={cn("relative flex aspect-video items-center justify-center bg-gradient-to-br", gradients[i % gradients.length])}>
                          <t.icon className="h-10 w-10 text-white/30" />
                          {t.ai && (
                            <Badge className="absolute top-2 left-2 bg-gradient-to-r from-primary to-purple-500 text-white border-0 text-[10px] gap-1">
                              <Sparkles className="h-3 w-3" /> AI Auto
                            </Badge>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-semibold text-sm">{t.name}</p>
                          <p className="text-xs text-muted-foreground/60 mt-0.5">{t.desc}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="gradient-text text-2xl font-bold">AI Settings</h2>
                  <p className="text-sm text-muted-foreground/60">Customize how AI enhances your video</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="premium-card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Captions className="h-4 w-4 text-primary" /></div>
                        <div><p className="text-sm font-medium">Auto Captions</p><p className="text-xs text-muted-foreground/60">Generate subtitles automatically</p></div>
                      </div>
                      <Switch checked={captions} onCheckedChange={setCaptions} />
                    </div>
                    <div className={cn("pl-12", !captions && "hidden")}>
                      <Select value={captionStyle} onValueChange={setCaptionStyle}>
                        <SelectTrigger className="premium-input h-9 text-xs border-border/50"><SelectValue /></SelectTrigger>
                        <SelectContent className="glass-strong border-border/50">
                          <SelectItem value="tiktok">TikTok Style</SelectItem>
                          <SelectItem value="shorts">Shorts Style</SelectItem>
                          <SelectItem value="karaoke">Karaoke Style</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="premium-card p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><ZoomIn className="h-4 w-4 text-primary" /></div>
                      <div><p className="text-sm font-medium">Auto Zoom</p><p className="text-xs text-muted-foreground/60">Dynamic camera movements</p></div>
                    </div>
                    <Switch checked={autoZoom} onCheckedChange={setAutoZoom} />
                  </div>

                  <div className="premium-card p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Palette className="h-4 w-4 text-primary" /></div>
                      <div><p className="text-sm font-medium">Auto Color Grading</p><p className="text-xs text-muted-foreground/60">Cinematic color correction</p></div>
                    </div>
                    <Switch checked={colorGrading} onCheckedChange={setColorGrading} />
                  </div>

                  <div className="premium-card p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><MicOff className="h-4 w-4 text-primary" /></div>
                      <div><p className="text-sm font-medium">Remove Silence</p><p className="text-xs text-muted-foreground/60">Trim silent pauses</p></div>
                    </div>
                    <Switch checked={removeSilence} onCheckedChange={setRemoveSilence} />
                  </div>

                  <div className="premium-card p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Volume2 className="h-4 w-4 text-primary" /></div>
                      <div><p className="text-sm font-medium">Improve Audio</p><p className="text-xs text-muted-foreground/60">Enhance voice clarity</p></div>
                    </div>
                    <Switch checked={improveAudio} onCheckedChange={setImproveAudio} />
                  </div>

                  <div className="premium-card p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Music className="h-4 w-4 text-primary" /></div>
                      <div><p className="text-sm font-medium">Remove Noise</p><p className="text-xs text-muted-foreground/60">Clean background audio</p></div>
                    </div>
                    <Switch checked={removeNoise} onCheckedChange={setRemoveNoise} />
                  </div>
                </div>

                {selectedTemplate === "marketing" && (
                  <div className="premium-card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Mic className="h-4 w-4 text-primary" /></div>
                        <div><p className="text-sm font-medium">AI Narration</p><p className="text-xs text-muted-foreground/60">Generate voiceover automatically</p></div>
                      </div>
                      <Switch checked={narration} onCheckedChange={setNarration} />
                    </div>
                    {narration && (
                      <div className="pl-12">
                        <Select value={narrationVoice} onValueChange={setNarrationVoice}>
                          <SelectTrigger className="premium-input h-9 text-xs border-border/50"><SelectValue /></SelectTrigger>
                          <SelectContent className="glass-strong border-border/50">
                            <SelectItem value="pt-BR-Female">Português (Feminino)</SelectItem>
                            <SelectItem value="pt-BR-Male">Português (Masculino)</SelectItem>
                            <SelectItem value="en-US-Female">English (Female)</SelectItem>
                            <SelectItem value="en-US-Male">English (Male)</SelectItem>
                            <SelectItem value="es-ES-Female">Español (Femenino)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="premium-card p-5 space-y-2">
                    <p className="text-sm font-medium">Transition Style</p>
                    <Select value={transition} onValueChange={setTransition}>
                      <SelectTrigger className="premium-input h-9 border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent className="glass-strong border-border/50">
                        {["fade", "slide", "zoom", "wipe", "glitch", "none"].map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="premium-card p-5 space-y-2">
                    <p className="text-sm font-medium">Background Music</p>
                    <Select value={bgMusic} onValueChange={setBgMusic}>
                      <SelectTrigger className="premium-input h-9 border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent className="glass-strong border-border/50">
                        {["none", "upbeat", "cinematic", "lo-fi", "corporate", "ambient"].map((m) => (
                          <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="premium-card p-5 space-y-2">
                    <p className="text-sm font-medium">Quality</p>
                    <Select value={quality} onValueChange={setQuality}>
                      <SelectTrigger className="premium-input h-9 border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent className="glass-strong border-border/50">
                        {["draft", "standard", "premium"].map((q) => (
                          <SelectItem key={q} value={q} className="capitalize">{q}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3 space-y-4">
                  <div className="text-center space-y-2 mb-4">
                    <h2 className="gradient-text text-2xl font-bold">Review & Generate</h2>
                    <p className="text-sm text-muted-foreground/60">Confirm your selections and generate your video</p>
                  </div>

                  <div className="premium-card p-5 space-y-4">
                    <h3 className="text-sm font-semibold">Format</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        {format && (() => { const Icon = formatIcons[format] || MonitorSmartphone; return <Icon className="h-5 w-5 text-primary" />; })()}
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{format}</p>
                        <p className="text-xs text-muted-foreground/60">{format === "vertical" ? "9:16" : format === "horizontal" ? "16:9" : "1:1"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="premium-card p-5 space-y-3">
                    <h3 className="text-sm font-semibold">Media ({uploads.length} files)</h3>
                    <div className="flex flex-wrap gap-2">
                      {uploads.map((u) => (
                        <Badge key={u.id} variant="secondary" className="bg-muted/50 text-muted-foreground border-0 gap-1">
                          {u.type.startsWith("video") && <FileVideo className="h-3 w-3" />}
                          {u.type.startsWith("image") && <FileImage className="h-3 w-3" />}
                          {u.type.startsWith("audio") && <FileAudio className="h-3 w-3" />}
                          {u.name}
                        </Badge>
                      ))}
                      {uploads.length === 0 && <span className="text-xs text-muted-foreground/60">No files uploaded</span>}
                    </div>
                  </div>

                  <div className="premium-card p-5 space-y-3">
                    <h3 className="text-sm font-semibold">Template</h3>
                    <p className="text-sm text-muted-foreground/70">{selectedTemplate ? allTemplates.find((t) => t.id === selectedTemplate)?.name : "None selected"}</p>
                  </div>

                  <div className="premium-card p-5 space-y-3">
                    <h3 className="text-sm font-semibold">AI Settings</h3>
                    <div className="flex flex-wrap gap-2">
                      {captions && <Badge variant="secondary" className="bg-muted/50 border-0">Captions ({captionStyle})</Badge>}
                      {autoZoom && <Badge variant="secondary" className="bg-muted/50 border-0">Auto Zoom</Badge>}
                      {colorGrading && <Badge variant="secondary" className="bg-muted/50 border-0">Color Grading</Badge>}
                      {removeSilence && <Badge variant="secondary" className="bg-muted/50 border-0">Remove Silence</Badge>}
                      {improveAudio && <Badge variant="secondary" className="bg-muted/50 border-0">Improve Audio</Badge>}
                      {removeNoise && <Badge variant="secondary" className="bg-muted/50 border-0">Remove Noise</Badge>}
                      {selectedTemplate === "marketing" && narration && <Badge variant="secondary" className="bg-muted/50 border-0">Narration ({narrationVoice})</Badge>}
                      <Badge variant="secondary" className="bg-muted/50 border-0 capitalize">Transition: {transition}</Badge>
                      <Badge variant="secondary" className="bg-muted/50 border-0 capitalize">Music: {bgMusic}</Badge>
                      <Badge variant="secondary" className="bg-muted/50 border-0 capitalize">Quality: {quality}</Badge>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="premium-card p-5 space-y-4">
                    <h3 className="text-sm font-semibold">Estimated Time</h3>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="text-lg font-semibold">~2-3 minutes</span>
                    </div>
                    <p className="text-xs text-muted-foreground/60">Processing time depends on file sizes and settings</p>
                  </div>

                  <Button
                    size="lg"
                    className="w-full gap-2 bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25 hover:from-primary/90 hover:to-purple-500/90 transition-all duration-300 glow h-14 text-base"
                    onClick={handleGenerate}
                  >
                    <Wand2 className="h-5 w-5" />
                    Generate Video
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={step === 1}
          className="gap-2 border-border/50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < 5 && (
          <Button
            className="gap-2 bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25"
            onClick={goNext}
          >
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="premium-card mx-4 w-full max-w-md p-8"
            >
              <div className="flex flex-col items-center gap-6">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-500 shadow-lg shadow-primary/25"
                >
                  <Loader2 className="h-10 w-10 text-white animate-spin" />
                </motion.div>
                <div className="text-center space-y-1">
                  <p className="text-lg font-semibold">Generating Your Video</p>
                  <p className="text-sm text-muted-foreground/60">AI is processing your media with the selected settings</p>
                </div>
                <div className="w-full space-y-3">
                  <div className="relative h-2 overflow-hidden rounded-full bg-border/50">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary via-purple-500 to-accent"
                      style={{ width: `${progress}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      style={{ transform: `translateX(${progress - 100}%)`, width: "60%" }}
                    />
                  </div>
                  <motion.p
                    key={statusText}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-sm text-muted-foreground/70"
                  >
                    {statusText}
                  </motion.p>
                  <p className="text-center text-xs text-muted-foreground/40">{progress}% complete</p>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground/50 hover:text-destructive">
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
