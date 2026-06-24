"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useAuthStore } from "@/store/auth-store";

export default function ForgotPasswordPage() {
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

  if (user) {
    return (
      <AuthFormLayout>
        <LoadingSpinner size="lg" className="py-12" text="Redirecionando..." />
      </AuthFormLayout>
    );
  }

  return (
    <AuthFormLayout title="Reset password" subtitle="No worries, we'll send you reset instructions">
      <ForgotPasswordForm />
    </AuthFormLayout>
  );
}
