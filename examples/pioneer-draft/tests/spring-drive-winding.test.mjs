import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleSpringWinding} from '../spring-drive-winding.js';
test('series winding locks output and sums unequal unit deflections',()=>{
 for(let t=0;t<24;t+=.013){const s=sampleSpringWinding(t);assert.equal(s.outputDeg,0);assert.ok(Math.abs(s.weakDeg+s.strongDeg-s.inputDeg)<1e-12);assert.ok(s.weakDeg>=s.strongDeg);assert.ok(s.torqueFraction>=0&&s.torqueFraction<=1);}
 assert.equal(sampleSpringWinding(4).inputDeg,24);assert.equal(sampleSpringWinding(8).inputDeg,0);
});
test('repeat is continuous at both storage and release holds',()=>{
 const dt=1e-5;
 for(const t of [.64,3.68,4.32,7.36,8])assert.ok(Math.abs(sampleSpringWinding(t-dt).inputDeg-sampleSpringWinding(t+dt).inputDeg)<1e-8);
 assert.deepEqual(sampleSpringWinding(2),sampleSpringWinding(10));assert.throws(()=>sampleSpringWinding(0,{periodSec:0}),RangeError);
});
