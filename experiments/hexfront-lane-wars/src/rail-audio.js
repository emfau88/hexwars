// Original, deterministic sound design. No downloads, simulation timers or random-state changes.
export function railPCM(kind,sampleRate=48000){
  const duration={charge:.35,shot:.32,impact:.38}[kind];if(!duration)throw new Error('Unknown rail sound');
  const data=new Float32Array(Math.ceil(duration*sampleRate));let seed=73129,low=0,phase=0;
  for(let i=0;i<data.length;i++){
    const t=i/sampleRate,q=t/duration;seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const noise=seed/2147483648-1;low+=.13*(noise-low);let value;
    if(kind==='charge'){
      phase+=2*Math.PI*(480+1250*q*q)/sampleRate;
      value=(Math.sin(phase)*.38+Math.sin(phase*2.013)*.12+low*.20)*(.12+.88*q)*Math.min(1,t/.018)*Math.min(1,(duration-t)/.012);
    }else if(kind==='shot'){
      phase+=2*Math.PI*(55+210*Math.exp(-t*32))/sampleRate;
      value=Math.sin(phase)*.68*Math.exp(-t*16)+noise*.42*Math.exp(-t*100)+low*.8*Math.exp(-t*25)+Math.sin(2*Math.PI*1720*t)*.10*Math.exp(-t*42);
      value*=Math.min(1,t/.0015)*Math.min(1,(duration-t)/.03);
    }else{
      value=(Math.sin(2*Math.PI*377*t)*.25+Math.sin(2*Math.PI*911*t)*.17+Math.sin(2*Math.PI*1483*t)*.09)*Math.exp(-t*18)+noise*.34*Math.exp(-t*50)+low*.5*Math.exp(-t*22);
      value*=Math.min(1,t/.002)*Math.min(1,(duration-t)/.04);
    }
    data[i]=Math.tanh(value*1.3)*.8;
  }
  return data;
}
export class RailAudio {
  constructor(){
    this.enabled=true;try{this.enabled=localStorage.getItem('hexfront-rail-sound')!=='off';}catch{}
    this.active=false;this.voices=new Set();this.charges=new Map();this.stats={charge:0,shot:0,impact:0,skipped:0};
  }
  async unlock(){
    if(!this.enabled)return;
    try{
      if(!this.context){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;
        const c=this.context=new Audio();this.master=c.createGain();this.master.gain.value=.38;
        const limiter=c.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=12;limiter.ratio.value=8;limiter.attack.value=.003;limiter.release.value=.18;
        this.master.connect(limiter);limiter.connect(c.destination);this.buffers={};
        for(const kind of ['charge','shot','impact']){const pcm=railPCM(kind,c.sampleRate),buffer=c.createBuffer(1,pcm.length,c.sampleRate);buffer.copyToChannel(pcm,0);this.buffers[kind]=buffer;}
      }
      if(!['running','closed'].includes(this.context.state))await this.context.resume();
    }catch{/* Audio failure never interrupts gameplay. */}
  }
  setEnabled(enabled){this.enabled=enabled;try{localStorage.setItem('hexfront-rail-sound',enabled?'on':'off');}catch{}if(!enabled)this.stopAll();else this.unlock();}
  setActive(active){active=!!active&&!globalThis.document?.hidden;if(this.active&&!active)this.stopAll();this.active=active;}
  play(kind,pan=0,offset=0,rate=1){
    const c=this.context;if(!this.active||!this.enabled||!c||!this.buffers?.[kind]||c.state!=='running')return null;
    if([...this.voices].filter(v=>v.kind===kind).length>=(kind==='charge'?4:6)){this.stats.skipped++;return null;}
    const source=c.createBufferSource(),gain=c.createGain(),panner=c.createStereoPanner();source.buffer=this.buffers[kind];source.playbackRate.value=Math.max(.25,rate);
    gain.gain.value=kind==='charge'?.42:kind==='impact'?.65:1;panner.pan.value=Math.max(-.8,Math.min(.8,pan));source.connect(gain);gain.connect(panner);panner.connect(this.master);
    const voice={source,gain,panner,kind,stopped:false,stop:()=>{if(voice.stopped)return;voice.stopped=true;gain.gain.setTargetAtTime(0,c.currentTime,.003);try{source.stop(c.currentTime+.015);}catch{}this.voices.delete(voice);}};
    source.onended=()=>{source.disconnect();gain.disconnect();panner.disconnect();this.voices.delete(voice);};this.voices.add(voice);this.stats[kind]++;source.start(c.currentTime,Math.min(offset,source.buffer.duration-.001));return voice;
  }
  updateCharges(items,rate=1){
    const live=new Set();for(const {id,progress,pan} of items){if(progress<=0||progress>=1)continue;live.add(id);if(!this.charges.has(id))this.charges.set(id,this.play('charge',pan,progress*.35,rate));}
    for(const [id,voice] of this.charges)if(!live.has(id)){voice?.stop();this.charges.delete(id);}
  }
  shot(pan=0,targetPan=pan,rate=1){this.play('shot',pan,0,rate);this.play('impact',targetPan,0,rate);}
  stopAll(){for(const voice of [...this.voices])voice.stop();this.charges.clear();}
  inspect(){return {enabled:this.enabled,active:this.active,state:this.context?.state||'locked',voices:this.voices.size,counts:{...this.stats}};}
}
export const railAudio=new RailAudio();
if(globalThis.document){
  const unlock=()=>railAudio.unlock();document.addEventListener('pointerdown',unlock,{passive:true});document.addEventListener('keydown',unlock);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)railAudio.setActive(false);});globalThis.addEventListener('pagehide',()=>railAudio.setActive(false));
}
export function bindRailSound(input){input.checked=railAudio.enabled;input.addEventListener('change',()=>railAudio.setEnabled(input.checked));}
