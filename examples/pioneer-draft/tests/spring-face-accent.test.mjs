import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../../pioneer-interactive/vendor/three.module.js';
const threeURL=new URL('../../pioneer-interactive/vendor/three.module.js',import.meta.url).href;
const source=(await readFile(new URL('../spring-face-accent.js',import.meta.url),'utf8')).replace("'three'",JSON.stringify(threeURL));
const {springFaceBoundary,applyOppositeSpringFace}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));

test('spring face accent follows actual CAD boundaries and cancels triangulation seams',()=>{
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([.005,.001,-.0223,.006,.001,-.0223,.006,.002,-.0223,.005,.002,-.0223],3));geometry.setIndex([0,1,2,0,2,3]);
  const p={name:'weak_spring_top',mesh:new THREE.Mesh(geometry),axisPoint:new THREE.Vector3(),axis:new THREE.Vector3(0,0,1),band:[-.0223,-.0163]};
  const before=Array.from(geometry.index.array),boundary=springFaceBoundary(p);
  assert.equal(boundary.segmentCount,4);assert.deepEqual(Array.from(geometry.index.array),before);
  for(const point of boundary.points)assert.ok(Math.abs(point.z-(-.0223-.000035))<1e-7);
});

test('showing the opposite spiral face preserves its real axial centre in a transformed assembly',()=>{
  const parent=new THREE.Group(),mesh=new THREE.Mesh(new THREE.BufferGeometry());parent.position.set(.1,-.2,.3);parent.rotation.set(.2,.5,-.3);parent.add(mesh);mesh.position.set(.01,.02,.03);parent.updateMatrixWorld(true);
  const p={name:'strong_spring_bottom',mesh,axisPoint:new THREE.Vector3(.003,.063,.012),axis:new THREE.Vector3(-.121869,-.992546,0).normalize(),normal:new THREE.Vector3(0,0,1),band:[-.0443,-.0243]};
  const center=()=>p.axisPoint.clone().addScaledVector(p.axis,(p.band[0]+p.band[1])*.5).applyMatrix4(mesh.matrixWorld),beforeCenter=center(),beforeAxis=p.axis.clone().transformDirection(mesh.matrixWorld);
  applyOppositeSpringFace(p,1);
  assert.ok(center().distanceTo(beforeCenter)<1e-10);assert.ok(beforeAxis.dot(p.axis.clone().transformDirection(mesh.matrixWorld))<-.999999);
});
