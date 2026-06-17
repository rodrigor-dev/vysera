"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface StripeCheckoutProps {
  priceId: string;
  billingType: "monthly" | "annual";
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "outline";
}

export function StripeCheckout({
  priceId,
  billingType,
  className,
  children,
  variant = "default",
}: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, billingType }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to start checkout");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("No checkout URL returned");
      }
    } catch {
      toast.error("Failed to connect to payment provider");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      variant={variant}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Redirecting...
        </>
      ) : (
        children
      )}
    </Button>
  );
}
