import { GAME_CONFIG } from './config';
import { cellKey, findOwnedPath, hexDistance, isPlayable, neighborsOf } from './hex';
import { createSeededRandom, type RandomSource } from './random';
import { Owner, Terrain, type ArmyMovement, type GameEvent, type GameSnapshot, type HexState, type MissionResult, type Point } from './types';
import { buildLevel } from '../levels/buildLevel';
import { LEVELS } from '../levels';
import { runAI, type AIContext } from '../systems/AISystem';
import { resolveArrival, updateCombat } from '../systems/CombatSystem';
import { updateGrowth } from '../systems/GrowthSystem';
import { createMovement, updateMovements } from '../systems/MovementSystem';
import { frontHexes, isFrontHex, SupplySystem } from '../systems/SupplySystem';
import { evaluateVictory } from '../systems/VictorySystem';

export class GameState {
  currentLevel = 0;
  running = false;
  elapsed = 0;
  actions = 0;
  captures = 0;
  endgameStage = 0;
  result: MissionResult | null = null;
  resultReason = '';
  hexes: HexState[] = [];
  armies: ArmyMovement[] = [];
  autoplay = false;
  opponentEnabled = true;
  private random: RandomSource = Math.random;
  private aiTimerMs = 0;
  private playerAiTimerMs = 0;
  private events: GameEvent[] = [];
  private readonly supplySystem = new SupplySystem();
  private readonly supplyFocus: Partial<Record<Owner, string | null>> = { [Owner.Player]: null, [Owner.Enemy]: null };

  get level() { return LEVELS[this.currentLevel] ?? LEVELS[0]; }

  start(levelIndex = this.currentLevel, positionFor?: (col: number, row: number) => Point): void {
    this.currentLevel = Math.max(0, Math.min(LEVELS.length - 1, levelIndex));
    this.random = createSeededRandom(this.level.seed);
    this.hexes = buildLevel(this.currentLevel, this.random, positionFor);
    this.armies = [];
    this.elapsed = 0; this.actions = 0; this.captures = 0; this.endgameStage = 0;
    this.aiTimerMs = 0; this.playerAiTimerMs = 0;
    this.result = null; this.resultReason = ''; this.events = [];
    this.opponentEnabled = true; this.supplySystem.reset();
    this.supplyFocus[Owner.Player] = null; this.supplyFocus[Owner.Enemy] = null;
    this.running = true;
  }

  setPositions(positionFor: (col: number, row: number) => Point): void {
    for (const hex of this.hexes) Object.assign(hex, positionFor(hex.col, hex.row));
  }

  hexAt(col: number, row: number): HexState | null {
    return this.hexes.find((hex) => hex.col === col && hex.row === row) ?? null;
  }

  canSend(from: HexState | null, to: HexState | null): boolean {
    if (!from || !to || from === to || !isPlayable(from) || !isPlayable(to)) return false;
    const distance = hexDistance(from, to);
    if (distance === 1) return true;
    if (this.level.features.supply && from.owner === to.owner && from.owner !== Owner.Neutral && findOwnedPath(this.hexes, from, to)) return true;
    return this.level.features.relay && from.terrain === Terrain.Relay && from.owner !== Owner.Neutral && distance <= GAME_CONFIG.relayRange;
  }

  send(from: HexState, to: HexState, owner: Owner, units: number, human = false): boolean {
    const amount = Math.floor(units);
    if (amount < 1 || from.owner !== owner || amount > Math.floor(from.units) || !this.canSend(from, to)) return false;
    const ownedRoute = from.owner === to.owner && hexDistance(from, to) > 1 ? findOwnedPath(this.hexes, from, to) : null;
    from.units -= amount;
    this.armies.push(createMovement(from, to, owner, amount, ownedRoute ? 'reinforcement' : 'command', ownedRoute ?? [from, to]));
    if (human) this.actions += 1;
    this.events.push({ type: 'send', detail: { owner, human, units: amount, from } });
    return true;
  }

  sendFraction(from: HexState, to: HexState, fraction: number, human = true): boolean {
    return this.send(from, to, from.owner, Math.floor(from.units * fraction), human);
  }

  groupContributors(target: HexState, owner: Owner, preferred?: HexState): HexState[] {
    return this.hexes
      .filter((hex) => hex.owner === owner && hex.units >= 2 && this.canSend(hex, target))
      .sort((a, b) => a === preferred ? -1 : b === preferred ? 1 : b.units - a.units)
      .slice(0, 3);
  }

  groupPotential(target: HexState, owner: Owner, preferred?: HexState): number {
    return this.groupContributors(target, owner, preferred).reduce((sum, hex) => sum + Math.floor(hex.units * 0.5), 0);
  }

  sendGroup(target: HexState, owner: Owner, human = false, preferred?: HexState): number {
    const contributors = this.groupContributors(target, owner, preferred);
    let total = 0;
    for (const source of contributors) {
      const amount = Math.floor(source.units * 0.5);
      if (this.send(source, target, owner, amount, false)) total += amount;
    }
    if (human && total > 0) this.actions += 1;
    return total;
  }

