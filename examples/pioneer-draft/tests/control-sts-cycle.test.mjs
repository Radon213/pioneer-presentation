import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleSitStandCycle} from '../control-sts-cycle.js';
const close=(actual,expected,tolerance=1e-9)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);

test('nominal recorded stand-up repeats without a position or velocity jump',()=>{
 const first=sampleSitStandCycle(0);close(first.sourceTime,0);close(first.sourceRate,0);close(first.cycleDuration,14.6);
 const forward=sampleSitStandCycle(3);close(forward.sourceRate,1);assert.equal(forward.replayDirection,1);assert.equal(forward.telemetryValid,true);
 const epsilon=1e-5;
 for(const boundary of [8.6,9.6,13.6,14.6]){
  const before=sampleSitStandCycle(boundary-epsilon),after=sampleSitStandCycle(boundary+epsilon);
  close(before.sourceTime,after.sourceTime,1e-8);
  close(before.sourceRate,after.sourceRate,1e-7);
 }
 const repeated=sampleSitStandCycle(14.6+3);close(repeated.sourceTime,forward.sourceTime);close(repeated.sourceRate,forward.sourceRate);assert.equal(repeated.cycleIndex,1);
});

test('reverse playback is explicitly a reset and never carries valid result telemetry',()=>{
 const hold=sampleSitStandCycle(9);close(hold.sourceTime,8);assert.equal(hold.phaseLabel,'Standing');
 const reverse=sampleSitStandCycle(11.6);close(reverse.sourceTime,4);assert.equal(reverse.phaseLabel,'Replay reset');assert.equal(reverse.replayDirection,-1);assert.equal(reverse.resetting,true);assert.equal(reverse.telemetryValid,false);
 const seated=sampleSitStandCycle(14);close(seated.sourceTime,0);assert.equal(seated.resetting,true);assert.equal(seated.telemetryValid,false);
});

test('the introductory six-second replay uses the same continuous cycle contract',()=>{
 const options={sourceEnd:6};close(sampleSitStandCycle(0,options).cycleDuration,12.6);
 let previous=sampleSitStandCycle(0,options).sourceTime;
 for(let t=.01;t<12.6;t+=.01){const current=sampleSitStandCycle(t,options);assert.ok(current.sourceTime>=0&&current.sourceTime<=6);assert.ok(Math.abs(current.sourceTime-previous)<.04);previous=current.sourceTime;}
 close(sampleSitStandCycle(6.6,options).sourceTime,6);close(sampleSitStandCycle(12.6,options).sourceTime,0);
});

test('invalid timing cannot create a zero-duration or reversed cycle',()=>{
 assert.throws(()=>sampleSitStandCycle(0,{sourceEnd:0}),RangeError);
 assert.throws(()=>sampleSitStandCycle(0,{returnDuration:0}),RangeError);
 assert.throws(()=>sampleSitStandCycle(0,{forwardEase:0}),RangeError);
 close(sampleSitStandCycle(-1).sourceTime,0);close(sampleSitStandCycle(NaN).sourceTime,0);
});
