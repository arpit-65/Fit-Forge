/**
 * Client-Side Voice Assistant for Live Workout Coaching
 * Uses Web Speech API with priority queueing & debouncing.
 */

export class WorkoutVoiceCoach {
  private isMuted: boolean = false;
  private lastSpokenText: string = "";
  private lastSpokenTime: number = 0;
  private minIntervalMs: number = 2200; // minimum gap between voice cues

  constructor(isMuted = false) {
    this.isMuted = isMuted;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  speak(text: string, force = false) {
    if (this.isMuted || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const now = Date.now();
    // Prevent duplicate cue spam within minIntervalMs
    if (!force && text === this.lastSpokenText && now - this.lastSpokenTime < this.minIntervalMs) {
      return;
    }
    if (!force && now - this.lastSpokenTime < 1400) {
      return;
    }

    try {
      window.speechSynthesis.cancel(); // cut off previous cue for instant feedback
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.15; // Slightly faster for athletic cues
      utterance.pitch = 1.0;
      utterance.volume = 0.9;

      // Select natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha"))
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      this.lastSpokenText = text;
      this.lastSpokenTime = now;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("[Voice Coach] Failed to synthesize speech:", e);
    }
  }
}
