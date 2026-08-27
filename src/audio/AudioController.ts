export type AudioCue = 'confirm' | 'navigate' | 'denied' | 'toggle' | 'send' | 'capture' | 'loss' | 'victory' | 'defeat';

interface CueConfig {
  source: string;
  volume: number;
  rate?: number;
  cooldownMs: number;
  voices: number;
}

const STORAGE_KEY = 'hexfront:sound-enabled';
const AUDIO_ROOT = `${import.meta.env.BASE_URL}assets/audio/`;
const CUES: Record<AudioCue, CueConfig> = {
  confirm: { source:'ui-confirm.mp3', volume:.46, cooldownMs:120, voices:1 },
  navigate: { source:'ui-navigate.mp3', volume:.30, cooldownMs:70, voices:2 },
  denied: { source:'ui-denied.mp3', volume:.38, cooldownMs:120, voices:1 },
  toggle: { source:'ui-toggle.mp3', volume:.34, cooldownMs:100, voices:1 },
  send: { source:'send.mp3', volume:.44, rate:.96, cooldownMs:45, voices:3 },
  capture: { source:'capture.mp3', volume:.38, rate:.94, cooldownMs:80, voices:2 },
  loss: { source:'ui-denied.mp3', volume:.31, rate:.78, cooldownMs:120, voices:1 },
  victory: { source:'result-victory.ogg', volume:.54, cooldownMs:500, voices:1 },
  defeat: { source:'result-defeat.ogg', volume:.48, cooldownMs:500, voices:1 },
};

export class AudioController {
  enabled = this.loadEnabled();
  activated = false;
  private context: AudioContext | null = null;
  private readonly pools = new Map<AudioCue, HTMLAudioElement[]>();
  private readonly cursors = new Map<AudioCue, number>();
  private readonly lastPlayed = new Map<AudioCue, number>();
  private lastBeepAt = 0;

  constructor() {
    for (const [cue, config] of Object.entries(CUES) as Array<[AudioCue, CueConfig]>) {
      const pool = Array.from({ length:config.voices }, () => {
        const audio = new Audio(`${AUDIO_ROOT}${config.source}`);
        audio.preload = 'auto';
        return audio;
      });
      this.pools.set(cue, pool);
    }
  }

  activate(): void {
    this.activated = true;
    if (this.context?.state === 'suspended') void this.context.resume();
  }

  toggle(): boolean {
    this.activated = true;
    if (this.enabled) this.play('toggle');
    this.enabled = !this.enabled;
    this.saveEnabled();
    if (this.enabled) this.play('toggle');
    return this.enabled;
  }

  play(cue: AudioCue): void {
    if (!this.enabled || !this.activated) return;
    const config = CUES[cue];
    const now = performance.now();
    if (now - (this.lastPlayed.get(cue) ?? -Infinity) < config.cooldownMs) return;
    this.lastPlayed.set(cue, now);
    const pool = this.pools.get(cue);
    if (!pool?.length) return;
    const idle = pool.find((audio) => audio.paused || audio.ended);
    const cursor = this.cursors.get(cue) ?? 0;
    const audio = idle ?? pool[cursor % pool.length];
    this.cursors.set(cue, (cursor + 1) % pool.length);
    if (!audio.paused) audio.pause();
    audio.currentTime = 0;
    audio.volume = config.volume;
    audio.playbackRate = config.rate ?? 1;
    void audio.play().catch(() => undefined);
  }

  beep(frequency: number, duration = .05, volume = .04): void {
    if (!this.enabled || !this.activated) return;
    const now = performance.now();
    if (now - this.lastBeepAt < 32) return;
    this.lastBeepAt = now;
    try { this.context ??= new AudioContext(); } catch { return; }
    if (this.context.state === 'suspended') void this.context.resume();
    const oscillator = this.context.createOscillator(); const gain = this.context.createGain();
    oscillator.type = 'triangle'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, this.context.currentTime + duration);
    oscillator.connect(gain).connect(this.context.destination); oscillator.start(); oscillator.stop(this.context.currentTime + duration);
  }

  private loadEnabled(): boolean {
    try { return localStorage.getItem(STORAGE_KEY) !== 'off'; } catch { return true; }
  }

  private saveEnabled(): void {
    try { localStorage.setItem(STORAGE_KEY, this.enabled ? 'on' : 'off'); } catch { /* Keep the session setting. */ }
  }
}
