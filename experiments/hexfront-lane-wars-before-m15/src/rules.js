export const OWNERS = ['orange', 'blue'];
export const LANES = ['west', 'east'];
export const LANE_LENGTH = 24;
export const HQ_HEALTH = 420;
export const INCOME = 4;
export const START_CREDITS = 70;
export const UNIT_LIMIT = 30;
export const QUEUE_LIMIT = 8;
export const STEP = .05;
export const UNITS = Object.freeze({
  drone: Object.freeze({name:'Drohnen', singular:'Drohne', cost:18, build:3, count:3, hp:14, damage:4, cooldown:.8, range:1.3, speed:1.35, splash:0, role:'3 schnelle Roboter · gegen Fernkämpfer', short:'Schwarm', counter:'rail'}),
  mech: Object.freeze({name:'Mech', singular:'Mech', cost:32, build:5, count:1, hp:92, damage:6, cooldown:.8, range:1.6, speed:.68, splash:.85, role:'Robuste Front · trifft Drohnengruppen', short:'Flächenschaden', counter:'drone'}),
  rail: Object.freeze({name:'Rail-Bot', singular:'Rail-Bot', cost:34, build:5, count:1, hp:30, damage:40, cooldown:2.4, range:3.5, speed:.72, splash:0, role:'Große Reichweite · gegen Mechs', short:'Einzelziel', counter:'mech'}),
});
export const other = owner => owner === 'orange' ? 'blue' : 'orange';
export const laneName = lane => lane === 'west' ? 'Westweg' : 'Ostweg';
// Normalized route coordinates; rendering and simulation use this same length.
export function lanePoint(lane, position) {
  const t = Math.max(0, Math.min(1, position / LANE_LENGTH));
  const side = lane === 'west' ? -1 : 1;
  const spread = Math.min(1, Math.sin(Math.PI * t) * 2.8);
  return {x:side * 3.1 * spread, z:9.8 - t * 19.6};
}
