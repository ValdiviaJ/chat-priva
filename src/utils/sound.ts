// Web Audio API based notification sound synthesizer

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    this.muted = localStorage.getItem('quickchat_sound_muted') === 'true';
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem('quickchat_sound_muted', String(this.muted));
    return this.muted;
  }

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public playIncomingMessageSound() {
    if (this.muted) return;

    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Note 1 (Harmonic pleasant chime)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);

      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2 (Upper bell overtone)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.08); // D6
      osc2.frequency.exponentialRampToValueAtTime(1318.51, now + 0.22); // E6

      gain2.gain.setValueAtTime(0.08, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);

      osc2.start(now + 0.08);
      osc2.stop(now + 0.45);
    } catch {
      // Browsers may restrict audio before user gesture
    }
  }
}

export const soundManager = new SoundManager();
