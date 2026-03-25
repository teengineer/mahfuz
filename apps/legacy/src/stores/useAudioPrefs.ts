import { createPreferenceStore } from "~/lib/create-preference-store";

export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;
export type RepeatMode = "none" | "verse" | "surah";

export const useAudioPrefs = createPreferenceStore("mahfuz-audio-prefs", {
  reciterId: 7 as number,
  speed: 1 as PlaybackSpeed,
  volume: 1 as number,
  isMuted: false,
  repeatMode: "none" as RepeatMode,
});