  fieldCount(owner: Owner): number {
    return this.hexes.filter((hex) => hex.owner === owner && isPlayable(hex)).length;
  }

  forceCount(owner: Owner): number {
    let count = 0;
    for (const hex of this.hexes) {
      if (hex.owner === owner) count += hex.units;
      count += hex.siege?.[owner] ?? 0;
    }
    for (const army of this.armies) if (army.owner === owner) count += army.units;
    return Math.floor(count);
  }

  incomingTo(target: HexState, owner: Owner): number {
    return this.armies.filter((army) => army.owner === owner && army.toKey === cellKey(target)).reduce((sum, army) => sum + army.units, target.siege?.[owner] ?? 0);
  }

  fronts(owner: Owner): HexState[] { return frontHexes(this.hexes, owner); }

  focusedFront(owner: Owner): HexState | null {
    const key = this.supplyFocus[owner];
    return key ? this.hexes.find((hex) => cellKey(hex) === key) ?? null : null;
  }

  toggleSupplyFocus(hex: HexState, owner: Owner): boolean {
    if (!this.level.features.focus || hex.owner !== owner || !isFrontHex(this.hexes, hex, owner)) return false;
    const key = cellKey(hex);
    this.supplyFocus[owner] = this.supplyFocus[owner] === key ? null : key;
    return true;
  }

  think(owner: Owner, skill: number, count = 1): number {
    const context: AIContext = {
      owner, elapsed: this.elapsed, endgameStage: this.endgameStage, hexes: this.hexes,
      level: this.level, random: this.random,
      canSend: (from, to) => this.canSend(from, to),
      incomingTo: (target, candidate) => this.incomingTo(target, candidate),
      send: (from, to, candidate, units) => this.send(from, to, candidate, units),
      groupPotential: (target, candidate, preferred) => this.groupPotential(target, candidate, preferred),
      sendGroup: (target, candidate, preferred) => this.sendGroup(target, candidate, false, preferred),
    };
    return runAI(context, skill, count);
  }

  update(deltaSeconds: number): void {
    if (!this.running) return;
    this.elapsed += deltaSeconds;
    const nextStage = this.elapsed >= GAME_CONFIG.endgameStart + GAME_CONFIG.endgameFade ? 2 : this.elapsed >= GAME_CONFIG.endgameStart ? 1 : 0;
    if (nextStage !== this.endgameStage) {
      this.endgameStage = nextStage;
      this.events.push({ type: 'endgame', detail: { stage: nextStage } });
    }
    updateGrowth(this.hexes, this.elapsed, deltaSeconds);
    if (this.level.features.supply) {
      for (const dispatch of this.supplySystem.update({ hexes: this.hexes, armies: this.armies, focus: this.supplyFocus }, deltaSeconds)) {
        this.events.push({ type: 'supply', detail: dispatch });
      }
    }
    updateCombat(this.hexes, deltaSeconds, this.random, (target, oldOwner, newOwner) => {
      if (newOwner === Owner.Player) this.captures += 1;
      this.events.push({ type: 'capture', detail: { oldOwner, newOwner, target } });
    });
    updateMovements(this.armies, this.hexes, deltaSeconds, (movement, target) => {
      resolveArrival(movement, target);
      if (target) this.events.push({ type: 'arrival', detail: { owner: movement.owner, target, kind: movement.kind } });
    });
    if (this.opponentEnabled && this.elapsed >= this.level.aiDelaySeconds) {
      this.aiTimerMs += deltaSeconds * 1000;
      if (this.aiTimerMs >= this.level.aiThinkMs) {
        this.aiTimerMs = 0;
        this.think(Owner.Enemy, this.level.aiSkill, this.level.aiActions);
      }
    }
    if (this.autoplay) {
      this.playerAiTimerMs += deltaSeconds * 1000;
      if (this.playerAiTimerMs >= this.level.aiThinkMs * 1.08) {
        this.playerAiTimerMs = 0;
        this.think(Owner.Player, 0.8, this.level.aiActions > 1 ? 2 : 1);
      }
    }
    const victory = evaluateVictory(this.hexes, this.armies);
    if (victory) this.end(victory.result, victory.reason);
  }

  end(result: MissionResult, reason: string): void {
    if (!this.running) return;
    this.running = false; this.result = result; this.resultReason = reason;
    this.events.push({ type: 'result', detail: { result, reason } });
  }

  snapshot(): GameSnapshot {
    return {
      running: this.running, currentLevel: this.currentLevel, elapsed: this.elapsed,
      actions: this.actions, captures: this.captures,
      fields: { p1: this.fieldCount(Owner.Player), p2: this.fieldCount(Owner.Enemy) },
      forces: { p1: this.forceCount(Owner.Player), p2: this.forceCount(Owner.Enemy) }, result: this.result,
    };
  }

  drainEvents(): GameEvent[] {
    return this.events.splice(0);
  }

  ownedNeighbors(hex: HexState): HexState[] {
    return neighborsOf(this.hexes, hex).filter((candidate) => candidate.owner === hex.owner);
  }
}
