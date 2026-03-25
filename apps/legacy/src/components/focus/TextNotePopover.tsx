import { useState, useRef, useEffect } from "react";

interface TextNotePopoverProps {
  verseKey: string;
  content: string;
  color: string;
  position: { x: number; y: number };
  onSave: (content: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

/**
 * Popover for creating/editing text notes on verses.
 * Appears near the note indicator.
 */
export function TextNotePopover({
  verseKey,
  content: initialContent,
  color,
  position,
  onSave,
  onDelete,
  onClose,
}: TextNotePopoverProps) {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isNew = !initialContent;

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = () => {
    if (content.trim()) {
      onSave(content.trim());
    }
    onClose();
  };

  // Position the popover near the indicator, clamped to viewport
  const style: React.CSSProperties = {
    left: Math.min(position.x, window.innerWidth - 280),
    top: Math.min(position.y + 10, window.innerHeight - 200),
  };

  return (
    <div
      className="fixed inset-0 z-40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-scale-in absolute w-[260px] rounded-xl bg-[var(--theme-bg-elevated)] shadow-[var(--shadow-modal)]"
        style={style}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-3 py-2">
          <div className="flex items-center gap-2">
            <span
              className="block h-3 w-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[12px] font-medium text-[var(--theme-text-tertiary)]">
              {verseKey}
            </span>
          </div>
          {!isNew && (
            <button
              type="button"
              onClick={onDelete}
              className="text-[11px] text-red-500 hover:text-red-600"
            >
              Sil
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Not ekle..."
            className="h-24 w-full resize-none rounded-lg bg-[var(--theme-input-bg)] p-2 text-[13px] text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-text-quaternary)]"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t border-[var(--theme-border)] px-3 py-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!content.trim()}
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
