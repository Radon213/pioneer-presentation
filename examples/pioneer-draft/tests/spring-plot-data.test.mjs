import test from 'node:test';
import assert from 'node:assert/strict';
import {springResponsePoints,responseAtAngle} from '../spring-plot-data.js';

test('angle-aligned marker retains all finite supplied design points including a torque decrease',()=>{
 assert.equal(springResponsePoints.length,34);
 assert.ok(springResponsePoints.some((p,i)=>i&&p.torqueNm<springResponsePoints[i-1].torqueNm));
 for(const p of springResponsePoints)assert.ok(Math.abs(responseAtAngle(p.angleDeg)-p.torqueNm)<1e-10);
});
test('angle alignment stays on the original piecewise linear curve and never extrapolates',()=>{
 const a=springResponsePoints[10],b=springResponsePoints[11];
 assert.ok(Math.abs(responseAtAngle((a.angleDeg+b.angleDeg)/2)-(a.torqueNm+b.torqueNm)/2)<1e-10);
 assert.equal(responseAtAngle(0),null);
 assert.equal(responseAtAngle(121),null);
 assert.equal(responseAtAngle(NaN),null);
});
