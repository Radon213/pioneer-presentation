import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {addFemoralReference} from '../hardware-reference.js';
const frames=JSON.parse(fs.readFileSync(new URL('../assets/motion/mechanism-motion.json',import.meta.url))).frames;
const ref=addFemoralReference(frames);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('femoral reference starts at neutral URDF +Z 12 mm, independently of J2',()=>{
 frames[0].femoralReference.forEach((v,i)=>near(v,[0,.012,0][i]));
 assert.ok(Math.hypot(...frames[0].femoralReference.map((v,i)=>v-frames[0].jointCenters.j2[i]))>.01);
});
test('reference stays rigidly bound to the J2–J3 body throughout source replay',()=>{
 for(const f of frames){
  const p=[f.femoralReference[0],-f.femoralReference[2],f.femoralReference[1]],m=f.transformsURDF.condyle_right;
  for(let j=0;j<3;j++)near(p.reduce((sum,v,i)=>sum+m[i][j]*(v-m[i][3]),0),ref.localPoint[j]);
  near(Math.hypot(...f.femoralAxisZ),1);
 }
});
