import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, showCount, maxLength, value, ...props }, ref) => {
    const charCount = typeof value === "string" ? value.length : 0;
    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-xl border bg-background/80 px-3 py-2 text-sm text-foreground backdrop-blur-sm",
            "placeholder:text-muted-foreground/60",
            "border-border hover:border-border/80",
            "focus-visible:outline-none focus-visible:border-primary/50 focus-visible:shadow-[0_0_0_1px_hsl(var(--primary)/0.3),0_0_20px_-4px_hsl(var(--primary)/0.15)]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
            "resize-y",
            error &&
              "border-destructive focus-visible:border-destructive focus-visible:shadow-[0_0_0_1px_hsl(var(--destructive)/0.3)]",
            "transition-all duration-200",
            className,
          )}
          ref={ref}
          value={value}
          maxLength={maxLength}
          {...props}
        />
        {showCount && maxLength && (
          <div className="absolute bottom-2 right-3 text-xs text-muted-foreground/50 pointer-events-none">
            {charCount}/{maxLength}
          </div>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
