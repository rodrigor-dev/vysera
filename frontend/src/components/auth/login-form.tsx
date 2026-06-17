"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
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

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const [rememberMe, setRememberMe] = useState(false);

  const onSubmit = useCallback(
    async (data: LoginInput) => {
      setIsSubmitting(true);
      try {
        const sanitized = sanitizeObject(data as unknown as Record<string, unknown>);
        await login(sanitized.email as string, sanitized.password as string);
        toast.success("Welcome back!");
        onSuccess?.();
        router.push("/dashboard");
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid email or password";
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [login, onSuccess, router],
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
      <motion.div variants={fieldVariants} className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isSubmitting}
            className={cn(
              "premium-input pl-10",
              errors.email && "border-destructive ring-destructive/30",
            )}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            id="email-error"
            className="text-xs text-destructive"
            role="alert"
          >
            {errors.email.message}
          </motion.p>
        )}
      </motion.div>

      <motion.div variants={fieldVariants} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <Link
            href="/auth/forgot-password"
            className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline transition-colors"
            tabIndex={isSubmitting ? -1 : 0}
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={isSubmitting}
            className={cn(
              "premium-input pl-10 pr-10",
              errors.password && "border-destructive ring-destructive/30",
            )}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
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
        {errors.password && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            id="password-error"
            className="text-xs text-destructive"
            role="alert"
          >
            {errors.password.message}
          </motion.p>
        )}
      </motion.div>

      <motion.div variants={fieldVariants} className="flex items-center gap-2">
        <Checkbox
          id="rememberMe"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked === true)}
          disabled={isSubmitting}
        />
        <Label
          htmlFor="rememberMe"
          className="text-sm font-normal text-muted-foreground cursor-pointer select-none"
        >
          Remember me
        </Label>
      </motion.div>

      <motion.div variants={fieldVariants}>
        <Button
          type="submit"
          size="lg"
          className="w-full text-sm font-semibold glow"
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </motion.div>
    </motion.form>
  );
}
