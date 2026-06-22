"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/use-translation";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stats = [
  { value: "10K+", labelKey: "hero.stat.creators" },
  { value: "1M+", labelKey: "hero.stat.videos" },
  { value: "99.9%", labelKey: "hero.stat.uptime" },
];

const floatingShapes = [
  { size: 64, x: "12%", y: "18%", delay: 0, duration: 5, color: "bg-purple-500/20" },
  { size: 40, x: "82%", y: "25%", delay: 1.2, duration: 4, color: "bg-blue-500/20" },
  { size: 56, x: "75%", y: "70%", delay: 0.6, duration: 5.5, color: "bg-cyan-500/15" },
  { size: 32, x: "20%", y: "75%", delay: 1.8, duration: 4.5, color: "bg-purple-400/20" },
  { size: 24, x: "50%", y: "10%", delay: 2.2, duration: 3.5, color: "bg-violet-400/20" },
  { size: 48, x: "45%", y: "80%", delay: 1, duration: 5, color: "bg-primary/10" },
];

export function Hero() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-[0.04]" />

      <motion.div
        className="absolute -left-64 -top-64 h-[500px] w-[500px] rounded-full bg-gradient-radial from-purple-500/15 via-transparent to-transparent blur-3xl"
        animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-64 -bottom-64 h-[500px] w-[500px] rounded-full bg-gradient-radial from-cyan-500/10 via-transparent to-transparent blur-3xl"
        animate={{ scale: [1, 1.2, 1], x: [0, -20, 0], y: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/3 top-1/3 h-[300px] w-[300px] rounded-full bg-gradient-radial from-primary/8 via-transparent to-transparent blur-3xl"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {floatingShapes.map((shape, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-2xl ${shape.color}`}
          style={{
            width: shape.size,
            height: shape.size,
            left: shape.x,
            top: shape.y,
          }}
          animate={{ y: [-12, 12, -12], x: [-6, 6, -6], scale: [1, 1.08, 1] }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            delay: shape.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      <motion.div style={{ y, opacity }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative mx-auto flex max-w-7xl flex-col items-center px-4 pt-28 sm:px-6 lg:px-8"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {t("hero.badge")}
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="max-w-5xl text-center text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
          >
            <span className="gradient-text">{t("hero.title.gradient")}</span>
            <br />
            <span className="text-foreground">{t("hero.title.plain")}</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-2xl text-center text-base text-muted-foreground sm:text-lg md:text-xl"
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          >
            <Link
              href="/auth/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 glow"
            >
              {t("hero.cta")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button className="group inline-flex items-center gap-2 rounded-xl border border-border bg-background/50 px-8 py-3.5 text-base font-semibold text-foreground backdrop-blur-sm transition-all hover:bg-accent hover:border-primary/30">
              <Play className="h-4 w-4 transition-transform group-hover:scale-110" />
              {t("hero.cta.secondary")}
            </button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="relative mt-16 w-full max-w-4xl"
          >
            <div className="glass gradient-border overflow-hidden rounded-2xl shadow-elevated">
              <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-purple-500/10 via-primary/5 to-cyan-500/10">
                <div className="relative flex items-center justify-center">
                  <motion.div
                    className="absolute h-36 w-36 rounded-full bg-primary/20 blur-3xl"
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2">
                      {["bg-purple-500", "bg-primary", "bg-cyan-500"].map((c, i) => (
                        <motion.div
                          key={i}
                          className={`h-3 w-3 rounded-full ${c} shadow-lg shadow-${c}/50`}
                          animate={{ y: [-4, 4, -4] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("hero.preview")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="mt-16 grid w-full max-w-3xl grid-cols-3 gap-8 border-t border-border/40 pt-10"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.labelKey}
                variants={itemVariants}
                className="text-center"
              >
                <div className="font-display text-2xl font-bold gradient-text sm:text-3xl lg:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {t(stat.labelKey)}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
