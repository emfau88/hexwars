import {
  advanceFire,
  chooseAdvanceHex,
  createHexBoard,
  getReachableHexes,
  hexDistance,
  hexKey,
  igniteTile,
  parseHexKey,
} from "./core.js";

const canvas = document.querySelector("#gameCanvas");
const canvasWrap = document.querySelector("#canvasWrap");
const ctx = canvas.getContext("2d");

const ui = {
  phase: document.querySelector("#phaseLabel"),
  round: document.querySelector("#roundLabel"),
  status: document.querySelector("#statusText"),
  roster: document.querySelector("#unitRoster"),
  endTurn: document.querySelector("#endTurnButton"),
  restart: document.querySelector("#restartButton"),
  playAgain: document.querySelector("#playAgainButton"),
  sound: document.querySelector("#soundToggle"),
  blueCoreValue: document.querySelector("#blueCoreValue"),
  redCoreValue: document.querySelector("#redCoreValue"),
  blueCoreBar: document.querySelector("#blueCoreBar"),
  redCoreBar: document.querySelector("#redCoreBar"),
  gameOver: document.querySelector("#gameOver"),
  gameOverKicker: document.querySelector("#gameOverKicker"),
  gameOverTitle: document.querySelector("#gameOverTitle"),
  gameOverMessage: document.querySelector("#gameOverMessage"),
  turnBanner: document.querySelector("#turnBanner"),
};

const RADIUS = 4;
const CORE_MAX_HP = 10;
const TEAM = {
  blue: { color: "#45d9e8", dark: "#0b6977", name: "Blau" },
  red: { color: "#ff625f", dark: "#8f2731", name: "Rot" },
};
const UNIT_TYPES = {
  sentinel: { name: "Wächter", mark: "W", maxHp: 5, move: 1, range: 1, damage: 2, role: "Panzer · Nahkampf" },
  ranger: { name: "Jäger", mark: "J", maxHp: 3, move: 2, range: 3, damage: 1, role: "Mobil · Reichweite 3" },
  igniter: { name: "Zünder", mark: "Z", maxHp: 4, move: 1, range: 2, damage: 1, role: "Entzündet Terrain" },
};

let game;
let metrics = { width: 900, height: 650, size: 40, centerX: 450, centerY: 325, dpr: 1 };
let hoverHex = null;
let floaters = [];
let shake = 0;
let bannerTimer;
let audioContext;
let soundEnabled = localStorage.getItem("hexwars-sound") !== "off";

function terrainPreset() {
  const terrain = {};
  const mirrorPairs = {
    forest: [
      [-2, -2],
      [-1, -2],
      [-2, 0],
      [-1, 0],
      [-3, 2],
      [-2, 2],
      [0, -1],
    ],
    water: [
      [0, -3],
      [1, -2],
      [-1, -1],
    ],
  };

  for (const [type, pairs] of Object.entries(mirrorPairs)) {
    for (const [q, r] of pairs) {
      terrain[hexKey(q, r)] = type;
      terrain[hexKey(-q, -r)] = type;
    }
  }

  terrain[hexKey(-4, 0)] = "coreBlue";
  terrain[hexKey(4, 0)] = "coreRed";
  return terrain;
}

function makeUnit(id, team, type, q, r) {
  const stats = UNIT_TYPES[type];
  return {
    id,
    team,
    type,
    q,
    r,
    hp: stats.maxHp,
    ap: 2,
    moved: false,
    attacked: false,
  };
}

function createGame() {
  return {
    board: createHexBoard(RADIUS, terrainPreset()),
    units: [
      makeUnit("blue-sentinel", "blue", "sentinel", -3, 0),
      makeUnit("blue-ranger", "blue", "ranger", -3, 1),
      makeUnit("blue-igniter", "blue", "igniter", -2, -1),
      makeUnit("red-sentinel", "red", "sentinel", 3, 0),
      makeUnit("red-ranger", "red", "ranger", 3, -1),
      makeUnit("red-igniter", "red", "igniter", 2, 1),
    ],
    cores: {
      blue: { q: -4, r: 0, hp: CORE_MAX_HP },
      red: { q: 4, r: 0, hp: CORE_MAX_HP },
    },
    selectedId: null,
    phase: "blue",
    round: 1,
    locked: false,
    winner: null,
  };
}

