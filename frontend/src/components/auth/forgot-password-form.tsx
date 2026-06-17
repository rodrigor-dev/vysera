"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";
import { sanitizeObject } from "@/lib/security/sanitize";
import { cn } from "@/lib/utils";

const formVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = useCallback(
    async (data: ForgotPasswordInput) => {
      setIsSubmitting(true);
      try {
        const sanitized = sanitizeObject(data as unknown as Record<string, unknown>);
        const supabase = createClient();
        const { error } = await supabase.auth.resetPasswordForEmail(
          sanitized.email as string,
          { redirectTo: `${window.location.origin}/auth/reset-password` },
        );
        if (error) throw error;
        setSubmittedEmail(sanitized.email as string);
        setIsSuccess(true);
        toast.success("Check your email for reset instructions");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to send reset email";
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5 py-4 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 glow-sm">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
        </motion.div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Check your email</h3>
          <p className="text-sm text-muted-foreground">
            We sent a password reset link to{" "}
            <span className="font-medium text-foreground">{submittedEmail}</span>
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Didn&apos;t receive the email? Check your spam folder or{" "}
          <button
            type="button"
            onClick={() => setIsSuccess(false)}
            className="text-primary underline-offset-4 hover:underline transition-colors"
          >
            try again
          </button>
        </p>
        <Link
          href="/auth/login"
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.form
      variants={formVariants}
      initial="hidden"
      animate="show"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
    >
      <motion.div variants={fieldVariants} className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </motion.div>

      <motion.div variants={fieldVariants} className="space-y-2">
        <Label htmlFor="reset-email" className="text-sm font-medium">
          Email
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reset-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isSubmitting}
            className={cn(
              "premium-input pl-10",
              errors.email && "border-destructive ring-destructive/30",
            )}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "reset-email-error" : undefined}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            id="reset-email-error"
            className="text-xs text-destructive"
            role="alert"
          >
            {errors.email.message}
          </motion.p>
        )}
      </motion.div>

      <motion.div variants={fieldVariants} className="space-y-3">
        <Button
          type="submit"
          size="lg"
          className="w-full text-sm font-semibold glow"
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send reset link"}
        </Button>

        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </motion.div>
    </motion.form>
  );
}
