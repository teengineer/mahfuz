import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

/* ── Content ── */
const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className = "", sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={`z-50 rounded-lg bg-[var(--theme-bg-elevated)] px-3 py-1.5 text-sm shadow-[var(--shadow-float)] border border-[var(--theme-border)] animate-fade-in ${className}`}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";

/* ── Re-exports ── */
const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
