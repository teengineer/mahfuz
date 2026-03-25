export function interpolate(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    String(params[key] ?? `{${key}}`),
  );
}

/**
 * Resolve an i18n key from a locale object.
 * Tries flat key first (e.g. obj["s1.l1.title"]),
 * then falls back to dot-notation walking (e.g. obj.stages.letters.title).
 */
export function resolveNestedKey(obj: Record<string, any>, key: string): string | undefined {
  // 1) Flat key lookup
  const flat = obj[key];
  if (typeof flat === "string") return flat;

  // 2) Dot-notation walk
  const parts = key.split(".");
  if (parts.length <= 1) return undefined;
  let current: any = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = current[part];
  }
  return typeof current === "string" ? current : undefined;
}
