"use client";

import { motion } from "framer-motion";
import {
  Wand2,
  Scissors,
  LayoutTemplate,
  Smartphone,
  Cloud,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Wand2,
    title: "AI Auto-Creation",
    description: "Generate videos from text in seconds with cutting-edge AI technology.",
  },
  {
    icon: Scissors,
    title: "Smart Editing",
    description: "Professional editing tools powered by AI for perfect cuts every time.",
  },
  {
    icon: LayoutTemplate,
    title: "Auto Templates",
    description: "Pre-built templates optimized for every platform and content type.",
  },
  {
    icon: Smartphone,
    title: "Multi-Format Export",
    description: "Export for TikTok, Reels, Shorts, YouTube, and more with one click.",
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    description: "Access your projects from anywhere with automatic cloud synchronization.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together in real-time with your team on any project.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function Features() {
  return (
    <section id="features" className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-radial from-primary/3 via-transparent to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="font-display text-3xl font-bold sm:text-4xl lg:text-5xl">
            Everything You Need to{" "}
            <span className="gradient-text">Create Amazing Videos</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Powerful features that make video creation effortless and fun.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="premium-card group cursor-default rounded-2xl p-6 transition-all duration-300 hover:border-primary/20 sm:p-8"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/10 text-primary ring-1 ring-primary/10 transition-all duration-300 group-hover:from-purple-500/30 group-hover:to-blue-500/20 group-hover:ring-primary/20 group-hover:shadow-lg group-hover:shadow-purple-500/10">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
