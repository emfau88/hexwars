import assert from 'node:assert/strict';
import {railPCM,RailAudio} from '../src/rail-audio.js';
import {test} from 'node:test';
test('Rail audio is deterministic, finite, bounded and fades at both ends',()=>{
 for(const kind of ['charge','shot','impact'])for(const sampleRate of [44100,48000]){
  const a=railPCM(kind,sampleRate),b=railPCM(kind,sampleRate);assert.deepEqual(a,b);assert.ok(a.every(Number.isFinite));assert.ok(a.every(v=>Math.abs(v)<.8));assert.ok(a.some(v=>Math.abs(v)>.1));assert.ok(Math.abs(a[0])<.001&&Math.abs(a.at(-1))<.001);
 }
});
test('Locked or muted audio never queues historical attacks or creates a context',()=>{
 const audio=new RailAudio();audio.setActive(true);for(let i=0;i<40;i++)audio.shot();assert.equal(audio.context,undefined);assert.equal(audio.voices.size,0);assert.equal(audio.stats.shot,0);audio.setEnabled(false);audio.shot();assert.equal(audio.voices.size,0);
});
