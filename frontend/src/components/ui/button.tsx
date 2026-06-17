"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md",
        destructive:
          "bg-gradient-to-br from-destructive to-red-700 text-destructive-foreground shadow-lg shadow-destructive/25 hover:shadow-xl hover:shadow-destructive/30 hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border border-border bg-background/50 backdrop-blur-sm text-foreground hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/10 active:bg-primary/10",
        secondary:
          "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground shadow-sm",
        ghost:
          "text-foreground/70 hover:bg-white/5 hover:text-foreground hover:backdrop-blur-sm active:bg-white/10",
        link: "text-primary underline-offset-4 hover:underline decoration-primary/30 hover:decoration-primary transition-all duration-200",
      },
      size: {
        sm: "h-8 rounded-lg px-3 text-xs gap-1.5",
        default: "h-10 rounded-xl px-4 py-2 gap-2",
        lg: "h-12 rounded-xl px-6 text-base gap-2.5",
        xl: "h-14 rounded-2xl px-8 text-lg gap-3",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "motion-safe:transition-all motion-safe:duration-200",
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
