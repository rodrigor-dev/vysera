"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmojiCategory {
  name: string;
  emojis: string[];
}

const categories: EmojiCategory[] = [
  {
    name: "Faces",
    emojis: ["😀", "😂", "🤣", "😍", "🥰", "😎", "🤩", "😜", "🤪", "😱", "🥳", "😈", "👻", "🤖", "👽", "💀"],
  },
  {
    name: "Hearts",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💝", "💖", "💗", "💕", "💞", "💘", "💔", "❤️‍🔥"],
  },
  {
    name: "Arrows",
    emojis: ["⬆️", "⬇️", "⬅️", "➡️", "↗️", "↘️", "↙️", "↖️", "↔️", "↕️", "🔄", "🔃", "⏫", "⏬", "➰", "✔️"],
  },
  {
    name: "Stars",
    emojis: ["⭐", "🌟", "✨", "💫", "⭐️", "🌟", "💥", "🔥", "⚡", "💧", "🌈", "🌙", "☀️", "❄️", "🎯", "🏆"],
  },
  {
    name: "Music",
    emojis: ["🎵", "🎶", "🎤", "🎧", "🎸", "🎹", "🥁", "🎷", "🎺", "🎻", "🎬", "🎨", "🎭", "🎪", "🎯", "🎲"],
  },
  {
    name: "Symbols",
    emojis: ["✅", "❌", "⭕", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣", "⚫", "⬜", "🔲", "🔳", "♾️", "⚕️", "☮️"],
  },
  {
    name: "Animals",
    emojis: ["🐶", "🐱", "🐼", "🐨", "🐯", "🦁", "🐮", "🐸", "🐵", "🐔", "🐧", "🐦", "🦄", "🐴", "🦋", "🐛"],
  },
  {
    name: "Food",
    emojis: ["🍕", "🍔", "🌮", "🌯", "🥗", "🍣", "🍩", "🍪", "🧁", "🍰", "🍫", "🍿", "🥤", "☕", "🍺", "🍷"],
  },
];

export function StickersPanel() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Faces");

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        emojis: cat.emojis.filter((e) => e.includes(q) || cat.name.toLowerCase().includes(q)),
      }))
      .filter((cat) => cat.emojis.length > 0);
  }, [search]);

  const handleAddSticker = (emoji: string) => {
    console.log("Add sticker:", emoji);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
        <Input
          placeholder="Search stickers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 pl-8 text-[11px]"
        />
      </div>

      {!search && (
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={cn(
                "shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all whitespace-nowrap",
                activeCategory === cat.name
                  ? "bg-primary/20 text-primary"
                  : "bg-white/5 text-muted-foreground/60 hover:text-foreground/70",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <ScrollArea className="max-h-[320px]">
        <div className="space-y-3">
          {filtered.map((cat) => (
            <div key={cat.name}>
              <label className="mb-1.5 block text-[10px] font-medium text-muted-foreground/60">
                {cat.name}
              </label>
              <div className="grid grid-cols-8 gap-1">
                {cat.emojis.map((emoji) => (
                  <motion.button
                    key={emoji}
                    onClick={() => handleAddSticker(emoji)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex aspect-square items-center justify-center rounded-lg bg-white/5 text-lg transition-colors hover:bg-white/10"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-xs text-muted-foreground/40">No stickers found</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border/20 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 border-dashed border-border/50 text-xs text-muted-foreground/60"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload Custom Image
        </Button>
      </div>
    </div>
  );
}
