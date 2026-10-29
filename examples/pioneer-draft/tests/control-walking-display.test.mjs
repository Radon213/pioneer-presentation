import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createWalkingDisplaySeries,sampleWalkingTelemetry} from '../control-walking-telemetry.js';
const raw=JSON.parse(fs.readFileSync(new URL('../assets/control-walking-diagnostic.json',import.meta.url)));
test('display smoothing preserves source arrays, source peak and every raw limit event',()=>{
 const before=JSON.stringify(raw),s=createWalkingDisplaySeries(raw);
 assert.equal(JSON.stringify(raw),before);assert.notEqual(s.timeSec,raw.timeSec);assert.notEqual(s.requestedTorqueNm,raw.requestedTorqueNm);
 assert.equal(s.rawPeak.motorPowerW,Math.max(...raw.motorPowerW));assert.equal(s.rawPeak.motorPowerW,26.95482063293457);assert.equal(s.rawPeak.timeSec,27.19);assert.equal(s.rawPeak.exceedsLimit,true);
 assert.equal(s.failurePeakW,raw.failurePeakW);assert.equal(s.qualified,false);assert.equal(s.rawPowerLimitEvents.at(-1).endTimeSec,27.19);
 assert.equal(s.displaySmoothing.sourceSamplesModified,false);assert.equal(s.displaySmoothing.classification,'DISPLAY_ONLY_TIME_AVERAGE');
 const variation=v=>v.slice(1).reduce((sum,x,i)=>sum+Math.abs(x-v[i]),0);
 assert.ok(variation(s.requestedTorqueNm)<variation(raw.requestedTorqueNm)*.6);
 assert.ok(variation(s.motorPowerW)<variation(raw.motorPowerW)*.6);
 assert.ok(sampleWalkingTelemetry(s,27.185).motorPowerW<sampleWalkingTelemetry(raw,27.185).motorPowerW);
});
test('averaging uses time duration instead of counting nonuniform samples',()=>{
 const x={timeSec:[0,.1,1],requestedTorqueNm:[0,1,10],appliedTorqueNm:[0,1,10],motorPowerW:[0,1,10],powerLimitW:5};
 const s=createWalkingDisplaySeries(x,{torqueWindowSec:.2,powerWindowSec:.2});
 assert.ok(Math.abs(s.requestedTorqueNm[1]-1)<1e-12);assert.ok(Math.abs(s.motorPowerW.at(-1)-9)<1e-12);
 assert.equal(s.motorPowerW[0],0);assert.deepEqual(s.rawPowerLimitEvents,[{startIndex:2,endIndex:2,startTimeSec:1,endTimeSec:1,peakPowerW:10,peakTimeSec:1}]);
});
test('zero windows retain exact knots and a power average never anticipates a later spike',()=>{
 const x={timeSec:[0,1,2,3],requestedTorqueNm:[0,0,0,100],appliedTorqueNm:[0,0,0,100],motorPowerW:[0,0,0,100],powerLimitW:25};
 const zero=createWalkingDisplaySeries(x,{torqueWindowSec:0,powerWindowSec:0});assert.deepEqual(zero.motorPowerW,x.motorPowerW);assert.deepEqual(zero.requestedTorqueNm,x.requestedTorqueNm);
 const s=createWalkingDisplaySeries(x,{torqueWindowSec:1,powerWindowSec:1});assert.equal(s.motorPowerW[2],0);assert.equal(s.motorPowerW[3],50);assert.equal(s.rawPeak.motorPowerW,100);
});
