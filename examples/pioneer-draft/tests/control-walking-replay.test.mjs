import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {gunzipSync} from 'node:zlib';
import {sampleWalkingTelemetry} from '../control-walking-telemetry.js';
const here=new URL('../',import.meta.url);
const series=JSON.parse(fs.readFileSync(new URL('assets/control-walking-diagnostic.json',here)));
function decode(){
 const source=fs.readFileSync(new URL('control-walking-layer.js',here),'utf8');
 const fn=source.slice(source.indexOf('export function decodeControlWalkingBinary'),source.indexOf('async function loadReplay')).replace('export function','function');
 const run=vm.runInNewContext(`${fn};decodeControlWalkingBinary`,{Uint8Array,DataView,TextDecoder,Float32Array,Uint32Array,JSON,Object,Number,Error,Math});
 const bytes=gunzipSync(fs.readFileSync(new URL('assets/control-walking.bin.gz',here)));return run(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
}
test('recorded walking source matches graph source and retains all actual pose endpoints',()=>{
 const d=decode();assert.equal(d.schema,'pioneer-control-walking-v1');assert.equal(d.provenance.sourceWorld,1);assert.equal(d.provenance.sourceTraceSHA256,series.sourceSHA256);assert.equal(d.provenance.physicsSteps,0);assert.equal(d.frames[0].t,.01);assert.equal(d.frames.at(-1).t,27.19);assert.equal(d.frames.at(-1).sourceIndex,2718);assert.equal(d.provenance.assistanceBenefit,false);assert.equal(d.provenance.qualified,false);
 for(const frame of d.frames){assert.equal(frame.p.length,d.geoms.length*3);assert.equal(frame.q.length,d.geoms.length*4);assert.ok(frame.p.every(Number.isFinite));assert.ok(frame.q.every(Number.isFinite));}
 assert.ok(d.frames.at(-1).values.motorPowerW>25);
});
test('display interpolation is continuous and reproduces every original telemetry knot',()=>{
 assert.equal(series.timeSec.length,2719);
 for(const i of [0,1,1200,2600,2718]){const s=sampleWalkingTelemetry(series,series.timeSec[i]);for(const k of ['requestedTorqueNm','appliedTorqueNm','motorPowerW'])assert.ok(Math.abs(s[k]-series[k][i])<1e-9);}
 const i=2717,t=(series.timeSec[i]+series.timeSec[i+1])/2,m=sampleWalkingTelemetry(series,t);assert.ok(Math.abs(m.motorPowerW-(series.motorPowerW[i]+series.motorPowerW[i+1])/2)<1e-9);assert.ok(m.motorPowerW>25);assert.ok(sampleWalkingTelemetry(series,999).motorPowerW>25);
});
