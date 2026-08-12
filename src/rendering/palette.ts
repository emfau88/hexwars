import { Owner } from '../core/types';

export const OWNER_COLORS = {
  [Owner.Neutral]: { low: '#e6e4d4', high: '#f6f2de', edge: '#aaa994', text: '#343a35' },
  [Owner.Player]: { low: '#e58c49', high: '#f4b66e', edge: '#c66b31', text: '#33251c' },
  [Owner.Enemy]: { low: '#69a9d3', high: '#9bcbea', edge: '#4e8eb8', text: '#183246' },
} as const;

const rgb = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

export function mix(first: string, second: string, ratio: number): string {
  const a = rgb(first); const b = rgb(second);
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * ratio)},${Math.round(a[1] + (b[1] - a[1]) * ratio)},${Math.round(a[2] + (b[2] - a[2]) * ratio)})`;
}

