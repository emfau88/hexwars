export * from '../../../hexfront-3d/src/missions.js';
import {MISSIONS as originalMissions} from '../../../hexfront-3d/src/missions.js';

// Remove only the two decoration fragments flanking Morgenwacht's relay.
// Shared mission data is immutable; the lower ruins and other maps stay intact.
export const MISSIONS=originalMissions.map(m=>m.id==='morgenwacht'
 ? {...m,art:{...m.art,ruins:m.art.ruins.filter(([, , ,base])=>base===0)}}:m);
export const getMission=(id='morgenwacht')=>MISSIONS.find(m=>m.id===id)||MISSIONS[0];