function resetGame() {
  game = createGame();
  hoverHex = null;
  floaters = [];
  shake = 0;
  ui.gameOver.hidden = true;
  setStatus("Wähle eine blaue Einheit. Jede Einheit kann sich bewegen und einmal angreifen.");
  announceTurn("Dein Zug", "blue");
  updateUI();
}

function getUnit(id) {
  return game.units.find((unit) => unit.id === id);
}

function getUnitAt(hex) {
  return game.units.find((unit) => unit.hp > 0 && unit.q === hex.q && unit.r === hex.r);
}

function selectedUnit() {
  return game.selectedId ? getUnit(game.selectedId) : null;
}

function occupiedKeys(exceptId = null) {
  return new Set(
    game.units
      .filter((unit) => unit.hp > 0 && unit.id !== exceptId)
      .map((unit) => hexKey(unit)),
  );
}

function getMoveOptions(unit) {
  if (!unit || unit.ap <= 0 || unit.moved) return new Map();
  return getReachableHexes(game.board, unit, UNIT_TYPES[unit.type].move, occupiedKeys(unit.id));
}

function canAttackHex(unit, hex) {
  return Boolean(unit && unit.ap > 0 && !unit.attacked && hexDistance(unit, hex) <= UNIT_TYPES[unit.type].range);
}

function selectUnit(unit) {
  if (game.phase !== "blue" || game.locked || unit.team !== "blue" || unit.ap <= 0) return;
  game.selectedId = unit.id;
  const stats = UNIT_TYPES[unit.type];
  setStatus(`${stats.name} gewählt · ${unit.ap} AP · Bewegung ${stats.move} · Reichweite ${stats.range}`);
  playTone("select");
  updateUI();
}

function moveUnit(unit, destination) {
  unit.q = destination.q;
  unit.r = destination.r;
  unit.ap -= 1;
  unit.moved = true;
  addFloater(destination, "BEWEGT", TEAM[unit.team].color);
  setStatus(`${UNIT_TYPES[unit.type].name} in Position. Wähle jetzt ein orange markiertes Ziel.`);
  playTone("move");
  updateUI();
}

function attackUnit(attacker, target) {
  const stats = UNIT_TYPES[attacker.type];
  target.hp -= stats.damage;
  attacker.ap -= 1;
  attacker.attacked = true;
  addFloater(target, `−${stats.damage}`, "#ffd27a");
  shake = Math.max(shake, 5);
  playTone(attacker.type === "igniter" ? "fire" : "attack");

  if (attacker.type === "igniter") {
    igniteTile(game.board, target);
  }

  if (target.hp <= 0) {
    addFloater(target, "AUSGESCHALTET", "#ff625f");
    game.units = game.units.filter((unit) => unit.hp > 0);
    if (game.selectedId === target.id) game.selectedId = null;
    setStatus(`${UNIT_TYPES[target.type].name} ausgeschaltet.`);
  } else {
    setStatus(`${UNIT_TYPES[attacker.type].name} verursacht ${stats.damage} Schaden.`);
  }

  checkVictory();
  updateUI();
}

function attackCore(attacker, team) {
  const stats = UNIT_TYPES[attacker.type];
  const core = game.cores[team];
  core.hp = Math.max(0, core.hp - stats.damage);
  attacker.ap -= 1;
  attacker.attacked = true;
  addFloater(core, `KERN −${stats.damage}`, TEAM[team].color);
  shake = Math.max(shake, 8);
  setStatus(`${TEAM[team].name}er Kern getroffen: ${core.hp} Integrität verbleibt.`);
  playTone("core");
  checkVictory();
  updateUI();
}

