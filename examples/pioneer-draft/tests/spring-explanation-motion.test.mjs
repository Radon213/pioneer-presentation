import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleSpringExplanationMotion as sample,conceptualContactResponse} from '../spring-explanation-motion.js';
test('illustrative comparison shares torque while compliant input rotates farther',()=>{
 for(let t=0;t<=30;t+=.017){const m=sample(t,1);assert.ok(m.load>=0&&m.load<=1);assert.ok(m.lowDeflectionDeg>=m.highDeflectionDeg);assert.ok(Math.abs(m.lowDeflectionDeg*8-m.highDeflectionDeg*30)<1e-10);}
});
test('contact point is continuous and post-contact curve stiffens',()=>{
 const timeForLoad=u=>Math.acos(1-2*u)*5/Math.PI;
 const left=sample(timeForLoad(.55-1e-7),4),right=sample(timeForLoad(.55+1e-7),4);
 assert.equal(left.contact,false);assert.equal(right.contact,true);
 assert.ok(Math.abs(right.normalizedTorque-left.normalizedTorque)<1e-6);
 const a=sample(timeForLoad(.8),4),b=sample(timeForLoad(.9),4),c=sample(timeForLoad(1),4);
 assert.ok(c.normalizedTorque-b.normalizedTorque>b.normalizedTorque-a.normalizedTorque);
 for(const t of [0,5,10,20])assert.ok(Math.abs(sample(t-1e-6,4).weakDeflectionDeg-sample(t+1e-6,4).weakDeflectionDeg)<1e-8);
});

test('contact onset immediately increases tangent stiffness rather than temporarily softening',()=>{
 assert.ok(conceptualContactResponse(.55+1e-6).slope>2*conceptualContactResponse(.55-1e-6).slope);
 assert.equal(conceptualContactResponse(0).torque,0);assert.ok(Math.abs(conceptualContactResponse(1).torque-1)<1e-12);
});
