import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { GameMonetizePortalAdapter, type GameMonetizeHost } from '../src/platform/GameMonetizePortalAdapter';

class MemoryStorage {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

test('GameMonetize requests exactly one ad on the first mission start of a browser session', () => {
  const storage = new MemoryStorage();
  const host: GameMonetizeHost = { sessionStorage:storage };
  let pauses = 0; let resumes = 0; let ads = 0;
  const adapter = new GameMonetizePortalAdapter(host);
  adapter.initialize({ pauseForAd:() => { pauses += 1; }, resumeAfterAd:() => { resumes += 1; } });

  assert.equal(host.SDK_OPTIONS?.gameId, 'cql4alxysem4yqiq21mcixa8xxmn7pok');
  adapter.missionStarted(0);
  assert.equal(ads, 0, 'a mission may begin normally while the SDK is still loading');

  host.sdk = { showBanner:() => { ads += 1; } };
  host.SDK_OPTIONS?.onEvent({ name:'SDK_READY' });
  assert.equal(ads, 1);
  adapter.missionStarted(1);
  adapter.missionCompleted({ result:'victory', levelIndex:0, elapsedSeconds:70 });
  adapter.missionCompleted({ result:'defeat', levelIndex:1, elapsedSeconds:30 });
  assert.equal(ads, 1, 'later starts and mission results do not request more ads');

  host.SDK_OPTIONS?.onEvent({ name:'SDK_GAME_PAUSE' });
  host.SDK_OPTIONS?.onEvent({ name:'SDK_GAME_PAUSE' });
  assert.equal(pauses, 1);
  host.SDK_OPTIONS?.onEvent({ name:'SDK_GAME_START' });
  assert.equal(resumes, 1);

  const afterReload = new GameMonetizePortalAdapter(host);
  afterReload.initialize({ pauseForAd:() => undefined, resumeAfterAd:() => undefined });
  afterReload.missionStarted(0);
  assert.equal(ads, 1, 'sessionStorage suppresses another ad after a reload');
});

test('GameMonetize identifiers remain absent from Main, Kongregate and Y8 entries', async () => {
  const paths = [
    'index.html', 'src/main.ts', 'vite.config.ts', 'scripts/package-kongregate.mjs',
    'src/y8-main.ts', 'vite.y8.config.ts', 'scripts/package-y8.mjs',
  ];
  const combined = (await Promise.all(paths.map((path) => readFile(path, 'utf8')))).join('\n');
  for (const marker of ['api.gamemonetize.com', 'cql4alxysem4yqiq21mcixa8xxmn7pok', 'GameMonetizePortalAdapter']) {
    assert.equal(combined.includes(marker), false, `${marker} must remain exclusive to the GameMonetize build`);
  }
});
