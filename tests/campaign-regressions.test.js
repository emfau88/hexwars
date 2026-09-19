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
const audio = read('../src/audio/AudioController.ts');
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
  assert.match(styles, /attr\(data-unlock-label\)/);
});

test('Group send unlocks in Level 4 before the two-pass tactics mission', () => {
  const level3 = read('../src/levels/level03.ts');
  const level4 = read('../src/levels/level04.ts');
  const level5 = read('../src/levels/level05.ts');
  assert.match(level3, /features:\{all:true,group:false,relay:false\}/);
  assert.match(level4, /features:\{all:true,group:true,relay:false\}/);
  assert.match(level5, /features:\{all:true,group:true,relay:false\}/);
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
  assert.match(victory, /cellKey\(bases\.enemy\).*Owner\.Player/);
  assert.match(victory, /cellKey\(bases\.player\).*Owner\.Enemy/);
  assert.match(victory, /player: PLAYER_BASE, enemy: ENEMY_BASE/);
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

test('campaign atlas art remains decorative and within its mobile budget', () => {
  const art = new URL('../public/assets/ui/campaign-atlas-v1.webp', import.meta.url);
  assert.ok(statSync(art).size < 1_000_000, 'Campaign atlas art stays below 1 MB');
  assert.match(atlas, /assets\/ui\/campaign-atlas-v1\.webp/);
  assert.match(atlas, /preserveAspectRatio:'xMidYMid slice'/);
});

test('Level 1 landscape assets stay within the mobile budget', () => {
  for (const name of ['level1-tree.webp', 'level1-conifer-v2.webp', 'level1-bush.webp', 'level1-water.webp', 'level1-shore.webp']) {
    const asset = new URL(`../public/assets/${name}`, import.meta.url);
    assert.ok(statSync(asset).size < 250_000, `${name} stays below 250 KB`);
  }
  const core = new URL('../public/assets/maps/level01-core-v1.png', import.meta.url);
  assert.ok(statSync(core).size < 3_200_000, 'Level 1 core art stays below the 3.2 MB PoC ceiling');
});

test('Level 2 map core and water phases stay within the visual PoC budget', () => {
  const names = ['level02-core-v5.png', 'level02-water-low-v3.png', 'level02-water-high-v3.png'];
  const assets = names.map((name) => new URL(`../public/assets/maps/${name}`, import.meta.url));
  assert.ok(statSync(assets[0]).size < 3_200_000, 'Level 2 core art stays below the 3.2 MB PoC ceiling');
  assert.ok(statSync(assets[1]).size < 850_000, 'Level 2 low-water phase stays below 850 KB');
  assert.ok(statSync(assets[2]).size < 850_000, 'Level 2 high-water phase stays below 850 KB');
  assert.ok(assets.reduce((sum, asset) => sum + statSync(asset).size, 0) < 4_300_000, 'Level 2 visual stack stays below 4.3 MB');
});

test('Level 3 static map core stays within the rollout budget', () => {
  const core = new URL('../public/assets/maps/level03-core-v1.webp', import.meta.url);
  assert.ok(statSync(core).size < 1_600_000, 'Level 3 static core stays below 1.6 MB');
});

test('Level 4 static map core stays within the rollout budget', () => {
  const core = new URL('../public/assets/maps/level04-core-v1.webp', import.meta.url);
  assert.ok(statSync(core).size < 1_600_000, 'Level 4 static core stays below 1.6 MB');
});

test('production assets support GitHub Pages sub-path hosting', () => {
  assert.match(vite, /base: '\.\/'/);
  assert.match(landscape, /import\.meta\.env\.BASE_URL/);
  assert.match(read('../src/rendering/MapArtManifest.ts'), /import\.meta\.env\?\.BASE_URL/);
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
  assert.match(app, /REQUESTED_VISUAL[\s\S]*: 'decor-v2'/);
});

test('compact CC0 audio palette is wired to gameplay and persists its setting', () => {
  const names = [
    'ui-confirm.mp3', 'ui-navigate.mp3', 'ui-denied.mp3', 'ui-toggle.mp3',
    'send.mp3', 'capture.mp3', 'result-victory.ogg', 'result-defeat.ogg',
  ];
  for (const name of names) {
    const asset = new URL(`../public/assets/audio/${name}`, import.meta.url);
    assert.ok(statSync(asset).size > 1_000, `${name} is not empty`);
    assert.ok(statSync(asset).size < 25_000, `${name} stays below 25 KB`);
  }
  assert.match(audio, /hexfront:sound-enabled/);
  assert.match(audio, /import\.meta\.env\.BASE_URL/);
  for (const cue of ['send', 'capture', 'loss', 'victory', 'defeat']) assert.match(app, new RegExp(`audio\\.play\\('${cue}'\\)`));
});

test('debug entry points are restricted to development and test builds', () => {
  assert.match(app, /const DEBUG_ENABLED = import\.meta\.env\.DEV \|\| import\.meta\.env\.MODE === 'test'/);
  assert.match(app, /const DEBUG_PARAMETERS = DEBUG_ENABLED \? new URLSearchParams\(location\.search\) : null/);
  assert.match(app, /if \(DEBUG_ENABLED\) \{[\s\S]*installDebugApi/);
});
