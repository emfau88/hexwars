export type KongregateStatistic = 'initialized' | 'missions_completed' | 'campaign_complete' | 'final_mission_best_ms';

interface KongregateApi {
  stats: { submit: (name: KongregateStatistic, value: number) => void };
}

interface KongregateApiLoader {
  loadAPI: (callback: () => void) => void;
  getAPI: () => KongregateApi;
}

export interface KongregateHost {
  location: { hostname: string };
  kongregate?: KongregateApi;
  kongregateAPI?: KongregateApiLoader;
}

/**
 * Keeps the Kongregate integration isolated from the browser build. It is a
 * deliberate no-op on GitHub Pages, local previews, and every non-Kongregate host.
 */
export class KongregateStats {
  private api: KongregateApi | null = null;

  constructor(private readonly host: KongregateHost | null = typeof window === 'undefined' ? null : window as unknown as KongregateHost) {}

  initialize(onReady: () => void): void {
    if (!this.isKongregateHost() || this.api) return;
    if (this.host?.kongregate?.stats) {
      this.activate(this.host.kongregate, onReady);
      return;
    }
    const loader = this.host?.kongregateAPI;
    if (!loader) return;
    try {
      loader.loadAPI(() => {
        try { this.activate(loader.getAPI(), onReady); }
        catch { /* A portal/API failure must never prevent the game from running. */ }
      });
    } catch { /* A portal/API failure must never prevent the game from running. */ }
  }

  submit(name: KongregateStatistic, value: number): void {
    const normalized = Math.max(0, Math.floor(value));
    if (!Number.isSafeInteger(normalized)) return;
    try { this.api?.stats.submit(name, normalized); }
    catch { /* Statistics are optional telemetry, not gameplay. */ }
  }

  private activate(api: KongregateApi, onReady: () => void): void {
    if (!api?.stats?.submit || this.api) return;
    this.api = api;
    this.submit('initialized', 1);
    onReady();
  }

  private isKongregateHost(): boolean {
    const hostname = this.host?.location.hostname.toLowerCase() ?? '';
    return hostname === 'kongregate.com' || hostname.endsWith('.kongregate.com');
  }
}
