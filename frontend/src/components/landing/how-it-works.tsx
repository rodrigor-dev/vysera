"use client";

import { motion } from "framer-motion";
import { Lightbulb, Sparkles, Share2 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Lightbulb,
    title: "Describe Your Idea",
    description: "Type a few words about the video you want to create. Our AI understands your vision.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "AI Creates Your Video",
    description: "Our advanced AI generates stunning visuals, adds effects, and syncs everything perfectly.",
  },
  {
    number: "03",
    icon: Share2,
    title: "Export & Share",
    description: "Export in any format and share directly to TikTok, Reels, Shorts, or download.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 bg-gradient-radial from-violet-500/3 via-transparent to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="font-display text-3xl font-bold sm:text-4xl lg:text-5xl">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Three simple steps to create professional videos.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative mt-16 grid gap-8 md:grid-cols-3"
        >
          <div className="absolute left-0 right-0 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block" />

          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-primary/30 to-transparent md:hidden" />

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              variants={stepVariants}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/10 ring-1 ring-primary/20 shadow-lg shadow-purple-500/5 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:ring-primary/30">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-[10px] font-bold text-white shadow-lg">
                  {step.number}
                </div>
              </div>

              <h3 className="font-display text-xl font-bold text-foreground">
                {step.title}
              </h3>

              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>

              {index < steps.length - 1 && (
                <div className="mt-6 h-px w-12 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 md:hidden" />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
