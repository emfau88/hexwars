export enum Owner {
  Neutral = 0,
  Player = 1,
  Enemy = 2,
}

export enum Terrain {
  Normal = 0,
  Void = 1,
  Hill = 2,
  Relay = 3,
  Base = 4,
  Decor = 5,
}

export type DecorType =
  | 'meadow'
  | 'forest'
  | 'water'
  | 'mountain'
  | 'ruin'
  | 'marsh'
  | 'snow';

export type SendMode = 'half' | 'all' | 'group';
export type LandscapeStyle = 'classic' | 'meadow-v1';
export type MissionResult = 'victory' | 'defeat';
export type Point = { x: number; y: number };
export type Cell = { col: number; row: number };

export interface FeatureFlags {
  all: boolean;
  group: boolean;
  relay: boolean;
  supply: boolean;
  focus: boolean;
}

export interface CellDefinition extends Cell {
  terrain?: Terrain;
  units?: number;
  decor?: DecorType;
}

export interface LevelDefinition {
  id: string;
  name: string;
  short: string;
  cols: number;
  rows: number;
  seed: number;
  blurb: string;
  objective: string;
  rule: string;
  aiThinkMs: number;
  aiDelaySeconds: number;
  aiSkill: number;
  aiActions: number;
  neutralUnits: readonly [number, number];
  mirrorNeutral?: boolean;
  features: FeatureFlags;
  theme: string;
  landscapeStyle: LandscapeStyle;
  activeRows: readonly (readonly number[])[];
  cells?: readonly CellDefinition[];
}

export interface HexState extends Cell, Point {
  owner: Owner;
  units: number;
  terrain: Terrain;
  decor: DecorType | null;
  siege: Partial<Record<Owner, number>> | null;
  flash: number;
  fixedUnits: number | null;
}

export interface ArmyMovement {
  id: number;
  owner: Owner;
  units: number;
  x0: number;
  y0: number;
  cx: number;
  cy: number;
  tx: number;
  ty: number;
  toKey: string;
  dist: number;
  traveled: number;
  kind: 'command' | 'reinforcement' | 'supply';
  path: string[];
  pathIndex: number;
}

export interface Particle extends Point {
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
}

export interface CampaignProgress {
  completed: boolean[];
  best: number[];
}

export interface GameSnapshot {
  running: boolean;
  currentLevel: number;
  elapsed: number;
  actions: number;
  captures: number;
  fields: { p1: number; p2: number };
  forces: { p1: number; p2: number };
  result: MissionResult | null;
}

export interface GameEventMap {
  send: { owner: Owner; human: boolean; units: number; from: Point };
  arrival: { owner: Owner; target: HexState; kind: ArmyMovement['kind'] };
  capture: { oldOwner: Owner; newOwner: Owner; target: HexState };
  result: { result: MissionResult; reason: string };
  endgame: { stage: number };
  supply: { owner: Owner; units: number; from: HexState; to: HexState };
}

export type GameEvent<K extends keyof GameEventMap = keyof GameEventMap> = {
  [P in K]: { type: P; detail: GameEventMap[P] };
}[K];
