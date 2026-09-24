import { Owner } from '../core/types';

export const OWNER_COLORS = {
  [Owner.Neutral]: { low: '#e6e4d4', high: '#f6f2de', edge: '#aaa994', text: '#343a35' },
  [Owner.Player]: { low: '#db712b', high: '#f19a43', edge: '#aa4f1e', text: '#2f1d12' },
  [Owner.Enemy]: { low: '#338dcc', high: '#64b5e8', edge: '#246f9f', text: '#102d42' },
} as const;

const rgb = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

export function mix(first: string, second: string, ratio: number): string {
  const a = rgb(first); const b = rgb(second);
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * ratio)},${Math.round(a[1] + (b[1] - a[1]) * ratio)},${Math.round(a[2] + (b[2] - a[2]) * ratio)})`;
}
