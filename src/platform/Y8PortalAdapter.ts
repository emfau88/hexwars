import type { PortalAdapter, PortalMissionResult, PortalRuntime } from './PortalAdapter';

const Y8_APP_ID = '6ab6e6d4bed188670528ed6a';
const Y8_GAME_ID = '284525';

interface Y8AdBreakInfo {
  breakStatus?: string;
}

interface Y8AdOptions {
  type: 'next';
  name: string;
  beforeAd: () => void;
  afterAd: () => void;
  adBreakDone: (info: Y8AdBreakInfo) => void;
}

interface Y8Sdk {
  init(
    appConfig: { appId: string; autoLogin: boolean },
    adConfig: { gameId: string; preloadAdBreaks: 'on'; sound: 'on'; onReady: () => void },
  ): void;
  onAuth(callback: (user: unknown, error?: unknown) => void): void;
  showAd(options: Y8AdOptions): Promise<unknown>;
}

interface Y8Namespace {
  sdk(): Y8Sdk;
  emitReadyEvent?: () => void;
}

export interface Y8Host {
  y8?: Y8Namespace;
  addEventListener(type: 'y8sdk.ready', listener: () => void, options: { once: true }): void;
}

/** Y8-only portal integration. This module is referenced exclusively by the Y8 entry point. */
export class Y8PortalAdapter implements PortalAdapter {
  private sdk: Y8Sdk | null = null;
  private runtime: PortalRuntime | null = null;
  private adInFlight = false;
  private adPaused = false;

  constructor(private readonly host: Y8Host | null = typeof window === 'undefined' ? null : window as unknown as Y8Host) {}

  initialize(runtime: PortalRuntime): void {
    this.runtime = runtime;
    if (!this.host) return;
    this.host.addEventListener('y8sdk.ready', this.onSdkReady, { once:true });
    this.host.y8?.emitReadyEvent?.();
  }

  missionCompleted(_result: PortalMissionResult): void {
    if (!this.sdk || this.adInFlight) return;
    this.adInFlight = true;
    try {
      const request = this.sdk.showAd({
        type:'next',
        name:'level-complete',
        beforeAd: this.pauseForAd,
        afterAd: this.resumeAfterAd,
        adBreakDone: () => undefined,
      });
      void Promise.resolve(request)
        .catch((error) => { console.warn('Y8 ad break failed.', error); this.resumeAfterAd(); })
        .finally(() => { this.adInFlight = false; });
    } catch (error) {
      console.warn('Y8 ad break could not start.', error);
      this.resumeAfterAd();
      this.adInFlight = false;
    }
  }

  private readonly onSdkReady = (): void => {
    if (this.sdk || !this.host?.y8) return;
    try {
      this.sdk = this.host.y8.sdk();
      this.sdk.init(
        { appId:Y8_APP_ID, autoLogin:true },
        { gameId:Y8_GAME_ID, preloadAdBreaks:'on', sound:'on', onReady:() => undefined },
      );
      this.sdk.onAuth((_user, error) => {
        if (error) console.warn('Y8 authentication is unavailable; continuing anonymously.', error);
      });
    } catch (error) {
      this.sdk = null;
      console.warn('Y8 SDK initialization failed; continuing without portal services.', error);
    }
  };

  private readonly pauseForAd = (): void => {
    if (this.adPaused) return;
    this.adPaused = true;
    this.runtime?.pauseForAd();
  };

  private readonly resumeAfterAd = (): void => {
    if (!this.adPaused) return;
    this.adPaused = false;
    this.runtime?.resumeAfterAd();
  };
}
