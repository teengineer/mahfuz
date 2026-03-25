import { interpolate } from "./i18n-utils";

interface RelativeTimeStrings {
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  yesterday: string;
  daysAgo: string;
}

export function formatRelativeTime(
  timestamp: number,
  strings: RelativeTimeStrings,
): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return strings.justNow;
  if (minutes < 60) return interpolate(strings.minutesAgo, { n: minutes });
  if (hours < 24) return interpolate(strings.hoursAgo, { n: hours });
  if (days === 1) return strings.yesterday;
  return interpolate(strings.daysAgo, { n: days });
}
