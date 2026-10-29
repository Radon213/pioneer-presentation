import test from 'node:test';import assert from 'node:assert/strict';import {sampleSurgerySequence as sample} from '../surgery-sequence.js';
test('polyethylene top inspection finishes before bone cuts and axial insertion',()=>{
 assert.equal(sample(.2).inspect,1);assert.equal(sample(.2).femoralInsertion,0);assert.equal(sample(.2).tibialInsertion,0);
 for(let u=.48;u<=1;u+=.001)assert.equal(sample(u).inspect,0);
 assert.equal(sample(.48).cameraRestore,1);assert.equal(sample(.2).cameraRestore,0);
 assert.equal(sample(.62).separation,1);assert.equal(sample(.62).femoralInsertion,0);
 assert.equal(sample(.76).femoralInsertion,1);assert.ok(sample(.76).tibialInsertion<1);
 assert.equal(sample(.88).tibialInsertion,1);assert.equal(sample(.88).separation,1);
 assert.equal(sample(1).separation,0);assert.equal(sample(1).femoralInsertion,1);assert.equal(sample(1).tibialInsertion,1);
});
