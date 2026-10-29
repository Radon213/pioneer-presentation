import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const d=JSON.parse(fs.readFileSync(new URL('../assets/control-walking-diagnostic.json',import.meta.url)));
test('walking diagnostic retains the physical failure and distinguishes requested from realized torque',()=>{
 const n=d.timeSec.length;assert.equal(d.qualified,false);assert.equal(d.failureTimeSec,27.19);assert.equal(d.powerLimitW,25);
 assert.ok(n>20);for(const key of ['requestedTorqueNm','appliedTorqueNm','motorPowerW']){assert.equal(d[key].length,n);assert.ok(d[key].every(Number.isFinite));}
 assert.ok(d.requestedTorqueNm.at(-1)>d.appliedTorqueNm.at(-1)+1.8);assert.ok(d.motorPowerW.at(-1)>d.powerLimitW);assert.ok(Math.abs(d.motorPowerW.at(-1)-26.95482063293457)<1e-6);
 assert.ok(d.timeSec.every((x,i)=>!i||x>d.timeSec[i-1]));
});
