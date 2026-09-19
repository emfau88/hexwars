import { pathToFileURL } from 'node:url';
import { GameState } from '../src/core/GameState';
import { isPlayable } from '../src/core/hex';
import { Owner, type HexState } from '../src/core/types';
import { LEVELS } from '../src/levels';
import { rawForce } from './doomstack';

const STEP = .05;
const SNAPSHOT_SECONDS = 30;
const PHASE_SECONDS = 60;
const MAX_SECONDS = 300;
const key = (hex: { col: number; row: number }) => `${hex.col},${hex.row}`;
const round = (value: number) => Number(value.toFixed(1));
const team = (owner: Owner) => owner === Owner.Player ? 'P' : owner === Owner.Enemy ? 'E' : 'N';

interface TeamTotals {
  commands: number;
  commandUnits: number;
  hostileCommands: number;
  hostileUnits: number;
  supplyCommands: number;
  supplyUnits: number;
  growth: number;
  combatLost: number;
  inflicted: number;
  shieldSpent: number;
  nonCombatLoss: number;
  captures: number;
  attacks: number;
  breakouts: number;
  reinforces: number;
  logistics: number;
  counters: number;
}

interface CellSnapshot {
  cell: string;
  owner: string;
  garrison: number;
  siegeP: number;
  siegeE: number;
  incomingP: number;
  incomingE: number;
}

const emptyTotals = (): TeamTotals => ({
  commands: 0, commandUnits: 0, hostileCommands: 0, hostileUnits: 0,
  supplyCommands: 0, supplyUnits: 0, growth: 0, combatLost: 0,
  inflicted: 0, shieldSpent: 0, nonCombatLoss: 0, captures: 0,
  attacks: 0, breakouts: 0, reinforces: 0, logistics: 0, counters: 0,
});

