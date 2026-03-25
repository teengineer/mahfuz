import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

/* ── Content ── */
const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className = "", sideOffset = 6, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={`z-50 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-elevated)] font-sans shadow-[var(--shadow-float)] animate-scale-in ${className}`}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = "PopoverContent";

/* ── Re-exports ── */
const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverAnchor = PopoverPrimitive.Anchor;

export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent };
