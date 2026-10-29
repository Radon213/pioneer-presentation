import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import * as THREE from '../../pioneer-interactive/vendor/three.module.js';
import {decodeSourceBones} from '../gait-source-bones.js';
import {decodeGaitBinary} from '../gait-binary-loader.js';
const bytes=await readFile(new URL('../assets/gait-source-cad-bones.bin.gz',import.meta.url)),raw=gunzipSync(bytes),bones=decodeSourceBones(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength));
const gaitBytes=await readFile(new URL('../assets/gait-chapter-native-rebound.bin',import.meta.url)),gait=decodeGaitBinary(gaitBytes.buffer.slice(gaitBytes.byteOffset,gaitBytes.byteOffset+gaitBytes.byteLength));
test('restored bones are the source simulation group-1 CAD surfaces with verified bilateral geometry',()=>{
 assert.equal(bones.bones.length,4);assert.equal(Object.keys(bones.meshes).length,2);
 assert.equal(bones.provenance.sourceModelSHA256,gait.provenance.sourceModelSHA256);
 for(const role of ['femur','tibia']){assert.equal(bones.provenance.mirrorChecks[role].vertexSetMaxErrorM,0);assert.equal(bones.provenance.mirrorChecks[role].sameTrianglesAt1e7Grid,true);const m=bones.meshes[role];assert.equal(m.positions.length,m.vertices*3);assert.equal(m.indices.length,m.triangles*3);}
 assert.equal(bones.meshes.femur.triangles,423680);assert.equal(bones.meshes.tibia.triangles,437054);
});
test('source bone placements agree with independent saved CAD registrations in every gait frame',()=>{
 for(const spec of bones.bones){const [w,x,y,z]=spec.quaternionWXYZ,local=new THREE.Matrix4().compose(new THREE.Vector3(...spec.position),new THREE.Quaternion(x,y,z,w),new THREE.Vector3(spec.reflectX?-1:1,1,1));
  const reference=new THREE.Matrix4().set(...gait.registrations[spec.side][spec.role==='femur'?'nativeFemurFromSourceCAD':'nativeTibiaFromSourceCAD'].flat());
  const data=bones.meshes[spec.mesh].positions;
  for(const frame of gait.frames){const b=frame.attachment[spec.side][spec.role],body=new THREE.Matrix4().compose(new THREE.Vector3(...b.p),new THREE.Quaternion(...b.q),new THREE.Vector3(1,1,1));
   for(let i=0;i<data.length;i+=Math.floor(data.length/21/3)*3){const p=new THREE.Vector3().fromArray(data,i),actual=p.clone().applyMatrix4(local).applyMatrix4(body),expected=p.clone().applyMatrix4(reference).applyMatrix4(body);assert.ok(actual.distanceTo(expected)<1e-6);}
  }
 }
});
