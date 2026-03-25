import { createPreferenceStore } from "~/lib/create-preference-store";

export const useAppUI = createPreferenceStore("mahfuz-app-ui", {
  sidebarCollapsed: false,
  hasSeenOnboarding: false,
  showLearnTab: true,
  showMemorizeTab: true,
  /** Selected learn level (0 = not yet chosen, 1-4 = level) */
  selectedLearnLevel: 0,
  /** Whether user has completed the level picker */
  hasPickedLearnLevel: false,
});
