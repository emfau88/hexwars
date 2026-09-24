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
  assert.deepEqual(submissions, [['initialized', 1], ['missions_completed', 4], ['final_mission_best_ms', 0]]);
});
