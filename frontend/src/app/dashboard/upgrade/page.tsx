"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StripeCheckout } from "@/components/billing/stripe-checkout";
import { MPCheckout } from "@/components/billing/mp-checkout";
import { toast } from "sonner";
import {
  Sparkles,
  Check,
  X,
  Zap,
  CheckCircle2,
  ArrowRight,
  Quote,
  Shield,
  Infinity,
  Loader2,
} from "lucide-react";

interface PlanData {
  id: string;
  name: string;
  price: { monthly: number; annual: number };
  description: string;
  features: Record<string, unknown>;
  stripePriceId: string | null;
}

const plans = [
  {
    name: "Free",
    price: { monthly: "$0", annual: "$0" },
    description: "Get started with basic features",
    features: [
      "3 projects max",
      "720p exports",
      "Basic templates",
      "5 uploads/month",
      "Watermark on exports",
    ],
    missing: [
      "AI voiceover",
      "Custom branding",
      "Priority support",
      "4K exports",
    ],
    cta: "Current Plan",
    popular: false,
    icon: Shield,
    priceId: null,
  },
  {
    name: "Pro",
    price: { monthly: "R$15", annual: "R$11,25" },
    description: "For professional content creators",
    features: [
      "Unlimited projects",
      "4K exports",
      "All templates",
      "Unlimited uploads",
      "No watermark",
      "AI voiceover",
      "Custom branding",
      "Priority support & queue",
    ],
    missing: [],
    cta: "Upgrade to Pro",
    popular: true,
    icon: Zap,
    priceIdMonthly: "price_pro_monthly",
    priceIdAnnual: "price_pro_annual",
  },
  {
    name: "Ultra",
    price: { monthly: "R$29", annual: "R$21,66" },
    description: "For teams and organizations",
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "API access",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
      "White-label exports",
    ],
    missing: [],
    cta: "Upgrade to Ultra",
    popular: false,
    icon: Infinity,
    priceIdMonthly: "price_enterprise_monthly",
    priceIdAnnual: "price_enterprise_annual",
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Content Creator",
    avatar: "SC",
    content:
      "Vysera Pro has completely transformed my content workflow. The AI voiceover feature alone saves me hours every week.",
  },
  {
    name: "Marcus Johnson",
    role: "Social Media Manager",
    avatar: "MJ",
    content:
      "The 4K exports and unlimited projects are game-changers. I've tripled my content output since upgrading.",
  },
  {
    name: "Elena Rodriguez",
    role: "Digital Marketer",
    avatar: "ER",
    content:
      "Best investment for our marketing team. The templates are incredible and the quality is unmatched.",
  },
];

const planIcons = [Shield, Zap, Infinity];
const planColors = [
  "from-muted-foreground/20 to-muted-foreground/10",
  "from-primary to-purple-500",
  "from-amber-500 to-rose-500",
];

const comparisonFeatures = [
  { name: "Projects", free: "3 max", pro: "Unlimited", ultra: "Unlimited" },
  { name: "Export Quality", free: "720p", pro: "4K", ultra: "4K" },
  { name: "Watermark", free: "Yes", pro: "No", ultra: "No" },
  { name: "Templates", free: "Basic", pro: "All", ultra: "All + Custom" },
  { name: "Uploads", free: "5/month", pro: "Unlimited", ultra: "Unlimited" },
  { name: "AI Voiceover", free: false, pro: true, ultra: true },
  { name: "Custom Branding", free: false, pro: true, ultra: true },
  { name: "Team Members", free: "1", pro: "5", ultra: "Unlimited" },
  { name: "Priority Support", free: false, pro: true, ultra: true },
  { name: "API Access", free: false, pro: false, ultra: true },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
};

