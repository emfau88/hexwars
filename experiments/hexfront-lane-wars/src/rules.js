export const STEP = 0.05;
export const LENGTH = 30;
export const HALF_WIDTH = 1.4;
export const OWNERS = Object.freeze(['orange', 'blue']);
export const TYPES = Object.freeze(['drone', 'mech', 'rail']);
export const UNITS = Object.freeze({
  drone: Object.freeze({ name: 'Drohne', plural: 'Drohnen', count: 3, hp: 24, damage: 6, interval: 0.6, range: 1.1, speed: 1.6, windup: 0.1, splash: 0, secondary: 0, maxSecondary: 0, radius: 0.22 }),
  mech: Object.freeze({ name: 'Mech', plural: 'Mechs', count: 1, hp: 120, damage: 10, interval: 1.2, range: 1.6, speed: 0.9, windup: 0.2, splash: 0.8, secondary: 7, maxSecondary: 2, radius: 0.34 }),
  rail: Object.freeze({ name: 'Fernkämpfer', plural: 'Fernkämpfer', count: 1, hp: 40, damage: 45, interval: 2.4, range: 4, speed: 1, windup: 0.35, splash: 0, secondary: 0, maxSecondary: 0, radius: 0.27 }),
});
export const other = owner => owner === 'orange' ? 'blue' : 'orange';
export const direction = owner => owner === 'orange' ? 1 : -1;
export const distance = (a, b) => Math.hypot(a.p - b.p, a.x - b.x);
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function batchCount(army) { return TYPES.reduce((sum, type) => sum + (army[type] || 0), 0); }
export function describeArmy(army) {
  return TYPES.filter(type => army[type]).map(type => `${army[type] * UNITS[type].count} ${army[type] * UNITS[type].count === 1 ? UNITS[type].name : UNITS[type].plural}`).join(' + ') || 'Keine Einheiten';
}
