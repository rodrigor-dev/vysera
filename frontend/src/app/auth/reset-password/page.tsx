"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useAuthStore } from "@/store/auth-store";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) setToken(tokenParam);
  }, [searchParams]);

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
    <AuthFormLayout title="Reset your password" subtitle="Choose a new password for your account">
      <ResetPasswordForm token={token ?? undefined} />
    </AuthFormLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthFormLayout>
          <LoadingSpinner size="lg" className="py-12" />
        </AuthFormLayout>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
