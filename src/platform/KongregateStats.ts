export type KongregateStatistic = 'initialized' | 'missions_completed' | 'campaign_complete' | 'final_mission_best_ms';

interface KongregateApi {
  stats: { submit: (name: KongregateStatistic, value: number) => void };
  services?: { addEventListener: (type: 'login', listener: () => void) => void };
}

interface KongregateApiLoader {
  loadAPI: (callback: () => void) => void;
  getAPI: () => KongregateApi;
}

export interface KongregateHost {
  location: { hostname: string };
  document?: Document;
  self?: unknown;
  top?: unknown;
  kongregate?: KongregateApi;
  kongregateAPI?: KongregateApiLoader;
}

/**
 * Keeps the Kongregate integration isolated from the browser build. It is a
 * deliberate no-op outside Kongregate's pages, game CDN, and embedded games.
 */
export class KongregateStats {
  private api: KongregateApi | null = null;
  private started = false;
  private connection: 'inactive' | 'loading' | 'ready' | 'unavailable' = 'inactive';

  /** API readiness only; stats.submit does not acknowledge server acceptance. */
  get status() { return this.connection; }

  constructor(private readonly host: KongregateHost | null = typeof window === 'undefined' ? null : window as unknown as KongregateHost) {}

  initialize(onReady: () => void): void {
    if (!this.isKongregateHost() || this.started) return;
    this.started = true;
    this.connection = 'loading';
    if (this.host?.kongregate?.stats) {
      this.activate(this.host.kongregate, onReady);
      return;
    }
    if (this.host?.kongregateAPI) {
      this.connect(onReady);
      return;
    }
    const document = this.host?.document;
    if (!document) { this.unavailable('SDK document unavailable'); return; }
    try {
      const existing = document.getElementById('hexfront-kongregate-sdk');
      const script = existing ?? document.createElement('script');
      script.addEventListener('load', () => this.connect(onReady), { once: true });
      script.addEventListener('error', () => this.unavailable('SDK download failed'), { once: true });
      if (!existing) {
        const sdk = script as HTMLScriptElement;
        sdk.id = 'hexfront-kongregate-sdk';
        sdk.src = 'https://cdn1.kongregate.com/javascripts/kongregate_api.js';
        sdk.async = true;
        document.head.appendChild(sdk);
      }
    } catch { this.unavailable('SDK could not be loaded'); }
  }

  private connect(onReady: () => void): void {
    const loader = this.host?.kongregateAPI;
    if (!loader) { this.unavailable('SDK loader unavailable'); return; }
    try {
      loader.loadAPI(() => {
        try { this.activate(loader.getAPI(), onReady); }
        catch { this.unavailable('API initialization failed'); }
      });
    } catch { this.unavailable('API initialization failed'); }
  }

  submit(name: KongregateStatistic, value: number): void {
    const normalized = Math.floor(value);
    if (!Number.isSafeInteger(normalized) || normalized < 0) return;
    if (name === 'final_mission_best_ms' && normalized === 0) return;
    try { this.api?.stats.submit(name, normalized); }
    catch { console.warn(`HEXFRONT: Kongregate statistic ${name} could not be submitted.`); }
  }

  private activate(api: KongregateApi, onReady: () => void): void {
    if (this.api) return;
    if (typeof api?.stats?.submit !== 'function') { this.unavailable('Statistics API unavailable'); return; }
    this.api = api;
    this.connection = 'ready';
    this.submit('initialized', 1);
    onReady();
    try {
      api.services?.addEventListener('login', () => {
        this.submit('initialized', 1);
        onReady();
      });
    } catch { /* Login support is optional; submissions after victories still work. */ }
  }

  private unavailable(reason: string): void {
    this.connection = 'unavailable';
    console.warn(`HEXFRONT: Kongregate statistics unavailable (${reason}). Gameplay remains available.`);
  }

  private isKongregateHost(): boolean {
    const hostname = this.host?.location.hostname.toLowerCase() ?? '';
    const isKongregate = (name: string) => name === 'kongregate.com' || name.endsWith('.kongregate.com');
    if (isKongregate(hostname) || hostname === 'konggames.com' || hostname.endsWith('.konggames.com')) return true;
    // A self-hosted game can also run inside Kongregate's cross-origin iframe.
    // Do not access window.parent; its origin is intentionally isolated.
    if (!this.host?.self || !this.host.top || this.host.self === this.host.top) return false;
    try { return isKongregate(new URL(this.host?.document?.referrer ?? '').hostname); }
    catch { return false; }
  }
}
