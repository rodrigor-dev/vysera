"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MPCheckoutProps {
  plan: "pro" | "enterprise";
  billingType: "monthly" | "annual";
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "outline";
}

export function MPCheckout({
  plan,
  billingType,
  className,
  children,
}: MPCheckoutProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/mp-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billingType }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create payment");
        return;
      }

      if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        toast.error("No payment URL returned");
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
