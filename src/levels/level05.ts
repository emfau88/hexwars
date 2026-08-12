import { Terrain } from '../core/types';
import { defineLevel } from './levelFactory';

export default defineLevel({
  id:'two-passes', name:'V · DIE ZWEI PÄSSE', short:'ZWEI PÄSSE', seed:505,
  blurb:'Eine Bergkette blockiert die Mitte. Nur ein linker und ein rechter Pass bleiben offen.',
  objective:'Binde die KI an einem Pass und verlagere deine Truppen anschließend auf die andere Seite.',
  rule:'Berg-Hexes sind Landschaft. Zwei echte Engpässe bestimmen das Gefecht.',
  aiThinkMs:1650, aiDelaySeconds:5, aiSkill:.67, aiActions:1, neutralUnits:[3,8],
  features:{all:true,group:false,relay:false}, theme:'passes',
  activeRows:[[],[3],[2,3,4],[1,2,3,4,5],[1,2,4,5],[1,2,4,5],[1,5],[1,2,4,5],[1,2,4,5],[1,2,3,4,5],[2,3,4],[3],[]],
  cells:Array.from({length:7},(_,col)=>({col,row:6,terrain:Terrain.Decor,decor:'mountain' as const})).filter(({col})=>![1,5].includes(col)),
});

