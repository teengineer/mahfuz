import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

/* ── Overlay ── */
const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className = "", ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={`fixed inset-0 z-50 bg-black/30 backdrop-blur-sm animate-fade-in ${className}`}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

/* ── Content (centered modal) ── */
interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  preventOverlayClose?: boolean;
}

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className = "", preventOverlayClose, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay
      onClick={preventOverlayClose ? (e) => e.preventDefault() : undefined}
    />
    <DialogPrimitive.Content
      ref={ref}
      onEscapeKeyDown={preventOverlayClose ? (e) => e.preventDefault() : undefined}
      onPointerDownOutside={preventOverlayClose ? (e) => e.preventDefault() : undefined}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";

/* ── Sheet (bottom-sheet mobile, centered desktop) ── */
const DialogSheet = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className = "", preventOverlayClose, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay
      onClick={preventOverlayClose ? (e) => e.preventDefault() : undefined}
    />
    <DialogPrimitive.Content
      ref={ref}
      onEscapeKeyDown={preventOverlayClose ? (e) => e.preventDefault() : undefined}
      onPointerDownOutside={preventOverlayClose ? (e) => e.preventDefault() : undefined}
      className={`fixed inset-x-0 bottom-0 z-50 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4 ${className}`}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogSheet.displayName = "DialogSheet";

/* ── Re-exports ── */
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;
const DialogPortal = DialogPrimitive.Portal;

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogTitle,
  DialogDescription,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogSheet,
};
