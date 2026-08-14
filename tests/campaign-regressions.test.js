import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const level1 = read('../src/levels/level01.ts');
const level2 = read('../src/levels/level02.ts');
const level9 = read('../src/levels/level09.ts');
const builder = read('../src/levels/buildLevel.ts');
const ai = read('../src/systems/AISystem.ts');
const victory = read('../src/systems/VictorySystem.ts');
const input = read('../src/input/InputController.ts');
const state = read('../src/core/GameState.ts');
const main = read('../src/main.ts');
const app = read('../src/app/HexfrontApp.ts');
const landscape = read('../src/rendering/LandscapeRenderer.ts');
const atlas = read('../src/ui/CampaignAtlas.ts');
const vite = read('../vite.config.ts');
const styles = read('../src/styles.css');
const atlasStyles = read('../src/campaign-atlas.css');

test('campaign runtime is split into typed modules without ts-nocheck', () => {
  for (const source of [level1, builder, ai, victory, input, state, main]) assert.doesNotMatch(source, /@ts-nocheck/);
  assert.match(main, /HexfrontApp/);
  assert.doesNotMatch(main, /CampaignGame/);
});

test('Level 1 teaches 50 percent and Level 2 unlocks 100 percent', () => {
  assert.match(level1, /sendest jeweils 50 %|sendest du jeweils 50 %/);
  assert.match(level1, /features: \{ all: false, group: false, relay: false \}/);
  assert.match(level2, /100 % wird freigeschaltet/);
  assert.match(level2, /features:\{all:true,group:false,relay:false\}/);
});

test('Level 9 mirrors deterministic neutral strength', () => {
  assert.match(level9, /mirrorNeutral:true/);
  assert.match(builder, /level\.mirrorNeutral && mirroredUnits\.has\(mirrorKey\)/);
  assert.match(builder, /mirroredUnits\.set\(cellKey\(hex\), hex\.units\)/);
});

test('AI can move rear reserves toward the active front', () => {
  assert.match(ai, /function frontDistances/);
  assert.match(ai, /type: 'logistics'/);
  assert.match(ai, /context\.elapsed >= 75/);
});

test('victory is tied to the correct base coordinates', () => {
  assert.match(victory, /cellKey\(ENEMY_BASE\).*Owner\.Player/);
  assert.match(victory, /cellKey\(PLAYER_BASE\).*Owner\.Enemy/);
});

test('pointer input is isolated and executes a real send path', () => {
  assert.match(input, /addEventListener\('pointerdown'/);
  assert.match(input, /addEventListener\('pointermove'/);
  assert.match(input, /addEventListener\('pointerup'/);
  assert.match(input, /this\.state\.send\(/);
});

test('mobile portrait keeps the full terrain atlas ahead of the dossier', () => {
  assert.match(atlasStyles, /\.campaignJourney \{ order:1;/);
  assert.match(atlasStyles, /#mapCenter \{ order:2;/);
  assert.match(atlas, /cells\(7, 4, 31/);
  assert.match(atlas, /\['6,3',9\]/);
  assert.doesNotMatch(atlas, /campaignPath/);
});

test('Level 1 landscape assets stay within the mobile budget', () => {
  for (const name of ['level1-tree.webp', 'level1-conifer-v2.webp', 'level1-bush.webp', 'level1-water.webp', 'level1-shore.webp']) {
    const asset = new URL(`../public/assets/${name}`, import.meta.url);
    assert.ok(statSync(asset).size < 250_000, `${name} stays below 250 KB`);
  }
});

test('production assets support GitHub Pages sub-path hosting', () => {
  assert.match(vite, /base: '\.\/'/);
  assert.match(landscape, /import\.meta\.env\.BASE_URL/);
  assert.doesNotMatch(landscape, /load\('\/assets\//);
});

test('complete decor V2 runtime set stays within the mobile budget', () => {
  const directory = new URL('../public/assets/decor-v2/', import.meta.url);
  const assets = readdirSync(directory).filter((name) => name.endsWith('.webp'));
  assert.equal(assets.length, 16);
  for (const name of assets) {
    assert.ok(statSync(new URL(name, directory)).size < 100_000, `${name} stays below 100 KB`);
  }
  assert.match(landscape, /visualVariant === 'decor-v2' \? hash01\(hex\.col \+ 37, hex\.row \+ 53, seed \+ 1709\) : baseQ/);
  assert.match(app, /requestedVisual[\s\S]*: 'decor-v2'/);
});
