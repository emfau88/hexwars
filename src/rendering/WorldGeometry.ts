import { WORLD_COLS, WORLD_ROWS } from '../core/config';
import type { Point } from '../core/types';

export const REFERENCE_WORLD_WIDTH = 1108;
export const REFERENCE_WORLD_HEIGHT = 842;

export interface WorldGeometry {
  width: number;
  height: number;
  columns: number;
  rows: number;
  padding: number;
  radius: number;
  horizontal: number;
  vertical: number;
  origin: Point;
  center: Point;
  bounds: { x: number; y: number; width: number; height: number };
}

export interface WorldTransform {
  scale: number;
  translateX: number;
  translateY: number;
}

export function calculateWorldGeometry(
  width: number,
  height: number,
  columns = WORLD_COLS,
  rows = WORLD_ROWS,
): WorldGeometry {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const padding = safeWidth < 900 ? 8 : 18;
  const horizontalFactor = Math.sqrt(3);
  const byWidth = (safeWidth - padding * 2) / ((columns + .5) * horizontalFactor);
  const byHeight = (safeHeight - padding * 2) / (rows * 1.5 + .5);
  const desktopCap = safeWidth >= 1100 && safeHeight >= 780 ? 42 : 34;
  const radius = Math.max(18, Math.min(safeWidth < 520 ? 31 : desktopCap, byWidth, byHeight));
  const horizontal = horizontalFactor * radius;
  const vertical = 1.5 * radius;
  const gridWidth = (columns + .5) * horizontal;
  const gridHeight = (rows * 1.5 + .5) * radius;
  const origin = {
    x: (safeWidth - gridWidth) / 2 + horizontal / 2,
    y: (safeHeight - gridHeight) / 2 + radius,
  };
  const bounds = {
    x: origin.x - horizontal / 2,
    y: origin.y - radius,
    width: gridWidth,
    height: gridHeight,
  };
  return {
    width: safeWidth,
    height: safeHeight,
    columns,
    rows,
    padding,
    radius,
    horizontal,
    vertical,
    origin,
    center: { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 },
    bounds,
  };
}

export const REFERENCE_WORLD_GEOMETRY = Object.freeze(
  calculateWorldGeometry(REFERENCE_WORLD_WIDTH, REFERENCE_WORLD_HEIGHT),
);

export function positionFor(geometry: WorldGeometry, col: number, row: number): Point {
  return {
    x: geometry.origin.x + col * geometry.horizontal + (row % 2 ? geometry.horizontal / 2 : 0),
    y: geometry.origin.y + row * geometry.vertical,
  };
}

export function transformBetween(reference: WorldGeometry, runtime: WorldGeometry): WorldTransform {
  const scale = runtime.radius / reference.radius;
  return {
    scale,
    translateX: runtime.origin.x - reference.origin.x * scale,
    translateY: runtime.origin.y - reference.origin.y * scale,
  };
}

export function transformPoint(point: Point, transform: WorldTransform): Point {
  return {
    x: point.x * transform.scale + transform.translateX,
    y: point.y * transform.scale + transform.translateY,
  };
}

export function inverseTransformPoint(point: Point, transform: WorldTransform): Point {
  return {
    x: (point.x - transform.translateX) / transform.scale,
    y: (point.y - transform.translateY) / transform.scale,
  };
}