function handleBoardClick(hex) {
  if (!hex || game.phase !== "blue" || game.locked || game.winner) return;

  const clickedUnit = getUnitAt(hex);
  if (clickedUnit?.team === "blue") {
    selectUnit(clickedUnit);
    return;
  }

  const unit = selectedUnit();
  if (!unit) {
    setStatus("Wähle zuerst eine einsatzbereite blaue Einheit.");
    playTone("deny");
    return;
  }

  if (clickedUnit?.team === "red" && canAttackHex(unit, clickedUnit)) {
    attackUnit(unit, clickedUnit);
    return;
  }

  if (hex.q === game.cores.red.q && hex.r === game.cores.red.r && canAttackHex(unit, game.cores.red)) {
    attackCore(unit, "red");
    return;
  }

  const moveOptions = getMoveOptions(unit);
  if (!clickedUnit && moveOptions.has(hexKey(hex))) {
    moveUnit(unit, hex);
    return;
  }

  setStatus(unit.ap <= 0 ? "Diese Einheit hat keine Aktionspunkte mehr." : "Dieses Feld ist aktuell nicht erreichbar.");
  playTone("deny");
}

function availableTargets(attacker, team) {
  const enemyTeam = team === "blue" ? "red" : "blue";
  const units = game.units
    .filter((unit) => unit.team === enemyTeam && canAttackHex(attacker, unit))
    .sort((a, b) => a.hp - b.hp || hexDistance(attacker, a) - hexDistance(attacker, b));
  const core = game.cores[enemyTeam];
  return { units, core: canAttackHex(attacker, core) ? core : null, enemyTeam };
}

function performBestAttack(unit) {
  const targets = availableTargets(unit, unit.team);
  if (targets.core && targets.core.hp <= UNIT_TYPES[unit.type].damage) {
    attackCore(unit, targets.enemyTeam);
    return true;
  }
  if (targets.units.length) {
    attackUnit(unit, targets.units[0]);
    return true;
  }
  if (targets.core) {
    attackCore(unit, targets.enemyTeam);
    return true;
  }
  return false;
}

function wait(ms) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return new Promise((resolve) => window.setTimeout(resolve, reducedMotion ? 20 : ms));
}

async function runEnemyTurn() {
  if (game.phase !== "blue" || game.locked || game.winner) return;
  game.phase = "red";
  game.locked = true;
  game.selectedId = null;
  for (const unit of game.units.filter((entry) => entry.team === "red")) {
    unit.ap = 2;
    unit.moved = false;
    unit.attacked = false;
  }
  announceTurn("Feindzug", "red");
  setStatus("Feindliche Taktik wird berechnet …");
  updateUI();
  await wait(450);

  const enemyUnits = [...game.units.filter((unit) => unit.team === "red")];
  for (const snapshot of enemyUnits) {
    const unit = getUnit(snapshot.id);
    if (!unit || game.winner) break;

    if (performBestAttack(unit)) {
      await wait(400);
      continue;
    }

    const targets = [...game.units.filter((entry) => entry.team === "blue"), game.cores.blue];
    const destination = chooseAdvanceHex(
      game.board,
      unit,
      targets,
      UNIT_TYPES[unit.type].move,
      occupiedKeys(unit.id),
    );

    if (destination) {
      moveUnit(unit, destination);
      await wait(260);
    }
    performBestAttack(unit);
    await wait(380);
  }

  if (game.winner) return;
  resolveFire();
  if (game.winner) return;

  game.round += 1;
  game.phase = "blue";
  game.locked = false;
  for (const unit of game.units.filter((entry) => entry.team === "blue")) {
    unit.ap = 2;
    unit.moved = false;
    unit.attacked = false;
  }
  announceTurn("Dein Zug", "blue");
  setStatus("Neue Runde. Wähle eine blaue Einheit.");
  updateUI();
}

function resolveFire() {
  const result = advanceFire(game.board, game.units);
  for (const id of result.damagedUnits) {
    const unit = getUnit(id);
    if (unit) addFloater(unit, "FEUER −1", "#ff8a3d");
  }
  const destroyed = game.units.filter((unit) => unit.hp <= 0);
  for (const unit of destroyed) addFloater(unit, "VERBRANNT", "#ff625f");
  game.units = game.units.filter((unit) => unit.hp > 0);
  if (result.ignited.length) {
    setStatus(`Das Feuer springt auf ${result.ignited.length} weitere Waldfelder über.`);
    playTone("fire");
  }
  checkVictory();
}

