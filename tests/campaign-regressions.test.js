import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import test from 'node:test';

const campaign = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function levelBlock(roman, nextRoman) {
  const start = campaign.indexOf(`name:'${roman} `);
  const end = nextRoman ? campaign.indexOf(`name:'${nextRoman} `, start + 1) : campaign.indexOf('const CAMPAIGN_ACTS', start);
  assert.notEqual(start, -1, `level ${roman} exists`);
  assert.notEqual(end, -1, `level ${roman} has an end boundary`);
  return campaign.slice(start, end);
}

test('Level 1 teaches 50 percent and Level 2 unlocks 100 percent', () => {
  const level1 = levelBlock('I', 'II');
  const level2 = levelBlock('II', 'III');

  assert.match(level1, /sendest du jeweils 50 %/);
  assert.match(level1, /features:\{all:false,group:false,relay:false\}/);
  assert.match(level2, /100-%-Sendungen werden freigeschaltet/);
  assert.match(level2, /features:\{all:true,group:false,relay:false\}/);
});

test('Level 9 mirrors deterministic neutral strength', () => {
  const level9 = levelBlock('IX', 'X');

  assert.match(level9, /mirrorNeutral:true/);
  assert.match(campaign, /L\.mirrorNeutral&&mirroredUnits\.has\(mirrorKey\)/);
  assert.match(campaign, /mirroredUnits\.set\(key\(h\.col,h\.row\),h\.units\)/);
});

test('AI can move rear reserves toward the active front', () => {
  const level5 = levelBlock('V', 'VI');

  assert.doesNotMatch(level5, /mark\(hs,(?:1|5),6,TERRAIN\.HILL\)/);
  assert.match(campaign, /function ownedFrontDistances\(owner\)/);
  assert.match(campaign, /elapsed>=75\?ownedFrontDistances\(owner\):null/);
  assert.match(campaign, /type:'logistics'/);
  assert.match(campaign, /regenerationScale\(\)/);
});

test('base victory is tied to the correct base coordinate', () => {
  assert.match(campaign, /h\.col===ENEMY_BASE\[0\].*h\.row===ENEMY_BASE\[1\].*newOwner===OWNER\.P1/);
  assert.match(campaign, /h\.col===PLAYER_BASE\[0\].*h\.row===PLAYER_BASE\[1\].*newOwner===OWNER\.P2/);
});

test('mobile portrait puts the compact campaign route before the dossier', () => {
  assert.match(campaign, /#mapCenter \{ order:2;/);
  assert.match(campaign, /\.campaignJourney \{ order:1;/);
  assert.match(campaign, /\.actGroup:not\(\.current\) \{ display:none; \}/);
  assert.match(campaign, /function showMobileDossier\(\)/);
});

test('Level 1 keeps a full visible hex field with bounded terrain decoration', () => {
  assert.match(campaign, /function drawLevelOneAmbientGrid\(\)/);
  assert.match(campaign, /function drawLevelOneDecorHex\(h\)/);
  assert.match(campaign, /function drawLevelOneWaterShore\(/);
  assert.match(campaign, /if\(currentLevel===0\)\{drawLevelOneDecorHex\(h\);return;\}/);
  for (const name of ['level1-tree.webp', 'level1-conifer.webp', 'level1-bush.webp']) {
    const asset = new URL(`../assets/${name}`, import.meta.url);
    assert.ok(statSync(asset).size < 250_000, `${name} stays within the mobile asset budget`);
  }
  const treeRenderer = campaign.slice(campaign.indexOf('function drawLevelOneTree('), campaign.indexOf('function drawLevelOneMeadowDetails('));
  assert.doesNotMatch(treeRenderer, /rotate|scale\(-/);
  assert.match(campaign, /sprite\.naturalHeight\/sprite\.naturalWidth/);
  assert.match(campaign, /function drawLevelOneConifer\(/);
  assert.match(campaign, /function drawLevelOneBush\(/);
});
