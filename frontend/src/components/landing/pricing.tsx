"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    description: "Perfect for getting started",
    price: { monthly: "$0", annual: "$0" },
    period: { monthly: "/month", annual: "/month" },
    featured: false,
    features: [
      { text: "Basic AI video creation", included: true },
      { text: "5 videos per month", included: true },
      { text: "720p export quality", included: true },
      { text: "Access to free templates", included: true },
      { text: "Watermark on exports", included: false },
      { text: "4K export", included: false },
      { text: "AI voiceover", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Pro",
    description: "For serious creators",
    price: { monthly: "$19", annual: "$15" },
    period: { monthly: "/month", annual: "/month" },
    featured: true,
    features: [
      { text: "Advanced AI video creation", included: true },
      { text: "Unlimited videos", included: true },
      { text: "4K export quality", included: true },
      { text: "All premium templates", included: true },
      { text: "No watermark", included: true },
      { text: "AI voiceover & effects", included: true },
      { text: "Priority support", included: true },
      { text: "Team collaboration (up to 3)", included: true },
    ],
  },
  {
    name: "Enterprise",
    description: "For teams & businesses",
    price: { monthly: "Custom", annual: "Custom" },
    period: "",
    featured: false,
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Unlimited team members", included: true },
      { text: "API access", included: true },
      { text: "Custom AI models", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Custom integrations", included: true },
      { text: "SLA guarantee", included: true },
      { text: "24/7 phone support", included: true },
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative overflow-hidden py-24 sm:py-32">
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
            Simple, Transparent{" "}
            <span className="gradient-text">Pricing</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Choose the plan that fits your needs. No hidden fees.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-10 flex items-center justify-center gap-4"
        >
          <span
            className={cn(
              "text-sm font-medium transition-colors duration-300",
              !annual ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={cn(
              "relative h-7 w-12 rounded-full transition-colors duration-300",
              annual ? "bg-primary" : "bg-muted-foreground/30"
            )}
            aria-label={annual ? "Switch to monthly" : "Switch to annual"}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow"
              style={{ x: annual ? 20 : 0 }}
            />
          </button>
          <span
            className={cn(
              "text-sm font-medium transition-colors duration-300",
              annual ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Annual
            <span className="ml-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 px-2 py-0.5 text-xs font-medium text-primary">
              Save up to 20%
            </span>
          </span>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-12 grid gap-8 lg:grid-cols-3"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={cardVariants}
              className={cn(
                "relative flex flex-col rounded-2xl border p-8 transition-all duration-300",
                plan.featured
                  ? "gradient-border border-transparent bg-card/50 shadow-elevated"
                  : "premium-card"
              )}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge-premium inline-flex items-center gap-1 shadow-lg shadow-purple-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/80 animate-pulse" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display text-xl font-bold text-foreground">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6 flex items-baseline gap-1">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={annual ? "annual" : "monthly"}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="font-display text-4xl font-bold text-foreground"
                  >
                    {annual ? plan.price.annual : plan.price.monthly}
                  </motion.span>
                </AnimatePresence>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">
                    {typeof plan.period === "string"
                      ? plan.period
                      : annual
                        ? plan.period.annual
                        : plan.period.monthly}
                  </span>
                )}
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full",
                        feature.included
                          ? "bg-gradient-to-br from-purple-500/20 to-blue-500/20"
                          : "bg-muted/50"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-3 w-3",
                          feature.included
                            ? "text-primary"
                            : "text-muted-foreground/40"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-sm",
                        feature.included
                          ? "text-foreground"
                          : "text-muted-foreground/50"
                      )}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === "Enterprise" ? "/contact" : "/auth/register"}
                className={cn(
                  "inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300",
                  plan.featured
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02]"
                    : "border border-border bg-background text-foreground hover:bg-accent"
                )}
              >
                {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
