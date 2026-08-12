export type RandomSource = () => number;

export function createSeededRandom(seed: number): RandomSource {
  let value = seed >>> 0;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let mixed = Math.imul(value ^ (value >>> 15), 1 | value);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash01(col: number, row: number, seed: number): number {
  let value = (col + 1) * 374761393 + (row + 1) * 668265263 + seed * 69069;
  value = (value ^ (value >>> 13)) * 1274126177;
  value ^= value >>> 16;
  return (value >>> 0) / 4294967295;
}

