"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
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

function getPasswordStrength(password: string): {
  score: number;
  label: string;
} {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 10;
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[^a-zA-Z\d]/.test(password)) score += 20;

  if (score < 30) return { score, label: "Weak" };
  if (score < 60) return { score, label: "Fair" };
  if (score < 80) return { score, label: "Good" };
  return { score, label: "Strong" };
}

function strengthColor(label: string): string {
  switch (label) {
    case "Weak": return "bg-destructive";
    case "Fair": return "bg-orange-500";
    case "Good": return "bg-yellow-500";
    case "Strong": return "bg-emerald-500";
    default: return "bg-primary";
  }
}

const requirements = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { label: "Uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "Lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
  { label: "Number", test: (pw: string) => /\d/.test(pw) },
];

interface ResetPasswordFormProps {
  token?: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = watch("password") ?? "";
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const onSubmit = useCallback(
    async (data: ResetPasswordInput) => {
      setIsSubmitting(true);
      try {
        const sanitized = sanitizeObject(data as unknown as Record<string, unknown>);
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
          password: sanitized.password as string,
        });
        if (error) throw error;
        toast.success("Password reset successfully");
        router.push("/auth/login");
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to reset password";
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [router],
  );

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
          Choose a new password for your account.
        </p>
      </motion.div>

      <motion.div variants={fieldVariants} className="space-y-2">
        <Label htmlFor="new-password" className="text-sm font-medium">
          New password
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="new-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            autoComplete="new-password"
            disabled={isSubmitting}
            className={cn(
              "premium-input pl-10 pr-10",
              errors.password && "border-destructive ring-destructive/30",
            )}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "new-password-error" : undefined}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={isSubmitting ? -1 : 0}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {password.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <Progress
                value={strength.score}
                className="h-1.5 bg-secondary"
                indicatorClassName={strengthColor(strength.label)}
              />
              <span className="text-xs text-muted-foreground min-w-[3rem] text-right">
                {strength.label}
              </span>
            </div>
            <ul className="space-y-1">
              {requirements.map((req) => {
                const met = req.test(password);
                return (
                  <li
                    key={req.label}
                    className={cn(
                      "flex items-center gap-1.5 text-xs transition-colors",
                      met ? "text-emerald-500" : "text-muted-foreground",
                    )}
                  >
                    {met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {req.label}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
        {errors.password && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            id="new-password-error"
            className="text-xs text-destructive"
            role="alert"
          >
            {errors.password.message}
          </motion.p>
        )}
      </motion.div>

      <motion.div variants={fieldVariants} className="space-y-2">
        <Label htmlFor="confirm-new-password" className="text-sm font-medium">
          Confirm new password
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirm-new-password"
            type={showConfirm ? "text" : "password"}
            placeholder="Repeat new password"
            autoComplete="new-password"
            disabled={isSubmitting}
            className={cn(
              "premium-input pl-10 pr-10",
              errors.confirmPassword && "border-destructive ring-destructive/30",
            )}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirm-new-password-error" : undefined}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showConfirm ? "Hide password" : "Show password"}
            tabIndex={isSubmitting ? -1 : 0}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            id="confirm-new-password-error"
            className="text-xs text-destructive"
            role="alert"
          >
            {errors.confirmPassword.message}
          </motion.p>
        )}
      </motion.div>

      <motion.div variants={fieldVariants}>
        <Button
          type="submit"
          size="lg"
          className="w-full text-sm font-semibold glow"
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          {isSubmitting ? "Resetting..." : "Reset password"}
        </Button>
      </motion.div>
    </motion.form>
  );
}
