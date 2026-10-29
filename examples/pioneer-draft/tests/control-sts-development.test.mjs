import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';

const path=new URL('../control-sts-layer.js',import.meta.url);
const source=readFileSync(path,'utf8');
const decoder=source.match(/export function decodeControlSTSBinary\(buffer\)\{([\s\S]*?)\n\}\nasync function loadReplay/);
assert.ok(decoder,'production binary decoder is available');
const decode=new Function('buffer',decoder[1]);
const bytes=gunzipSync(readFileSync(new URL('../assets/control-sts-development.bin.gz',import.meta.url)));
const data=decode(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));

test('development animations are two actual failed attempts rather than synthetic learning checkpoints',()=>{
 assert.equal(data.schema,'pioneer-control-sts-development-v1');
 assert.equal(data.provenance.notLearningCurve,true);
 assert.equal(data.provenance.poseRepair,false);
 assert.equal(data.provenance.dynamicsCalls,0);
 assert.deepEqual(data.attempts.map(a=>a.id),['early','unstable']);
 for(const attempt of data.attempts){
  const p=attempt.provenance;
  assert.equal(p.taskSuccess,false);
  assert.equal(p.allProtectedSourcesUnchanged,true);
  assert.ok(p.sharedMeshMaxDifferenceM<2e-7);
  assert.equal(attempt.frames.at(-1).sourceIndex,p.sourceIndexRange[1]);
  assert.ok(attempt.frames.at(-1).t<6);
  for(let i=1;i<attempt.frames.length;i++)assert.ok(attempt.frames[i].t>attempt.frames[i-1].t);
  for(const f of attempt.frames){assert.ok(f.p instanceof Float32Array);assert.ok(f.q instanceof Float32Array);assert.equal(f.p.length/3,f.q.length/4);}
 }
});

test('chair rear-leg visual correction matches the original ten-centimetre correction',()=>{
 assert.deepEqual(data.provenance.chairVisualCorrection.geoms,['chair_leg_3','chair_leg_4']);
 assert.deepEqual(data.provenance.chairVisualCorrection.translationSourceM,[.1,0,0]);
 assert.match(source,/visualOffsetSourceM:\['chair_leg_3','chair_leg_4'\]/);
 assert.match(source,/if\(o.mesh.userData.visualOffsetSourceM\)o.mesh.position.x\+=.1/);
});
