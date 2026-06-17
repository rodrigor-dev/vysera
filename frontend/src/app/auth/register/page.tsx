"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import { RegisterForm } from "@/components/auth/register-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useAuthStore } from "@/store/auth-store";

export default function RegisterPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <AuthFormLayout>
        <LoadingSpinner size="lg" className="py-12" />
      </AuthFormLayout>
    );
  }

  if (user) return null;

  return (
    <AuthFormLayout title="Create your account" subtitle="Get started with Vysera">
      <RegisterForm />

      <OAuthButtons />

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="mt-6 text-center text-sm text-muted-foreground"
      >
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-primary underline-offset-4 hover:underline transition-colors"
        >
          Sign in
        </Link>
      </motion.p>
    </AuthFormLayout>
  );
}
