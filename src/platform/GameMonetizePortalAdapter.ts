import type { PortalAdapter, PortalMissionResult, PortalRuntime } from './PortalAdapter';

const GAME_ID = 'cql4alxysem4yqiq21mcixa8xxmn7pok';
const SDK_URL = 'https://api.gamemonetize.com/sdk.js';
const SESSION_AD_KEY = 'hexfront:gamemonetize:first-mission-ad';

type GameMonetizeEventName = 'SDK_GAME_PAUSE' | 'SDK_GAME_START' | 'SDK_READY';

interface GameMonetizeSdk {
  showBanner?: () => void;
}

interface GameMonetizeOptions {
  gameId: string;
  onEvent: (event: { name?: GameMonetizeEventName | string }) => void;
}

export interface GameMonetizeHost {
  SDK_OPTIONS?: GameMonetizeOptions;
  sdk?: GameMonetizeSdk;
  document?: Document;
  sessionStorage?: Pick<Storage, 'getItem' | 'setItem'>;
}

/** GameMonetize-only integration. It is imported exclusively by the dedicated portal entry point. */
export class GameMonetizePortalAdapter implements PortalAdapter {
  private runtime: PortalRuntime | null = null;
  private pendingFirstMissionAd = false;
  private adRequested = false;
  private adPaused = false;

  constructor(private readonly host: GameMonetizeHost | null = typeof window === 'undefined' ? null : window as unknown as GameMonetizeHost) {
    this.adRequested = this.wasRequestedThisSession();
  }

  initialize(runtime: PortalRuntime): void {
    this.runtime = runtime;
    if (!this.host) return;
    this.host.SDK_OPTIONS = { gameId:GAME_ID, onEvent:this.onSdkEvent };
    this.injectSdk();
  }

  missionStarted(_levelIndex: number): void {
    if (this.adRequested) return;
    this.pendingFirstMissionAd = true;
    this.requestFirstMissionAd();
  }

  missionCompleted(_result: PortalMissionResult): void {
    // Intentionally empty: HEXFRONT requests no result-screen ads on GameMonetize.
  }

  private readonly onSdkEvent = (event: { name?: GameMonetizeEventName | string }): void => {
    if (event.name === 'SDK_GAME_PAUSE') this.pauseForAd();
    if (event.name === 'SDK_GAME_START') this.resumeAfterAd();
    if (event.name === 'SDK_READY') this.requestFirstMissionAd();
  };

  private requestFirstMissionAd(): void {
    if (!this.pendingFirstMissionAd || this.adRequested) return;
    const showBanner = this.host?.sdk?.showBanner;
    if (typeof showBanner !== 'function') return;
    try {
      showBanner.call(this.host?.sdk);
      this.adRequested = true;
      this.pendingFirstMissionAd = false;
      this.markRequestedThisSession();
    } catch (error) {
      console.warn('GameMonetize ad could not start; continuing without an ad.', error);
    }
  }

  private injectSdk(): void {
    const document = this.host?.document;
    if (!document || document.getElementById('gamemonetize-sdk')) return;
    const script = document.createElement('script');
    script.id = 'gamemonetize-sdk';
    script.src = SDK_URL;
    script.async = true;
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript?.parentNode) firstScript.parentNode.insertBefore(script, firstScript);
    else document.head.append(script);
  }

  private pauseForAd(): void {
    if (this.adPaused) return;
    this.adPaused = true;
    this.runtime?.pauseForAd();
  }

  private resumeAfterAd(): void {
    if (!this.adPaused) return;
    this.adPaused = false;
    this.runtime?.resumeAfterAd();
  }

  private wasRequestedThisSession(): boolean {
    try { return this.host?.sessionStorage?.getItem(SESSION_AD_KEY) === '1'; }
    catch { return false; }
  }

  private markRequestedThisSession(): void {
    try { this.host?.sessionStorage?.setItem(SESSION_AD_KEY, '1'); }
    catch { /* Session persistence is optional; gameplay must continue. */ }
  }
}
