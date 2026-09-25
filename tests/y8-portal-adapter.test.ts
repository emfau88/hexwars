import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { Y8PortalAdapter, type Y8Host } from '../src/platform/Y8PortalAdapter';

test('Y8 adapter initializes once and pauses only while a real ad is displayed', async () => {
  let readyListener: (() => void) | null = null;
  let initConfig: unknown;
  let adConfig: unknown;
  let adOptions: Record<string, unknown> | null = null;
  let adRequests = 0;
  const sdk = {
    init(app: unknown, ads: unknown) { initConfig = app; adConfig = ads; },
    onAuth() {},
    showAd(options: Record<string, unknown>) {
      adRequests += 1;
      adOptions = options;
      return Promise.resolve();
    },
  };
  const host = {
    y8: {
      sdk: () => sdk,
      emitReadyEvent: () => readyListener?.(),
    },
    addEventListener(_type: 'y8sdk.ready', listener: () => void) { readyListener = listener; },
  } as unknown as Y8Host;
  let pauses = 0; let resumes = 0;
  const adapter = new Y8PortalAdapter(host);
  adapter.initialize({ pauseForAd:() => { pauses += 1; }, resumeAfterAd:() => { resumes += 1; } });

  assert.deepEqual(initConfig, { appId:'6ab6e6d4bed188670528ed6a', autoLogin:true });
  const configuredAds = adConfig as { gameId: string; preloadAdBreaks: string; sound: string; onReady: () => void };
  assert.equal(configuredAds.gameId, '284525');
  assert.equal(configuredAds.preloadAdBreaks, 'on');
  assert.equal(configuredAds.sound, 'on');
  assert.equal(typeof configuredAds.onReady, 'function');

  adapter.missionCompleted({ result:'victory', levelIndex:4, elapsedSeconds:60 });
  adapter.missionCompleted({ result:'defeat', levelIndex:4, elapsedSeconds:61 });
  assert.equal(adRequests, 1, 'an in-flight break prevents duplicate ad requests');
  const requestedAd = adOptions as unknown as { type: string; name: string; beforeAd: () => void; afterAd: () => void };
  assert.equal(requestedAd.type, 'next');
  assert.equal(requestedAd.name, 'level-complete');
  assert.equal(pauses, 0, 'requesting an ad does not pause pre-emptively');

  requestedAd.beforeAd();
  assert.equal(pauses, 1);
  requestedAd.afterAd();
  assert.equal(resumes, 1);
  await Promise.resolve();
  await Promise.resolve();
});

test('standard and Kongregate entry points contain no Y8 credentials or SDK URL', async () => {
  const paths = ['index.html', 'src/main.ts', 'vite.config.ts', 'scripts/package-kongregate.mjs'];
  const combined = (await Promise.all(paths.map((path) => readFile(path, 'utf8')))).join('\n');
  for (const marker of ['cdn.y8.com', '6ab6e6d4bed188670528ed6a', '284525', 'Y8PortalAdapter']) {
    assert.equal(combined.includes(marker), false, `${marker} must remain exclusive to the Y8 build`);
  }
});