export function diagnoseLevel6(guardianUnits: number | null = 7) {
  const level = LEVELS[5];
  const originalStructures = level.structures;
  if (guardianUnits === null) level.structures = [];
  else if (originalStructures?.[0]) level.structures = [{ ...originalStructures[0], units: guardianUnits }];
  else throw new Error('Level 6 Guardian definition is missing.');

  try {
    const game = new GameState();
    game.start(5, (col, row) => ({ x: col * 50 + (row % 2 ? 25 : 0), y: row * 45 }));
    const phases = Array.from({ length: MAX_SECONDS / PHASE_SECONDS }, (_, index) => ({
      period: `${index * PHASE_SECONDS}-${(index + 1) * PHASE_SECONDS}`,
      P: emptyTotals(), E: emptyTotals(),
    }));
    const byTeam = (owner: Owner): TeamTotals | null => {
      if (owner === Owner.Neutral) return null;
      const phase = phases[Math.min(phases.length - 1, Math.floor(game.elapsed / PHASE_SECONDS))];
      return owner === Owner.Player ? phase.P : phase.E;
    };
    const sends = new Map<string, { owner: string; from: string; to: string; count: number; units: number; hostile: boolean }>();
    const combatCells = new Map<string, { cell: string; attackerLostP: number; attackerLostE: number; defenderLostP: number; defenderLostE: number; shieldLost: number }>();
    const captures: { seconds: number; cell: string; from: string; to: string }[] = [];
    const snapshots: {
      seconds: number; fieldsP: number; fieldsE: number; forceP: number; forceE: number;
      westP: number; westE: number; eastP: number; eastE: number;
      hqP: number; hqE: number; guardianOwner: string; guardianGarrison: number; shield: number;
      movingP: number; movingE: number; cells: CellSnapshot[];
    }[] = [];
    let playerIdleDecisions = 0;
    let nextDecision = 2.5;
    let nextSnapshot = 0;
    const originalSend = game.send.bind(game);
    game.send = (from, to, owner, units, human = false) => {
      const targetOwner = to.owner;
      const sent = originalSend(from, to, owner, units, human);
      if (sent) {
        const amount = Math.floor(units);
        const totals = byTeam(owner)!;
        totals.commands += 1; totals.commandUnits += amount;
        if (targetOwner !== owner) { totals.hostileCommands += 1; totals.hostileUnits += amount; }
        const id = `${team(owner)}:${key(from)}>${key(to)}`;
        const record = sends.get(id) ?? { owner: team(owner), from: key(from), to: key(to), count: 0, units: 0, hostile: targetOwner !== owner };
        record.count += 1; record.units += amount; sends.set(id, record);
      }
      return sent;
    };
    game.onGrowth = (_hex, owner, units) => { const totals = byTeam(owner); if (totals) totals.growth += units; };
    game.onAIAction = (owner, action) => {
      const totals = byTeam(owner);
      if (!totals) return;
      if (action.type === 'attack') totals.attacks += 1;
      if (action.type === 'breakout') totals.breakouts += 1;
      if (action.type === 'reinforce') totals.reinforces += 1;
      if (action.type === 'logistics') totals.logistics += 1;
      if (action.type === 'counter') totals.counters += 1;
    };
    game.onCombatExchange = ({ cell, attacker, defender, attackerLost, defenderLost, shieldLost }) => {
      const attackerTotals = byTeam(attacker);
      const defenderTotals = byTeam(defender);
      if (attackerTotals) {
        attackerTotals.combatLost += attackerLost;
        attackerTotals.inflicted += defenderLost;
        attackerTotals.shieldSpent += shieldLost;
      }
      if (defenderTotals) defenderTotals.combatLost += defenderLost;
      const id = key(cell);
      const record = combatCells.get(id) ?? { cell: id, attackerLostP: 0, attackerLostE: 0, defenderLostP: 0, defenderLostE: 0, shieldLost: 0 };
      if (attacker === Owner.Player) record.attackerLostP += attackerLost;
      if (attacker === Owner.Enemy) record.attackerLostE += attackerLost;
      if (defender === Owner.Player) record.defenderLostP += defenderLost;
      if (defender === Owner.Enemy) record.defenderLostE += defenderLost;
      record.shieldLost += shieldLost;
      combatCells.set(id, record);
    };
    const takeSnapshot = () => {
      const playable = game.hexes.filter(isPlayable);
      const flankForce = (owner: Owner, flank: 'west' | 'east') => playable
        .filter((hex) => hex.owner === owner && hex.row >= 3 && hex.row <= 9 && (flank === 'west' ? hex.col <= 2 : hex.col >= 4))
        .reduce((sum, hex) => sum + hex.units + (hex.siege?.[owner] ?? 0), 0);
      const guardian = game.structures.find(({ type }) => type === 'guardian');
      const guardianHex = guardian ? game.hexAt(guardian.col, guardian.row) : null;
      const cells = playable.map((hex): CellSnapshot => ({
        cell: key(hex), owner: team(hex.owner), garrison: round(hex.units),
        siegeP: round(hex.siege?.[Owner.Player] ?? 0), siegeE: round(hex.siege?.[Owner.Enemy] ?? 0),
        incomingP: round(game.incomingTo(hex, Owner.Player)), incomingE: round(game.incomingTo(hex, Owner.Enemy)),
      }));
      snapshots.push({
        seconds: round(game.elapsed), fieldsP: game.fieldCount(Owner.Player), fieldsE: game.fieldCount(Owner.Enemy),
        forceP: round(rawForce(game, Owner.Player)), forceE: round(rawForce(game, Owner.Enemy)),
        westP: round(flankForce(Owner.Player, 'west')), westE: round(flankForce(Owner.Enemy, 'west')),
        eastP: round(flankForce(Owner.Player, 'east')), eastE: round(flankForce(Owner.Enemy, 'east')),
        hqP: round(game.hexAt(3, 11)?.units ?? 0), hqE: round(game.hexAt(3, 1)?.units ?? 0),
        guardianOwner: guardian ? team(guardian.owner) : '-', guardianGarrison: round(guardianHex?.units ?? 0),
        shield: round(game.shieldFor('enemy-hq').current),
        movingP: game.armies.filter(({ owner }) => owner === Owner.Player).length,
        movingE: game.armies.filter(({ owner }) => owner === Owner.Enemy).length,
        cells,
      });
    };
    takeSnapshot(); nextSnapshot += SNAPSHOT_SECONDS;
    while (game.running && game.elapsed < MAX_SECONDS) {
      const beforeP = rawForce(game, Owner.Player); const beforeE = rawForce(game, Owner.Enemy);
      const phase = phases[Math.min(phases.length - 1, Math.floor((game.elapsed + STEP) / PHASE_SECONDS))];
      const previousP = phase.P.growth - phase.P.combatLost;
      const previousE = phase.E.growth - phase.E.combatLost;
      game.update(STEP);
      for (const event of game.drainEvents()) {
        if (event.type === 'supply') {
          const totals = byTeam(event.detail.owner)!;
          totals.supplyCommands += 1; totals.supplyUnits += event.detail.units;
        }
        if (event.type === 'capture') {
          captures.push({ seconds: round(game.elapsed), cell: key(event.detail.target), from: team(event.detail.oldOwner), to: team(event.detail.newOwner) });
          const totals = byTeam(event.detail.newOwner); if (totals) totals.captures += 1;
        }
      }
      if (game.elapsed >= nextDecision && game.running) {
        if (game.think(Owner.Player, .94, 1) <= 0) playerIdleDecisions += 1;
        nextDecision += 1.4;
      }
      const expectedP = beforeP + (phase.P.growth - phase.P.combatLost - previousP);
      const expectedE = beforeE + (phase.E.growth - phase.E.combatLost - previousE);
      phase.P.nonCombatLoss += Math.max(0, expectedP - rawForce(game, Owner.Player));
      phase.E.nonCombatLoss += Math.max(0, expectedE - rawForce(game, Owner.Enemy));
      if (game.elapsed + .0001 >= nextSnapshot) { takeSnapshot(); nextSnapshot += SNAPSHOT_SECONDS; }
    }
    if (snapshots.at(-1)?.seconds !== round(game.elapsed)) takeSnapshot();
    return {
      guardianUnits, result: game.result ?? 'timeout', seconds: round(game.elapsed), playerIdleDecisions,
      phases: phases.map((phase) => ({ period: phase.period, P: Object.fromEntries(Object.entries(phase.P).map(([metric, value]) => [metric, round(value)])),
        E: Object.fromEntries(Object.entries(phase.E).map(([metric, value]) => [metric, round(value)])) })),
      snapshots, captures,
      topSends: [...sends.values()].sort((a, b) => b.units - a.units).slice(0, 16),
      topCombatCells: [...combatCells.values()].map((record) => ({ ...record, totalLoss: record.attackerLostP + record.attackerLostE + record.defenderLostP + record.defenderLostE }))
        .sort((a, b) => b.totalLoss - a.totalLoss).slice(0, 16)
        .map((record) => Object.fromEntries(Object.entries(record).map(([metric, value]) => [metric, typeof value === 'number' ? round(value) : value]))),
    };
  } finally {
    level.structures = originalStructures;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const guardianUnits = process.argv.includes('--none') ? null : process.argv.includes('--six') ? 6 : 7;
  const result = diagnoseLevel6(guardianUnits);
  if (process.argv.includes('--json')) console.log(JSON.stringify(result));
  else {
    console.log({ guardianUnits: result.guardianUnits, result: result.result, seconds: result.seconds, playerIdleDecisions: result.playerIdleDecisions });
    console.table(result.snapshots.map(({ cells: _cells, ...snapshot }) => snapshot));
    console.table(result.phases.flatMap(({ period, P, E }) => [{ period, team: 'P', ...P }, { period, team: 'E', ...E }]));
    console.table(result.topCombatCells);
    console.table(result.topSends);
    console.table(result.captures);
  }
}
