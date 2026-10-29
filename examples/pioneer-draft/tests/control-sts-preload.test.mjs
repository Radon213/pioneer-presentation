import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {preloadTorqueNm} from '../control-preload-data.js';
const source=readFileSync(new URL('../control-sts-layer.js',import.meta.url),'utf8');
const decode=new Function('buffer',source.match(/export function decodeControlSTSBinary\(buffer\)\{([\s\S]*?)\n\}\nasync function loadReplay/)[1]);
const b=gunzipSync(readFileSync(new URL('../assets/control-sts-preload.bin.gz',import.meta.url))),data=decode(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));
test('higher-preload example is a successful source recording with preserved teacher provenance',()=>{
 const p=data.provenance,report=JSON.parse(readFileSync(new URL('../../../docs/control-sts-preload-provenance.json',import.meta.url),'utf8'));
 assert.equal(data.schema,'pioneer-control-sts-preload-v1');assert.equal(p.taskSuccess,true);assert.equal(p.completeDuration,true);assert.equal(p.physicsSteps,0);assert.equal(p.poseRepair,false);assert.equal(p.sharedMeshMaxDifferenceM,0);assert.equal(report.allProtectedSourcesUnchanged,true);
 assert.match(p.classification,/TEACHER/);assert.equal(p.teacherTargetTorqueNm,6);assert.equal(p.qualified,false);
 assert.ok(p.finalQuietStandSeconds>13);assert.equal(data.frames[0].t,0);assert.equal(data.frames.at(-1).t,18);
 const peak=Math.max(...data.frames.map(f=>f.values.springTorqueNm));assert.equal(peak,p.peakSpringTorqueNm);assert.ok(peak>5.48&&peak<5.50);
 assert.ok(data.frames.some(f=>f.sourceIndex===p.exactPeakSourceIndex));
 for(const f of data.frames.slice(1)){assert.equal(f.p.length/3,f.q.length/4);assert.equal(f.tendons.length,26);assert.ok(Math.abs(preloadTorqueNm(f.values.springDeflectionDeg)-f.values.springTorqueNm)<1e-5);}
});
