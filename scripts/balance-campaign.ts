import { GameState } from '../src/core/GameState';
import { Owner } from '../src/core/types';
import { LEVELS } from '../src/levels';

type BalanceRow = { level: number; name: string; result: string | null; seconds: number; fields: string; forces: string };

function run(level: number): BalanceRow {
  const game = new GameState();
  game.start(level, (col, row) => ({ x: col * 50 + (row % 2 ? 25 : 0), y: row * 45 }));
  let nextDecision = 2.5;
  while (game.running && game.elapsed < 300) {
    game.update(.05); game.drainEvents();
    if (game.elapsed >= nextDecision) {
      game.think(Owner.Player, .94, level === LEVELS.length - 1 ? 2 : 1);
      nextDecision += 1.4;
    }
  }
  const snapshot = game.snapshot();
  return {
    level: level + 1, name: LEVELS[level].short.en, result: game.result, seconds: Number(game.elapsed.toFixed(1)),
    fields: `${snapshot.fields.p1}:${snapshot.fields.p2}`, forces: `${snapshot.forces.p1}:${snapshot.forces.p2}`,
  };
}

console.table(LEVELS.map((_, index) => run(index)));
