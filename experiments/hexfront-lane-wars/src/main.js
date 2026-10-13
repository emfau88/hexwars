import { Combat } from './simulation.js';
import { UNITS, TYPES, STEP, batchCount, distance } from './rules.js';
import { SCENARIOS, scenarioById } from './scenarios.js';
import { LabView } from './view.js';

const $ = id => document.getElementById(id);
const format = value => value.toLocaleString('de-DE', { maximumFractionDigits: 1 });
let selectedScenario = scenarioById(new URLSearchParams(location.search).get('scenario') || 'mixed');
let armies = { orange: { ...selectedScenario.orange }, blue: { ...selectedScenario.blue } };
let game, previous = new Map(), playing = false, accumulator = 0, selected = null;
let view;
for (const scenario of SCENARIOS) $('scenario').add(new Option(scenario.name, scenario.id));
$('scenario').add(new Option('Eigener Aufbau', 'custom'));
$('scenario').value = selectedScenario.id;
for (const owner of ['orange', 'blue']) {
  for (const type of TYPES) {
    const row = document.createElement('div'); row.className = 'count-row';
    const label = document.createElement('label'); label.htmlFor = `${owner}-${type}`; label.textContent = UNITS[type].name;
    const input = document.createElement('input'); input.id = `${owner}-${type}`; input.type = 'number'; input.min = 0; input.max = 12; input.step = 1; input.value = armies[owner][type] || 0;
    input.setAttribute('aria-label', `${owner === 'orange' ? 'Orange' : 'Blau'} ${UNITS[type].name} Verbände`);
    input.addEventListener('change', () => { armies[owner][type] = Math.max(0, Math.min(12, Math.floor(Number(input.value) || 0))); input.value = armies[owner][type]; $('scenario').value = 'custom'; selectedScenario = null; reset(); });
    row.append(label, input); $(`${owner}-inputs`).append(row);
  }
}
const roleText = { drone: 'Schneller Schwarm. Stark gegen ungeschützten Fernkampf.', mech: 'Robuste Front. Trifft bis zu drei nahe Ziele.', rail: 'Große Reichweite. Langsamer, kräftiger Einzelschuss.' };
for (const [i, type] of TYPES.entries()) {
  const u = UNITS[type], card = document.createElement('div'); card.className = 'unit-ref';
  card.innerHTML = `<div class="ref-top"><span class="unit-icon">${['◇', '▣', '↗'][i]}</span><strong>${u.name}</strong></div><p>${roleText[type]}</p><p class="values">${u.hp} HP · ${u.damage} Schaden / ${format(u.interval)} s<br>Reichweite ${format(u.range)} · Tempo ${format(u.speed)}</p>`;
  $('unit-reference').append(card);
}
function syncInputs() { for (const owner of ['orange', 'blue']) for (const type of TYPES) $(`${owner}-${type}`).value = armies[owner][type] || 0; }
function reset() {
  playing = false; accumulator = 0; selected = null;
  game = new Combat({ ...armies, gap: Number($('gap').value) }); previous = new Map(game.units.map(u => [u.id, { ...u }]));
  view?.reset(game);
  $('scenario-note').textContent = selectedScenario?.note || 'Eigener Vergleich. Für einen fairen Vergleich gleich viele Produktionsverbände wählen.';
  for (const owner of ['orange', 'blue']) $(`${owner}-budget`).textContent = `${batchCount(armies[owner])} Verbände`;
  updateHUD();
}
function updateHUD() {
  const minutes = Math.floor(game.time / 60), seconds = (game.time % 60).toFixed(1).padStart(4, '0');
  $('clock').textContent = `${String(minutes).padStart(2, '0')}:${seconds}`;
  for (const owner of ['orange', 'blue']) {
    const units = game.units.filter(u => u.owner === owner);
    $(`${owner}-count`).textContent = `${units.length} Roboter`;
    $(`${owner}-hp`).textContent = `${format(units.reduce((s, u) => s + u.hp, 0))} HP`;
  }
  $('play').innerHTML = game.result ? 'Erneut starten <span>↻</span>' : playing ? 'Pausieren <span>Ⅱ</span>' : 'Gefecht starten <span>▶</span>';
  $('step').disabled = playing || !!game.result;
  $('result').hidden = !game.result;
  if (game.result) {
    const title = game.result === 'draw' ? 'Unentschieden' : `${game.result === 'orange' ? 'Orange' : 'Blau'} gewinnt`;
    $('result').innerHTML = `<strong>${title}</strong><small>${format(game.time)} s · ${game.units.length} überlebende Roboter</small>`;
  }
  const u = game.units.find(v => v.id === selected);
  if (u) {
    const target = game.units.find(v => v.id === u.target);
    $('inspector').textContent = `${u.owner === 'orange' ? 'Orange' : 'Blau'} · ${UNITS[u.type].name} #${u.id} · ${u.hp}/${UNITS[u.type].hp} HP · Reichweite ${format(UNITS[u.type].range)} · ${target ? `Ziel: ${UNITS[target.type].name} #${target.id} (${format(distance(u, target))} entfernt)` : 'Rückt vor / kein Ziel in Reichweite'}`;
  } else $('inspector').textContent = selected ? 'Der ausgewählte Roboter wurde zerstört. Einen anderen Roboter anklicken.' : 'Lebenspunkte, aktuelles Ziel und Waffenreichweite direkt prüfen.';
}
function step() {
  previous = new Map(game.units.map(u => [u.id, { ...u }])); game.step(); view?.handle(game.drainEvents());
  if (game.result) { playing = false; accumulator = 0; }
}
function togglePlay() { if (game.result) reset(); playing = !playing; accumulator = 0; updateHUD(); }
$('scenario').addEventListener('change', () => {
  if ($('scenario').value === 'custom') { selectedScenario = null; reset(); return; }
  selectedScenario = scenarioById($('scenario').value); armies = { orange: { ...selectedScenario.orange }, blue: { ...selectedScenario.blue } }; syncInputs(); reset();
});
$('gap').addEventListener('change', reset);
$('play').addEventListener('click', togglePlay);
$('reset').addEventListener('click', reset);
$('step').addEventListener('click', () => { if (!playing && !game.result) { step(); updateHUD(); } });
$('swap').addEventListener('click', () => { armies = { orange: armies.blue, blue: armies.orange }; syncInputs(); reset(); });
$('show-ranges').addEventListener('change', () => { if (view) view.ranges = $('show-ranges').checked; });
document.addEventListener('keydown', e => { if (e.code === 'Space' && !['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(e.target.tagName)) { e.preventDefault(); togglePlay(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && playing) { playing = false; accumulator = 0; updateHUD(); } });
try { view = new LabView($('stage'), id => { selected = id; view.selected = id; updateHUD(); }); }
catch (error) { $('render-error').hidden = false; console.error(error); }
reset();
let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1); last = now;
  const wasPlaying = playing;
  if (playing) {
    accumulator += dt * Number($('speed').value);
    while (accumulator + 1e-9 >= STEP && playing) { accumulator -= STEP; step(); }
    updateHUD();
  }
  view?.render(game, previous, playing ? accumulator / STEP : 1, wasPlaying ? dt * Number($('speed').value) : 0);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Read-only diagnostics for reproducing browser/headless parity in this local lab.
window.__COMBAT_LAB__ = Object.freeze({ snapshot: () => game.snapshot(), summary: () => game.summary(), get playing() { return playing; } });
