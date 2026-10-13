export * from '../../hexfront-3d/src/transport.js';
import {transportPose as originalPose,structureClearance} from '../../hexfront-3d/src/transport.js';
import {surfaceHeight} from './map.js';

export function transportPose(game,order,seconds=0,reduced=false){
 const p=originalPose(game,order,seconds,reduced),cell=game.cell(order.path[order.segment+(p.t<.5?0:1)]);
 const ground=surfaceHeight(game.cells,cell,p.x,p.z);
 p.y+=ground+structureClearance(game,p.x,p.z,ground)-p.ground-structureClearance(game,p.x,p.z,p.ground);
 p.ground=ground;return p;
}
