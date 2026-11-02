import assert from 'node:assert/strict';
import test from 'node:test';
import { KongregateStats, type KongregateHost } from '../src/platform/KongregateStats';

test('Kongregate statistics are a no-op outside the Kongregate host', () => {
  let loads = 0;
  const host: KongregateHost = {
    location: { hostname: 'emfau88.github.io' },
    kongregateAPI: { loadAPI: () => { loads += 1; }, getAPI: () => ({ stats: { submit: () => undefined } }) },
  };
  new KongregateStats(host).initialize(() => assert.fail('A non-Kongregate page must not initialize the API.'));
  assert.equal(loads, 0);
});

test('Kongregate statistics initialize early and submit only valid integer values', () => {
  const submissions: Array<[string, number]> = [];
  let ready = 0;
  const api = { stats: { submit: (name: string, value: number) => submissions.push([name, value]) } };
  const host: KongregateHost = {
    location: { hostname: 'www.kongregate.com' },
    kongregateAPI: { loadAPI: (callback) => callback(), getAPI: () => api },
  };
  const stats = new KongregateStats(host);
  stats.initialize(() => { ready += 1; });
  stats.submit('missions_completed', 4.9);
  stats.submit('final_mission_best_ms', -5);
  stats.submit('campaign_complete', Number.POSITIVE_INFINITY);
  assert.equal(ready, 1);
  assert.deepEqual(submissions, [['initialized', 1], ['missions_completed', 4]]);
});

test('the actual Kongregate game iframe initializes and resubmits saved progress', () => {
  const submissions: Array<[string, number]> = [];
  const api = { stats: { submit: (name: string, value: number) => submissions.push([name, value]) } };
  const stats = new KongregateStats({
    location: { hostname: 'game324999.konggames.com' },
    kongregateAPI: { loadAPI: callback => callback(), getAPI: () => api },
  });
  stats.initialize(() => stats.submit('missions_completed', 9));
  assert.deepEqual(submissions, [['initialized', 1], ['missions_completed', 9]]);
});

function scriptHost(hostname = 'game324999.konggames.com', referrer = '') {
  const listeners = new Map<string, () => void>();
  const scripts: Array<{ src: string; id: string; async: boolean }> = [];
  const script = { src: '', id: '', async: false, addEventListener: (type: string, callback: () => void) => listeners.set(type, callback) };
  const document = {
    referrer,
    head: { appendChild: () => scripts.push(script) },
    getElementById: () => null,
    createElement: () => script,
  } as unknown as Document;
  const host: KongregateHost = { location: { hostname }, document };
  return { host, scripts, fire: (type: string) => listeners.get(type)?.() };
}

test('missing SDK loads asynchronously once and submits the latest progress when ready', () => {
  const { host, scripts, fire } = scriptHost();
  const submissions: Array<[string, number]> = [];
  let completed = 2, loads = 0;
  const stats = new KongregateStats(host);
  const submitProgress = () => stats.submit('missions_completed', completed);
  stats.initialize(submitProgress); stats.initialize(submitProgress);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, 'https://cdn1.kongregate.com/javascripts/kongregate_api.js');
  assert.equal(scripts[0].async, true);
  completed = 3;
  host.kongregateAPI = {
    loadAPI: callback => { loads++; callback(); },
    getAPI: () => ({ stats: { submit: (name, value) => submissions.push([name, value]) } }),
  };
  fire('load');
  assert.equal(loads, 1);
  assert.deepEqual(submissions, [['initialized', 1], ['missions_completed', 3]]);
});

test('SDK failures leave initialization nonfatal and observable', () => {
  const { host, fire } = scriptHost();
  const stats = new KongregateStats(host);
  stats.initialize(() => assert.fail('a failed SDK must not report ready'));
  assert.doesNotThrow(() => fire('error'));
  assert.equal(stats.status, 'unavailable');
  assert.doesNotThrow(() => stats.submit('missions_completed', 3));
});

test('login after guest play resubmits current progress without reinitializing the SDK', () => {
  const submissions: Array<[string, number]> = [];
  let onLogin = () => {}, completed = 0, loads = 0;
  const api = {
    stats: { submit: (name: string, value: number) => submissions.push([name, value]) },
    services: { addEventListener: (_type: string, callback: () => void) => { onLogin = callback; } },
  };
  const stats = new KongregateStats({ location: { hostname: 'game324999.konggames.com' }, kongregateAPI: {
    loadAPI: callback => { loads++; callback(); }, getAPI: () => api,
  } });
  stats.initialize(() => stats.submit('missions_completed', completed));
  completed = 2; onLogin();
  assert.equal(loads, 1);
  assert.deepEqual(submissions, [['initialized', 1], ['missions_completed', 0], ['initialized', 1], ['missions_completed', 2]]);
});

test('direct local/other-portal visits stay isolated; an external Kongregate embed is recognized', () => {
  for (const hostname of ['127.0.0.1', 'emfau88.github.io', 'y8.com', 'kongregate.com.example.org', 'notkonggames.com']) {
    const { host, scripts } = scriptHost(hostname);
    new KongregateStats(host).initialize(() => assert.fail('not on Kongregate'));
    assert.equal(scripts.length, 0, hostname);
  }
  const { host, scripts } = scriptHost('emfau88.github.io', 'https://www.kongregate.com/en/games/emfau/hexfront/embed');
  host.self = {}; host.top = host.self;
  new KongregateStats(host).initialize(() => {});
  assert.equal(scripts.length, 0, 'following an ordinary link out of Kongregate must not initialize its SDK');
  host.top = {};
  new KongregateStats(host).initialize(() => {});
  assert.equal(scripts.length, 1);
});

test('invalid or zero best times never poison a minimum leaderboard', () => {
  const submissions: Array<[string, number]> = [];
  const stats = new KongregateStats({ location: { hostname: 'www.kongregate.com' }, kongregate: {
    stats: { submit: (name, value) => submissions.push([name, value]) },
  } });
  stats.initialize(() => {});
  for (const value of [-5, 0, .1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) stats.submit('final_mission_best_ms', value);
  stats.submit('final_mission_best_ms', 75001);
  assert.deepEqual(submissions, [['initialized', 1], ['final_mission_best_ms', 75001]]);
});
