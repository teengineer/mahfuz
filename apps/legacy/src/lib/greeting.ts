import type { Messages } from "~/locales/tr";

export function getGreeting(t: Messages) {
  const h = new Date().getHours();
  if (h < 12) return t.continueReading.greetingMorning;
  if (h < 17) return t.continueReading.greetingAfternoon;
  return t.continueReading.greetingEvening;
}
