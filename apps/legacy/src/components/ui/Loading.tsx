export function Loading({ text = "Yükleniyor..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-28">
      <div className="mb-4 h-7 w-7 animate-spin rounded-full border-[2.5px] border-[var(--theme-divider)] border-t-primary-600" />
      <p className="text-[13px] text-[var(--theme-text-tertiary)]">{text}</p>
    </div>
  );
}