function checkVictory() {
  const blueAlive = game.units.some((unit) => unit.team === "blue");
  const redAlive = game.units.some((unit) => unit.team === "red");
  let winner = null;

  if (game.cores.red.hp <= 0 || !redAlive) winner = "blue";
  if (game.cores.blue.hp <= 0 || !blueAlive) winner = "red";
  if (!winner) return false;

  game.winner = winner;
  game.locked = true;
  game.phase = winner;
  ui.gameOver.hidden = false;
  ui.gameOverKicker.textContent = `Gefechtsbericht · ${game.round} Runden`;
  ui.gameOverTitle.textContent = winner === "blue" ? "Sieg" : "Niederlage";
  ui.gameOverMessage.textContent = winner === "blue"
    ? "Der rote Reaktorkern ist gefallen. Der Sektor gehört dir."
    : "Dein Reaktorkern wurde überrannt. Passe deine Route an und versuche es erneut.";
  playTone(winner === "blue" ? "victory" : "defeat");
  updateUI();
  return true;
}

function setStatus(message) {
  ui.status.textContent = message;
}

function announceTurn(text, team) {
  clearTimeout(bannerTimer);
  ui.turnBanner.textContent = text;
  ui.turnBanner.className = `turn-banner ${team === "red" ? "enemy" : ""} show`;
  bannerTimer = window.setTimeout(() => ui.turnBanner.classList.remove("show"), 850);
}

function updateUI() {
  ui.phase.textContent = game.winner ? `${TEAM[game.winner].name} gewinnt` : game.phase === "blue" ? "Dein Zug" : "Feindzug";
  ui.phase.style.color = TEAM[game.phase].color;
  ui.round.textContent = `Runde ${game.round}`;
  ui.endTurn.disabled = game.phase !== "blue" || game.locked || Boolean(game.winner);
  ui.blueCoreValue.textContent = `${game.cores.blue.hp} / ${CORE_MAX_HP}`;
  ui.redCoreValue.textContent = `${game.cores.red.hp} / ${CORE_MAX_HP}`;
  ui.blueCoreBar.style.width = `${(game.cores.blue.hp / CORE_MAX_HP) * 100}%`;
  ui.redCoreBar.style.width = `${(game.cores.red.hp / CORE_MAX_HP) * 100}%`;
  ui.sound.textContent = `Sound: ${soundEnabled ? "an" : "aus"}`;
  ui.sound.setAttribute("aria-pressed", String(soundEnabled));
  renderRoster();
}

function renderRoster() {
  const blueUnits = game.units.filter((unit) => unit.team === "blue");
  ui.roster.replaceChildren();

  for (const unit of blueUnits) {
    const stats = UNIT_TYPES[unit.type];
    const button = document.createElement("button");
    button.type = "button";
    button.className = `unit-card ${game.selectedId === unit.id ? "selected" : ""}`;
    button.disabled = game.phase !== "blue" || game.locked || unit.ap <= 0;
    button.setAttribute("aria-label", `${stats.name}, ${unit.hp} Lebenspunkte, ${unit.ap} Aktionspunkte`);
    button.innerHTML = `
      <span class="unit-emblem">${stats.mark}</span>
      <span class="unit-copy"><strong>${stats.name}</strong><span>${stats.role}</span></span>
      <span class="unit-stats">HP ${unit.hp}/${stats.maxHp}<span>${unit.ap} AP</span></span>
    `;
    button.addEventListener("click", () => selectUnit(unit));
    ui.roster.append(button);
  }

  if (!blueUnits.length) {
    const empty = document.createElement("p");
    empty.className = "eyebrow";
    empty.textContent = "Team ausgeschaltet";
    ui.roster.append(empty);
  }
}

