import * as T from 'three';

export const MECH_STRIDE=.28/.62;
// Each robot owns only transform/animation state. Rendered parts share geometry and materials.
export class MechAnimator {
 constructor(asset,seed=0){
  this.root=asset.scene.clone(true);this.mixer=new T.AnimationMixer(this.root);this.nodes={};this.root.traverse(o=>this.nodes[o.name]=o);
  asset.runtimeClips??=asset.animations.map(clip=>['Attack','Hit'].includes(clip.name)?T.AnimationUtils.makeClipAdditive(clip.clone(),0):clip);
  this.armBase=this.nodes.Shoulder_R.quaternion.clone();this.torsoBase=this.nodes.Torso.quaternion.clone();this.actions={};for(const data of asset.runtimeClips){const additive=['Attack','Hit'].includes(data.name);const a=this.mixer.clipAction(data);a.blendMode=additive?T.AdditiveAnimationBlendMode:T.NormalAnimationBlendMode;a.paused=true;a.play();this.actions[data.name]=a;}
  this.phase=(Number(seed)*.381966)%1;this.idleTime=this.phase*3;this.walkWeight=0;this.attackAge=Infinity;this.hitAge=Infinity;this.deathAge=null;this.world=new T.Matrix4();this.partMatrix=new T.Matrix4();this.aim=0;this.sample(0,0,false);
 }
 shot(){if(this.deathAge===null)this.attackAge=0;}
 hit(){if(this.deathAge===null)this.hitAge=0;}
 die(){this.deathAge=0;}
 sample(dt,distance,moving,aim=0,weaponAim=0){
  this.phase=(this.phase+Math.min(distance,.5)/MECH_STRIDE)%1;this.idleTime=(this.idleTime+dt)%3;
  this.walkWeight=T.MathUtils.lerp(this.walkWeight,moving?1:0,dt>0?1-Math.exp(-dt*18):0);
  this.attackAge+=dt;this.hitAge+=dt;if(this.deathAge!==null)this.deathAge+=dt;
  const dead=this.deathAge!==null,deathWeight=dead?Math.min(1,this.deathAge/.12):0;
  const set=(name,time,weight)=>{const a=this.actions[name];a.enabled=weight>0;a.time=Math.min(time,a.getClip().duration);a.setEffectiveWeight(weight);};
  set('Idle',this.idleTime,(1-deathWeight)*(1-this.walkWeight));set('Walk',this.phase,(1-deathWeight)*this.walkWeight);
  set('Attack',this.attackAge,!dead&&this.attackAge<.45?1:0);set('Hit',this.hitAge,!dead&&this.hitAge<.3?1:0);
  set('Death',this.deathAge??0,deathWeight);this.nodes.Torso.quaternion.copy(this.torsoBase);this.nodes.Shoulder_R.quaternion.copy(this.armBase);this.mixer.update(0);this.torsoBase.copy(this.nodes.Torso.quaternion);this.armBase.copy(this.nodes.Shoulder_R.quaternion);
  // Upper assembly catches the target while the legs finish turning. No targeting or damage logic here.
  this.aim=dead?0:T.MathUtils.clamp(aim,-.65,.65);this.nodes.Torso.rotateY(this.aim);this.nodes.Shoulder_R.rotateY(dead?0:T.MathUtils.clamp(weaponAim,-.55,.55));this.root.updateMatrixWorld(true);
 }
 write(meshes,index,world,parts){this.world.copy(world);for(let i=0;i<meshes.length;i++){this.partMatrix.multiplyMatrices(world,this.nodes[parts[i].node].matrixWorld);meshes[i].setMatrixAt(index,this.partMatrix);}}
 muzzle(world,out=new T.Vector3()){return out.setFromMatrixPosition(this.nodes.Muzzle_Primary.matrixWorld).applyMatrix4(world);}
 dispose(){this.mixer.stopAllAction();this.mixer.uncacheRoot(this.root);}
}
