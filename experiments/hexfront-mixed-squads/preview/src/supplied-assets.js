import * as T from 'three';
import {GLTFLoader} from '../../../hexfront-3d/vendor/loaders/GLTFLoader.js';
export const SUPPLIED_TEAMS={orange:0xf49a43,blue:0x469dce,neutral:0x849793};
export async function loadSupplied(){
 const loader=new GLTFLoader();const models=await Promise.all(['hoverbot','relay','hq'].map(id=>loader.loadAsync(new URL(`../../../hexfront-3d/public/assets/supplied/${id}.glb`,import.meta.url).href)));
 return {drone:models[0].scene,relay:models[1].scene,hq:models[2].scene};
}
/** Repaint only saturated warm source texels. White ceramic and dark metal
 * are never multiplied by team colour. Instanced drones share these materials. */
export function suppliedMaterial(source,owner='orange',instanced=false){
 const m=source.clone(),optic=source.name==='Supplied_Optic';m.color.setHex(0xffffff);
 if(m.map)m.map.anisotropy=4;
 const team={value:new T.Color(SUPPLIED_TEAMS[owner])};m.userData.supplied=true;m.userData.teamUniform=team;
 m.onBeforeCompile=shader=>{
  shader.uniforms.uSuppliedTeam=team;
  if(instanced){
   shader.vertexShader='varying vec3 vSuppliedTeam;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING_COLOR\nvSuppliedTeam = instanceColor;\n#else\nvSuppliedTeam = vec3(1.0);\n#endif');
  }
  shader.fragmentShader='uniform vec3 uSuppliedTeam;\n'+(instanced?'varying vec3 vSuppliedTeam;\n':'')+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`
vec3 assetTeam = uSuppliedTeam;
${instanced?'assetTeam = vSuppliedTeam;':''}
${optic?'diffuseColor.rgb *= assetTeam;':`vec3 sourceAlbedo=diffuseColor.rgb;
float warmMask=smoothstep(.36,.64,(sourceAlbedo.r-sourceAlbedo.b)/max(.001,sourceAlbedo.r))*smoothstep(.018,.09,sourceAlbedo.r-sourceAlbedo.g);
diffuseColor.rgb=mix(sourceAlbedo,assetTeam*sourceAlbedo.r/.905,warmMask);`}
`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
${optic?'totalEmissiveRadiance *= assetTeam;':'float lampStrength=max(totalEmissiveRadiance.r,max(totalEmissiveRadiance.g,totalEmissiveRadiance.b)); totalEmissiveRadiance=assetTeam*lampStrength;'}`);
 };
 if(optic){m.emissive.setHex(0xffffff);m.emissiveIntensity=.65;}
 m.customProgramCacheKey=()=>`mixed-masked-v3-${optic}-${instanced}`;
 return m;
}
export function setSuppliedTeam(material,owner){material.userData.teamUniform.value.setHex(SUPPLIED_TEAMS[owner]||SUPPLIED_TEAMS.neutral);}