function resizeCanvas() {
  const rect = canvasWrap.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  const sizeByWidth = (rect.width - 42) / (Math.sqrt(3) * (RADIUS * 2 + 1));
  const sizeByHeight = (rect.height - 46) / (RADIUS * 3 + 2);
  metrics = {
    width: rect.width,
    height: rect.height,
    size: Math.max(22, Math.min(sizeByWidth, sizeByHeight)),
    centerX: rect.width / 2,
    centerY: rect.height / 2 + 6,
    dpr,
  };
}

function hexToPixel(hex) {
  return {
    x: metrics.centerX + metrics.size * Math.sqrt(3) * (hex.q + hex.r / 2),
    y: metrics.centerY + metrics.size * 1.5 * hex.r,
  };
}

function pixelToHex(x, y) {
  const localX = x - metrics.centerX;
  const localY = y - metrics.centerY;
  const q = ((Math.sqrt(3) / 3) * localX - (1 / 3) * localY) / metrics.size;
  const r = ((2 / 3) * localY) / metrics.size;
  return cubeRound(q, r);
}

function cubeRound(q, r) {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);
  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);

  if (qDiff > rDiff && qDiff > sDiff) rq = -rr - rs;
  else if (rDiff > sDiff) rr = -rq - rs;
  return { q: rq, r: rr };
}

