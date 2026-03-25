type SoundType = "tap" | "correct" | "incorrect" | "levelUp" | "badge" | "chest" | "star";

// Frequencies and durations for procedural sounds (no audio files needed)
const SOUND_DEFS: Record<SoundType, { notes: number[]; durations: number[]; type: OscillatorType; gain: number }> = {
  tap: { notes: [800], durations: [60], type: "sine", gain: 0.15 },
  correct: { notes: [523, 659, 784], durations: [100, 100, 200], type: "sine", gain: 0.2 },
  incorrect: { notes: [300, 250], durations: [120, 180], type: "triangle", gain: 0.15 },
  levelUp: { notes: [523, 587, 659, 784, 880, 1047], durations: [80, 80, 80, 80, 80, 300], type: "sine", gain: 0.25 },
  badge: { notes: [659, 784, 1047, 1319], durations: [100, 100, 100, 300], type: "sine", gain: 0.2 },
  chest: { notes: [400, 500, 600, 800, 1000], durations: [60, 60, 60, 60, 250], type: "triangle", gain: 0.2 },
  star: { notes: [880, 1100], durations: [80, 150], type: "sine", gain: 0.15 },
};

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

export function playSound(sound: SoundType) {
  const ctx = getCtx();
  if (!ctx) return;

  // Resume if suspended (autoplay policy)
  if (ctx.state === "suspended") ctx.resume();

  const def = SOUND_DEFS[sound];
  let time = ctx.currentTime;

  for (let i = 0; i < def.notes.length; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = def.type;
    osc.frequency.value = def.notes[i];
    gain.gain.value = def.gain;
    // Fade out
    const dur = def.durations[i] / 1000;
    gain.gain.setValueAtTime(def.gain, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + dur);
    time += dur * 0.85; // Slight overlap for smoothness
  }
}

// React hook for easy usage
import { useCallback } from "react";

export function useKidsSound() {
  const tap = useCallback(() => playSound("tap"), []);
  const correct = useCallback(() => playSound("correct"), []);
  const incorrect = useCallback(() => playSound("incorrect"), []);
  const levelUp = useCallback(() => playSound("levelUp"), []);
  const badge = useCallback(() => playSound("badge"), []);
  const chest = useCallback(() => playSound("chest"), []);
  const star = useCallback(() => playSound("star"), []);

  return { tap, correct, incorrect, levelUp, badge, chest, star, playSound };
}
