import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, startIcon, endIcon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {startIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {startIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-xl border bg-background/80 px-3 py-2 text-sm text-foreground backdrop-blur-sm",
            "placeholder:text-muted-foreground/60",
            "border-border hover:border-border/80",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "focus-visible:outline-none focus-visible:border-primary/50 focus-visible:shadow-[0_0_0_1px_hsl(var(--primary)/0.3),0_0_20px_-4px_hsl(var(--primary)/0.15)]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
            error && "border-destructive focus-visible:border-destructive focus-visible:shadow-[0_0_0_1px_hsl(var(--destructive)/0.3)]",
            "transition-all duration-200",
            startIcon && "pl-10",
            endIcon && "pr-10",
            className,
          )}
          ref={ref}
          {...props}
        />
        {endIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {endIcon}
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
