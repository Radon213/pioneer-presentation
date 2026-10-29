import test from 'node:test';
import assert from 'node:assert/strict';
import {createOverallLoadProgress} from '../overall-load-progress.js';
test('overall preparation never resets when a new source starts, and finishes only at scene readiness',()=>{
 const progress=createOverallLoadProgress();assert.equal(progress.value,0);
 let prior=0;
 for(const row of [
 {key:'presentation',stage:'initial-scene'},
 {key:'cad-model',phase:'download',ratio:.8},
 {key:'cad-model',phase:'decode'},
 {key:'cad-model',phase:'ready'},
 {key:'gait',phase:'download',ratio:0},
 {key:'gait',phase:'download',ratio:1},
 {key:'spring-analysis',phase:'download',ratio:.9},
 {key:'myoleg80',phase:'download',ratio:0},
 {key:'gait-meshes',phase:'setup',ratio:1,state:'ready'}
 ]){const value=progress.update(row);assert.ok(value>=prior);assert.ok(value<100);prior=value;}
 assert.equal(progress.finish(),100);assert.equal(progress.value,100);
});
