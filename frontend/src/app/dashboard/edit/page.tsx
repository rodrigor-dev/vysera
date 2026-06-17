"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useEditorStore } from "@/store/editor-store";
import { EditorLayout } from "@/components/editor/editor-layout";
import { VyseraLogo } from "@/components/shared/vysera-logo";
import { Button } from "@/components/ui/button";
import { Film, FolderOpen, ArrowLeft } from "lucide-react";

export default function EditPage() {
  const { setProjectLoaded, setIsLoading, setProjectName } = useEditorStore.getState();
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "empty">("loading");

  useEffect(() => {
    const timer = setTimeout(() => {
      setProjectLoaded(true);
      setIsLoading(false);
      setProjectName("My Awesome Video");
      setLoadState("loaded");
    }, 800);
    return () => clearTimeout(timer);
  }, [setProjectLoaded, setIsLoading, setProjectName]);

  if (loadState === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-6">
          <VyseraLogo size="xl" animated />
          <div className="flex items-center gap-1">
            <motion.div
              className="h-1.5 w-1.5 rounded-full bg-primary"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="h-1.5 w-1.5 rounded-full bg-primary"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            />
            <motion.div
              className="h-1.5 w-1.5 rounded-full bg-primary"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
            />
          </div>
          <p className="text-xs text-muted-foreground/50">Loading project...</p>
        </div>
      </div>
    );
  }

  if (loadState === "empty") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-border/50 bg-white/5">
            <FolderOpen className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground/80">Open a Project</h2>
            <p className="mt-1 text-sm text-muted-foreground/50">
              Select a project to start editing
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2" asChild>
              <a href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </a>
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25" asChild>
              <a href="/dashboard/create">
                <Film className="h-4 w-4" />
                New Project
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#0a0a0a]">
      <EditorLayout />
    </div>
  );
}
