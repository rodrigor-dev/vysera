import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 select-none",
  {
    variants: {
      variant: {
        default:
          "border-primary/20 bg-primary/10 text-primary shadow-sm shadow-primary/5",
        secondary:
          "border-border/50 bg-muted/80 text-muted-foreground",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive shadow-sm shadow-destructive/5",
        outline:
          "border-border text-foreground/70 bg-transparent",
        premium:
          "border-transparent bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/5",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-sm shadow-amber-500/5",
      },
      dot: {
        true: "gap-1.5",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      dot: false,
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, dot }), className)} {...props}>
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
