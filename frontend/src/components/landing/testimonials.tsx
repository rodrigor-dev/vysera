"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Content Creator",
    avatar: "SC",
    quote:
      "Vysera completely transformed my content workflow. I can now create professional-quality videos in minutes instead of hours. The AI is mind-blowing.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Social Media Manager",
    avatar: "MJ",
    quote:
      "We've been using Vysera for our agency's clients and the results are incredible. The multi-format export saves us hours every week.",
    rating: 5,
  },
  {
    name: "Elena Rodriguez",
    role: "YouTuber",
    avatar: "ER",
    quote:
      "The AI editing tools are game-changers. What used to take me a full day now takes 15 minutes. My productivity has skyrocketed.",
    rating: 5,
  },
  {
    name: "Alex Kim",
    role: "Digital Marketer",
    avatar: "AK",
    quote:
      "Finally, a tool that understands what creators need. The template library is fantastic and the output quality is consistently amazing.",
    rating: 5,
  },
  {
    name: "Jordan Lee",
    role: "Video Editor",
    avatar: "JL",
    quote:
      "I was skeptical at first, but Vysera delivers real results. The AI voiceover feature alone is worth the price of admission.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "Brand Strategist",
    avatar: "PS",
    quote:
      "Our team produces three times more content since switching to Vysera. The collaboration features are seamless and intuitive.",
    rating: 5,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function Testimonials() {
  return (
    <section id="testimonials" className="relative overflow-hidden py-24 sm:py-32">
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
            Loved by <span className="gradient-text">Creators</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Join thousands of satisfied creators worldwide.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={cardVariants}
              className="premium-card group rounded-2xl p-6 transition-all duration-300 hover:border-primary/20 sm:p-8"
            >
              <div className="mb-4 flex items-center gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-primary text-primary"
                  />
                ))}
              </div>

              <blockquote className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-sm font-semibold text-primary ring-1 ring-primary/10">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {t.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
