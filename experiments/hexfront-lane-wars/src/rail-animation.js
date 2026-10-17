import * as T from 'three';
export const RAIL_STRIDE=.22/.64;
export const RAIL_CHARGE=.35;
// Shared rigid meshes, independent transform state; all timing is presentation-only.
export class RailAnimator {
 constructor(asset,seed=0){
  this.root=asset.scene.clone(true);this.nodes={};this.root.traverse(o=>this.nodes[o.name]=o);
  this.mixer=new T.AnimationMixer(this.root);asset.runtimeClips??=asset.animations.map(c=>['Attack','Hit','Charge'].includes(c.name)?T.AnimationUtils.makeClipAdditive(c.clone(),0):c);
  this.actions={};for(const c of asset.runtimeClips){const a=this.mixer.clipAction(c);a.blendMode=['Attack','Hit','Charge'].includes(c.name)?T.AdditiveAnimationBlendMode:T.NormalAnimationBlendMode;a.paused=true;a.play();this.actions[c.name]=a;}
  this.phase=(Number(seed)*.381966)%1;this.idleTime=this.phase*3;this.walkWeight=0;this.attackAge=Infinity;this.hitAge=Infinity;this.deathAge=null;this.charge=0;this.aim=0;
  this.turretBase=this.nodes.Turret_Yaw.quaternion.clone();this.pitchBase=this.nodes.Gun_Pitch.quaternion.clone();this.partMatrix=new T.Matrix4();this.sample(0,0,false);
 }
 shot(){if(this.deathAge===null){this.attackAge=0;this.charge=0;}}
 hit(){if(this.deathAge===null)this.hitAge=0;}
 die(){this.deathAge=0;this.charge=0;}
 sample(dt,distance,moving,aim=0,elevation=0,unit=null){
  this.phase=(this.phase+Math.min(distance,.5)/RAIL_STRIDE)%1;this.idleTime=(this.idleTime+dt)%3;
  this.walkWeight=T.MathUtils.lerp(this.walkWeight,moving?1:0,dt>0?1-Math.exp(-dt*22):0);
  this.attackAge+=dt;this.hitAge+=dt;if(this.deathAge!==null)this.deathAge+=dt;
  const dead=this.deathAge!==null,deathWeight=dead?Math.min(1,this.deathAge/.12):0;
  // Existing aimTime/cooldown determine charging. Never delay or invent a simulated shot.
  const remaining=Math.max(unit?.aimTime||0,unit?.cooldown||0);
  this.charge=!dead&&!moving&&unit?.target!=null&&remaining>0&&remaining<=RAIL_CHARGE?1-remaining/RAIL_CHARGE:0;
  const set=(n,t,w)=>{const a=this.actions[n];a.enabled=w>0;a.time=Math.min(t,a.getClip().duration);a.setEffectiveWeight(w);};
  set('Idle',this.idleTime,(1-deathWeight)*(1-this.walkWeight));set('Walk',this.phase,(1-deathWeight)*this.walkWeight);
  set('Charge',this.charge*RAIL_CHARGE,this.charge>0?1:0);set('Attack',this.attackAge,!dead&&this.attackAge<.45?1:0);set('Hit',this.hitAge,!dead&&this.hitAge<.3?1:0);set('Death',this.deathAge??0,deathWeight);
  this.nodes.Turret_Yaw.quaternion.copy(this.turretBase);this.nodes.Gun_Pitch.quaternion.copy(this.pitchBase);this.mixer.update(0);
  this.turretBase.copy(this.nodes.Turret_Yaw.quaternion);this.pitchBase.copy(this.nodes.Gun_Pitch.quaternion);
  this.aim=dead?0:T.MathUtils.clamp(aim,-.7,.7);this.nodes.Turret_Yaw.rotateY(this.aim);this.nodes.Gun_Pitch.rotateX(dead?0:T.MathUtils.clamp(elevation,-.25,.25));this.root.updateMatrixWorld(true);
 }
 write(meshes,index,world,parts){for(let i=0;i<meshes.length;i++){this.partMatrix.multiplyMatrices(world,this.nodes[parts[i].node].matrixWorld);meshes[i].setMatrixAt(index,this.partMatrix);}}
 muzzle(world,out=new T.Vector3()){return out.setFromMatrixPosition(this.nodes.Muzzle.matrixWorld).applyMatrix4(world);}
 dispose(){this.mixer.stopAllAction();this.mixer.uncacheRoot(this.root);}
}