export default function UpgradePage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [plansData, setPlansData] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscriptions/plans")
      .then((r) => r.json())
      .then((d) => setPlansData(d.plans || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUltra = () => {
    toast.success("We'll reach out to you shortly");
  };

  const getPriceId = (planName: string) => {
    const plan = plansData.find((p) => p.name.toLowerCase() === planName.toLowerCase());
    if (plan?.stripePriceId) return plan.stripePriceId;
    if (planName === "Pro") return billing === "monthly" ? "price_pro_monthly" : "price_pro_annual";
    if (planName === "Ultra") return billing === "monthly" ? "price_enterprise_monthly" : "price_enterprise_annual";
    return null;
  };

  const price = (planName: string) => {
    if (planName === "Free") return "$0";
    const p = plans.find((pl) => pl.name === planName);
    if (!p) return "$0";
    return billing === "monthly" ? p.price.monthly : p.price.annual;
  };

  const annualPrice = (planName: string) => {
    if (planName === "Free") return "Grátis";
    if (planName === "Pro") return "R$134,90/ano";
    if (planName === "Ultra") return "R$259,90/ano";
    return "Personalizado";
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 pb-12"
    >
      <motion.div variants={cardVariants} className="space-y-2 text-center">
        <h1 className="gradient-text text-4xl font-bold tracking-tight sm:text-5xl">
          Choose Your Plan
        </h1>
        <p className="text-muted-foreground/60 text-lg max-w-xl mx-auto">
          Unlock premium features and take your content creation to the next level
        </p>
      </motion.div>

      <motion.div variants={cardVariants} className="mx-auto flex max-w-xs items-center justify-center rounded-full border border-border/50 bg-muted/30 p-1">
        <button
          onClick={() => setBilling("monthly")}
          className={cn(
            "flex-1 rounded-full px-6 py-2 text-sm font-medium transition-all duration-300",
            billing === "monthly" && "bg-background shadow-sm shadow-black/10",
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling("annual")}
          className={cn(
            "relative flex-1 rounded-full px-6 py-2 text-sm font-medium transition-all duration-300",
            billing === "annual" && "bg-background shadow-sm shadow-black/10",
          )}
        >
          Annual
          <span className="absolute -right-1 -top-2.5 inline-flex items-center rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-lg shadow-emerald-500/25">
            Save up to 25%
          </span>
        </button>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8 max-w-5xl mx-auto">
        {plans.map((plan, index) => {
          const PlanIcon = planIcons[index] ?? Sparkles;
          const priceId = getPriceId(plan.name);
          const isProPlan = plan.name === "Pro";

          return (
            <motion.div
              key={plan.name}
              variants={cardVariants}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 transition-all duration-300",
                "hover:shadow-lg hover:-translate-y-1",
                plan.popular
                  ? "border-primary/50 bg-gradient-to-b from-primary/5 to-transparent shadow-lg shadow-primary/10"
                  : "border-border/50 bg-card",
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-purple-500 px-4 py-1 text-xs font-semibold text-white shadow-lg shadow-primary/25">
                    <Zap className="h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6 text-center">
                <div className={cn(
                  "mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br",
                  planColors[index],
                  plan.popular ? "shadow-lg shadow-primary/25" : "",
                )}>
                  <PlanIcon className={cn(
                    "h-6 w-6",
                    plan.popular ? "text-white" : "text-muted-foreground",
                  )} />
                </div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6 text-center">
                <span className="text-4xl font-bold">
                  {price(plan.name)}
                </span>
                <span className="text-muted-foreground/60">/month</span>
                {billing === "annual" && plan.name !== "Free" && (
                  <p className="mt-1 text-xs text-emerald-400 font-medium">
                    Billed annually ({annualPrice(plan.name)})
                  </p>
                )}
              </div>

              <Separator className="mb-6 bg-border/50" />

              <div className="mb-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
                {plan.missing.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-muted-foreground/40">
                    <X className="h-4 w-4 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {plan.name === "Free" ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full gap-2 border-border/50"
                  disabled
                >
                  <Check className="h-4 w-4" />
                  Current Plan
                </Button>
              ) : plan.name === "Ultra" ? (
                <div className="space-y-2">
                  <Button
                    size="lg"
                    className="w-full gap-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg shadow-amber-500/25"
                    onClick={handleUltra}
                  >
                    Upgrade to Ultra
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <MPCheckout
                    plan="enterprise"
                    billingType={billing}
                    className="w-full gap-2 border-border/50 text-muted-foreground/80"
                    variant="outline"
                  >
                    <Sparkles className="h-4 w-4" />
                    Pay with Mercado Pago
                  </MPCheckout>
                </div>
              ) : plan.name === "Pro" ? (
                <div className="space-y-2">
                  <StripeCheckout
                    priceId={priceId || "price_pro_monthly"}
                    billingType={billing}
                    className="w-full gap-2 bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/25 hover:from-primary/90 hover:to-purple-500/90 hover:shadow-primary/30"
                  >
                    Upgrade to Pro
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </StripeCheckout>
                  <MPCheckout
                    plan="pro"
                    billingType={billing}
                    className="w-full gap-2 border-border/50 text-muted-foreground/80"
                    variant="outline"
                  >
                    <Sparkles className="h-4 w-4" />
                    Pay with Mercado Pago
                  </MPCheckout>
                </div>
              ) : null}
            </motion.div>
          );
        })}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
        </div>
      )}

      <motion.div variants={cardVariants} className="max-w-4xl mx-auto">
        <div className="premium-card p-6">
          <div className="mb-6 text-center space-y-1">
            <h2 className="text-2xl font-bold">Feature Comparison</h2>
            <p className="text-muted-foreground/60">
              See exactly what you get with each plan
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="py-4 text-left font-medium text-muted-foreground/70">Feature</th>
                  <th className="py-4 text-center font-medium text-muted-foreground/70">Free</th>
                  <th className="py-4 text-center font-medium text-primary">Pro</th>
                  <th className="py-4 text-center font-medium text-muted-foreground/70">Ultra</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature) => (
                  <tr key={feature.name} className="border-b border-border/30 last:border-0">
                    <td className="py-4 text-left font-medium">{feature.name}</td>
                    <td className="py-4 text-center">
                      {feature.free === false ? (
                        <X className="mx-auto h-4 w-4 text-muted-foreground/30" />
                      ) : (
                        <span className="text-muted-foreground/60">{feature.free}</span>
                      )}
                    </td>
                    <td className="py-4 text-center">
                      {feature.pro === true ? (
                        <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-400" />
                      ) : (
                        <span className="text-foreground/80">{feature.pro}</span>
                      )}
                    </td>
                    <td className="py-4 text-center">
                      {feature.ultra === true ? (
                        <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-400" />
                      ) : (
                        <span className="text-foreground/80">{feature.ultra}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Loved by Creators</h2>
          <p className="text-muted-foreground/60">
            See what our users say about Vysera
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <div className="premium-card h-full p-6">
                <Quote className="mb-4 h-8 w-8 text-primary/20" />
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground/80">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-border/50">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-purple-500/20 text-primary text-xs font-semibold">
                      {t.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground/60">{t.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
