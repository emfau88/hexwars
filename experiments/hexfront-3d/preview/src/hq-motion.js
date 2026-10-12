// Cosmetic timelines only. No simulation, routing, production or combat writes.
const clamp=v=>Math.min(1,Math.max(0,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export function radarScan(seconds){
 const t=((seconds%16)+16)%16;
 if(t<6)return -.40+.80*smooth(t/6);
 if(t<8)return .40;
 if(t<14)return .40-.80*smooth((t-8)/6);
 return -.40;
}
export function hqPose({seconds,sendAge=Infinity,hitAge=Infinity,captureAge=Infinity,producing=false,running=false,reduced=false}){
 const send=sendAge>=0&&sendAge<1?Math.sin(Math.PI*sendAge):0;
 const hit=hitAge>=0&&hitAge<.32?Math.sin(Math.PI*hitAge/.32):0;
 const capture=captureAge>=0&&captureAge<1.05;
 const power=capture?(captureAge<.18?1-smooth(captureAge/.18):smooth((captureAge-.32)/.40)):1;
 return {yaw:reduced?0:radarScan(seconds),tilt:reduced?0:Math.sin(seconds*Math.PI/8)*.035,
  door:reduced?0:send*.205,
  intensity:(.20+(producing&&!reduced?.055*(1-Math.cos(seconds*Math.PI*2/5)):0))*power+(reduced?0:send*.34+hit*.26),
  pulse:reduced?0:capture?Math.sin(clamp((captureAge-.18)/.80)*Math.PI)*.22:0,
  reacquire:reduced?0:capture?Math.sin(clamp(captureAge/1.05)*Math.PI)*.16:0,
  useNewTeam:!capture||captureAge>=.32,
  producing,running};
}
