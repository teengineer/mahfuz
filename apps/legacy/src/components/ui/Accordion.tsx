import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";

/* ── Item ── */
const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className = "", ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={`border-b border-[var(--theme-border)] last:border-b-0 ${className}`}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

/* ── Trigger ── */
const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className = "", children, ...props }, ref) => (
  <AccordionPrimitive.Header asChild>
    <div>
      <AccordionPrimitive.Trigger
        ref={ref}
        className={`flex w-full items-center justify-between hover:bg-[var(--theme-hover-bg)] ${className}`}
        {...props}
      >
        {children}
      </AccordionPrimitive.Trigger>
    </div>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = "AccordionTrigger";

/* ── Content (uses accordion-grid CSS for smooth height animation) ── */
const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className = "", children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={`accordion-grid ${className}`}
    {...props}
  >
    <div className="overflow-hidden">
      {children}
    </div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = "AccordionContent";

/* ── Re-exports ── */
const Accordion = AccordionPrimitive.Root;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