function traceHex(x, y, size = metrics.size - 1) {
  ctx.beginPath();
  for (let index = 0; index < 6; index += 1) {
    const angle = ((60 * index - 30) * Math.PI) / 180;
    const px = x + size * Math.cos(angle);
    const py = y + size * Math.sin(angle);
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawBackdrop(time) {
  ctx.fillStyle = "#061216";
  ctx.fillRect(0, 0, metrics.width, metrics.height);

  const glow = ctx.createRadialGradient(metrics.centerX, metrics.centerY, 20, metrics.centerX, metrics.centerY, metrics.width * 0.55);
  glow.addColorStop(0, "rgba(35, 100, 96, 0.22)");
  glow.addColorStop(1, "rgba(5, 15, 18, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, metrics.width, metrics.height);

  ctx.fillStyle = "rgba(120, 204, 196, 0.13)";
  for (let index = 0; index < 32; index += 1) {
    const x = (index * 97.3 + time * 0.006) % metrics.width;
    const y = (index * 53.7) % metrics.height;
    ctx.fillRect(x, y, 1, 1);
  }
}

function tileFill(tile) {
  if (tile.terrain === "forest") return "#183d35";
  if (tile.terrain === "water") return "#123a48";
  if (tile.terrain === "scorched") return "#302721";
  if (tile.terrain === "coreBlue") return "#123f49";
  if (tile.terrain === "coreRed") return "#49252a";
  return "#173035";
}

function drawTile(tile, time, moveOptions, unit) {
  const { x, y } = hexToPixel(tile);
  traceHex(x, y);
  ctx.fillStyle = tileFill(tile);
  ctx.fill();
  ctx.strokeStyle = "rgba(134, 187, 182, 0.16)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const key = hexKey(tile);
  if (moveOptions.has(key)) {
    traceHex(x, y, metrics.size - 3);
    ctx.fillStyle = "rgba(69, 217, 232, 0.16)";
    ctx.fill();
    ctx.strokeStyle = "rgba(69, 217, 232, 0.72)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  const enemy = getUnitAt(tile);
  const redCore = tile.q === game.cores.red.q && tile.r === game.cores.red.r;
  if (unit && canAttackHex(unit, tile) && (enemy?.team === "red" || redCore)) {
    traceHex(x, y, metrics.size - 3);
    ctx.fillStyle = "rgba(244, 185, 66, 0.15)";
    ctx.fill();
    ctx.strokeStyle = `rgba(244, 185, 66, ${0.64 + Math.sin(time * 0.006) * 0.18})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (hoverHex && hoverHex.q === tile.q && hoverHex.r === tile.r) {
    traceHex(x, y, metrics.size - 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  drawTerrainSymbol(tile, x, y, time);
  if (tile.fire > 0) drawFire(x, y, time, tile.q * 17 + tile.r * 31);
}

function drawTerrainSymbol(tile, x, y, time) {
  if (tile.terrain === "forest") {
    ctx.fillStyle = "rgba(87, 158, 104, 0.72)";
    for (const [dx, dy, scale] of [[-9, 7, 0.9], [7, 5, 0.78], [0, -4, 1]]) {
      ctx.beginPath();
      ctx.moveTo(x + dx, y + dy - 11 * scale);
      ctx.lineTo(x + dx - 7 * scale, y + dy + 6 * scale);
      ctx.lineTo(x + dx + 7 * scale, y + dy + 6 * scale);
      ctx.closePath();
      ctx.fill();
    }
  } else if (tile.terrain === "water") {
    ctx.strokeStyle = "rgba(93, 187, 205, 0.58)";
    ctx.lineWidth = 1.5;
    for (let line = -1; line <= 1; line += 1) {
      ctx.beginPath();
      for (let px = -16; px <= 16; px += 4) {
        const py = Math.sin(px * 0.22 + time * 0.002 + line) * 2 + line * 7;
        if (px === -16) ctx.moveTo(x + px, y + py);
        else ctx.lineTo(x + px, y + py);
      }
      ctx.stroke();
    }
  } else if (tile.terrain === "scorched") {
    ctx.strokeStyle = "rgba(197, 128, 75, 0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 15, y - 5);
    ctx.lineTo(x - 4, y + 2);
    ctx.lineTo(x - 10, y + 13);
    ctx.moveTo(x + 12, y - 11);
    ctx.lineTo(x + 4, y + 3);
    ctx.lineTo(x + 13, y + 10);
    ctx.stroke();
  } else if (tile.terrain.startsWith("core")) {
    const team = tile.terrain === "coreBlue" ? "blue" : "red";
    drawCore(x, y, team, time);
  }
}

function drawCore(x, y, team, time) {
  const pulse = 1 + Math.sin(time * 0.004) * 0.08;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  ctx.strokeStyle = TEAM[team].color;
  ctx.fillStyle = TEAM[team].dark;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI / 3) * index;
    const px = Math.cos(angle) * 17;
    const py = Math.sin(angle) * 17;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = TEAM[team].color;
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFire(x, y, time, seed) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let index = 0; index < 5; index += 1) {
    const wave = Math.sin(time * 0.008 + seed + index * 1.8);
    const fx = x + (index - 2) * 7 + wave * 2;
    const height = 12 + ((seed + index * 7) % 8) + wave * 3;
    const gradient = ctx.createLinearGradient(fx, y + 12, fx, y - height);
    gradient.addColorStop(0, "rgba(255, 68, 25, 0.9)");
    gradient.addColorStop(0.55, "rgba(255, 174, 45, 0.8)");
    gradient.addColorStop(1, "rgba(255, 241, 143, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(fx - 5, y + 12);
    ctx.quadraticCurveTo(fx - 8 + wave, y - 1, fx, y - height);
    ctx.quadraticCurveTo(fx + 8 - wave, y - 1, fx + 5, y + 12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawUnit(unit, time) {
  const { x, y } = hexToPixel(unit);
  const stats = UNIT_TYPES[unit.type];
  const selected = game.selectedId === unit.id;
  const bob = Math.sin(time * 0.003 + unit.q * 2 + unit.r) * 1.2;
  ctx.save();
  ctx.translate(x, y + bob);

  if (selected) {
    ctx.strokeStyle = `rgba(244, 185, 66, ${0.7 + Math.sin(time * 0.008) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  const gradient = ctx.createRadialGradient(-5, -7, 2, 0, 0, 21);
  gradient.addColorStop(0, TEAM[unit.team].color);
  gradient.addColorStop(1, TEAM[unit.team].dark);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = selected ? "#f4b942" : "rgba(232, 247, 242, 0.6)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#effbf7";
  ctx.font = `800 ${Math.max(13, metrics.size * 0.36)}px Barlow Condensed, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(stats.mark, 0, 1);

  const pipWidth = 5;
  const gap = 2;
  const fullWidth = stats.maxHp * pipWidth + (stats.maxHp - 1) * gap;
  for (let hp = 0; hp < stats.maxHp; hp += 1) {
    ctx.fillStyle = hp < unit.hp ? "#effbf7" : "rgba(4, 14, 17, 0.55)";
    ctx.fillRect(-fullWidth / 2 + hp * (pipWidth + gap), 25, pipWidth, 3);
  }

  for (let ap = 0; ap < 2; ap += 1) {
    ctx.fillStyle = ap < unit.ap ? "#f4b942" : "rgba(244, 185, 66, 0.18)";
    ctx.beginPath();
    ctx.arc(-4 + ap * 8, -25, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function addFloater(hex, text, color) {
  floaters.push({ q: hex.q, r: hex.r, text, color, createdAt: performance.now() });
}

function drawFloaters(time) {
  floaters = floaters.filter((floater) => time - floater.createdAt < 1050);
  for (const floater of floaters) {
    const age = (time - floater.createdAt) / 1050;
    const { x, y } = hexToPixel(floater);
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - age * 1.08);
    ctx.fillStyle = floater.color;
    ctx.font = "800 13px Barlow Condensed, sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 5;
    ctx.fillText(floater.text, x, y - 31 - age * 24);
    ctx.restore();
  }
}

function render(time = performance.now()) {
  ctx.setTransform(metrics.dpr, 0, 0, metrics.dpr, 0, 0);
  ctx.clearRect(0, 0, metrics.width, metrics.height);
  drawBackdrop(time);

  ctx.save();
  if (shake > 0.1) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    shake *= 0.84;
  }

  const unit = selectedUnit();
  const moveOptions = getMoveOptions(unit);
  for (const tile of game.board.values()) drawTile(tile, time, moveOptions, unit);
  for (const entry of game.units) drawUnit(entry, time);
  drawFloaters(time);
  ctx.restore();

  requestAnimationFrame(render);
}

function pointerHex(event) {
  const rect = canvas.getBoundingClientRect();
  const hex = pixelToHex(event.clientX - rect.left, event.clientY - rect.top);
  return game.board.has(hexKey(hex)) ? hex : null;
}

function ensureAudio() {
  if (!soundEnabled) return null;
  if (!audioContext) audioContext = new AudioContext();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(kind) {
  const audio = ensureAudio();
  if (!audio) return;
  const now = audio.currentTime;
  const presets = {
    select: [260, 360, 0.07, "sine"],
    move: [145, 210, 0.09, "triangle"],
    attack: [105, 52, 0.13, "square"],
    fire: [210, 72, 0.18, "sawtooth"],
    core: [82, 42, 0.24, "square"],
    deny: [120, 105, 0.06, "triangle"],
    victory: [330, 660, 0.42, "triangle"],
    defeat: [180, 62, 0.4, "sawtooth"],
  };
  const [start, end, duration, type] = presets[kind] ?? presets.select;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(start, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(kind === "deny" ? 0.035 : 0.075, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

canvas.addEventListener("pointermove", (event) => {
  hoverHex = pointerHex(event);
});
canvas.addEventListener("pointerleave", () => {
  hoverHex = null;
});
canvas.addEventListener("pointerdown", (event) => {
  canvas.focus();
  handleBoardClick(pointerHex(event));
});
ui.endTurn.addEventListener("click", runEnemyTurn);
ui.restart.addEventListener("click", resetGame);
ui.playAgain.addEventListener("click", resetGame);
ui.sound.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  localStorage.setItem("hexwars-sound", soundEnabled ? "on" : "off");
  updateUI();
  if (soundEnabled) playTone("select");
});
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "e") runEnemyTurn();
  if (event.key.toLowerCase() === "r") resetGame();
  if (event.key === "Escape") {
    game.selectedId = null;
    setStatus("Auswahl aufgehoben.");
    updateUI();
  }
});

new ResizeObserver(resizeCanvas).observe(canvasWrap);
resetGame();
resizeCanvas();
requestAnimationFrame(render);
