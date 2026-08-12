export class AudioController {
  enabled = true;
  activated = false;
  private context: AudioContext | null = null;

  activate(): void { this.activated = true; }

  toggle(): boolean {
    this.activated = true; this.enabled = !this.enabled;
    if (this.enabled) this.beep(420, .05, .04);
    return this.enabled;
  }

  beep(frequency: number, duration = .05, volume = .04): void {
    if (!this.enabled || !this.activated) return;
    try { this.context ??= new AudioContext(); } catch { return; }
    const oscillator = this.context.createOscillator(); const gain = this.context.createGain();
    oscillator.type = 'triangle'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, this.context.currentTime + duration);
    oscillator.connect(gain).connect(this.context.destination); oscillator.start(); oscillator.stop(this.context.currentTime + duration);
  }
}

