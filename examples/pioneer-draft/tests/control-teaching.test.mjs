import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
const data=JSON.parse(readFileSync(new URL('../assets/control-teaching.json',import.meta.url),'utf8'));
test('teaching curves retain distinct torque coordinates, source runs and offline limits',()=>{
 assert.equal(data.schema,'pioneer-control-teaching-v1');assert.equal(data.sourcesUnchanged,true);assert.equal(data.newPhysicsSteps,0);
 assert.match(data.sts.coordinate,/NOT anatomical knee/);assert.equal(data.sts.independentNominalRuns,true);assert.equal(data.sts.targetTorqueNm,4);
 assert.equal(data.stsSearch.candidates.length,6);assert.deepEqual([...new Set(data.stsSearch.candidates.map(c=>c.targetNm))],[2,4,6]);
 assert.ok(data.stsSearch.candidates.every(c=>c.nominalSuccess));assert.equal(data.stsSearch.globalOptimality,false);
 assert.equal(data.walking.sourceSampleHz,50);assert.equal(data.walking.noTimeShiftOrAmplitudeGain,true);assert.match(data.walking.coordinate,/virtual-work/);
 assert.equal(data.offlineReference.powerLimitW,20);assert.equal(data.offlineReference.driveTorqueLimitNm,8);assert.equal(data.offlineReference.nodes,480);assert.equal(data.offlineReference.globalOptimality,false);
 for(const key of ['teacherKneeTorqueNm','studentKneeTorqueNm']){assert.equal(data.walking[key].length,data.walking.timeSec.length);assert.ok(data.walking[key].every(Number.isFinite));}
 assert.ok(data.distillationProgress.at(-1).epoch===400);
});
test('new walking model is the successful sensor student, with saved frames matching the chart window',()=>{
 const code=readFileSync(new URL('../control-walking-layer.js',import.meta.url),'utf8');
 const decode=new Function('buffer',code.match(/export function decodeControlWalkingBinary\(buffer\)\{([\s\S]*?)\n\}\nasync function loadReplay/)[1]);
 const b=gunzipSync(readFileSync(new URL('../assets/control-walking-student.bin.gz',import.meta.url))),v=decode(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));
 assert.equal(v.provenance.sourceWorld,6);assert.equal(v.provenance.nominalCompleteSeconds,30);assert.equal(v.provenance.physicsSteps,0);assert.equal(v.provenance.matchedSpeedQualified,false);
 assert.match(v.provenance.controller,/six-state observer/);assert.ok(v.frames[0].t>=20&&v.frames.at(-1).t<=28);
 for(const f of v.frames){assert.ok(f.p instanceof Float32Array);assert.ok(f.q instanceof Float32Array);assert.equal(f.p.length/3,f.q.length/4);assert.equal(f.values.phaseLabel,'Recorded sensor-student walking');}
});
