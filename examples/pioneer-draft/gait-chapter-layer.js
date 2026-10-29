import {reportLoadStage} from './asset-loading.js?v=revision-20261029-23';
import * as THREE from 'three';
import {loadGaitBinary} from './gait-binary-loader.js';
import {createShadedEdges} from './shaded-edges.js';

/** A saved, physically coupled bilateral device-worn gait, rendered in the
 * parent's existing scene/clock. No solver, video, synthetic gait or own RAF.
 * Source colours and side geometry stay intact; right meshes are already the
 * actual source reflection and must not be mirrored again.
 */
export async function createGaitChapterLayer(scene,{human}={}){
 const data=await loadGaitBinary();
 reportLoadStage('gait-meshes','Building walking meshes',{ratio:0});
 if(data.schema!=='pioneer-gait-chapter-v1'||data.frames.length<2)throw Error('Recorded gait asset schema is invalid.');
 const meshBuildStarted=performance.now();
 const group=new THREE.Group();group.name='ActualRecordedBilateralGait';
 const sourceGroup=new THREE.Group();sourceGroup.name='GaitSource_Zup_to_Yup';sourceGroup.rotation.x=-Math.PI/2;group.add(sourceGroup);scene.add(group);
 group.userData={source:data.provenance,classification:data.provenance.classification,sourceTraceSHA256:data.provenance.sourceTraceSHA256,measuredClinicalData:false,assistanceBenefit:false,independentRenderer:false,retainedNativeShaftCount:4,geometryCount:data.geoms.length,frameCount:data.frames.length,loadingMetrics:data.loadingMetrics};
 const C=new THREE.Matrix4().makeRotationX(-Math.PI/2),Ci=C.clone().invert();
 const geometries=new Set(),materials=new Set(),cache=new Map(),objects=[],edgeHelpers=[];
 const unit=new THREE.Vector3(1,1,1),positionB=new THREE.Vector3(),quaternionB=new THREE.Quaternion();
 let progress=0,opacity=1,implantOpacity=1,anatomyOpacity=1,muscleOpacity=1,disposed=false,frameA=data.frames[0],frameB=data.frames[0],mix=0;
 function geometryFor(geom){
  if(geom.type===7){if(cache.has(geom.mesh))return cache.get(geom.mesh);const raw=data.meshes[geom.mesh],g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(raw.positions,3));g.setIndex(new THREE.BufferAttribute(raw.indices,1));if(raw.normals)g.setAttribute('normal',new THREE.BufferAttribute(raw.normals,3));else g.computeVertexNormals();if(raw.featureEdges)g.userData.precomputedFeatureEdges=raw.featureEdges;g.computeBoundingBox();geometries.add(g);cache.set(geom.mesh,g);return g;}
  const s=geom.size;let g;
  if(geom.type===2)g=new THREE.SphereGeometry(s[0],18,12);
  else if(geom.type===3){g=new THREE.CapsuleGeometry(s[0],s[1]*2,5,12);g.rotateX(Math.PI/2);}
  else if(geom.type===4){g=new THREE.SphereGeometry(1,18,12);g.scale(...s);}
  else if(geom.type===5){g=new THREE.CylinderGeometry(s[0],s[0],s[1]*2,20);g.rotateX(Math.PI/2);}
  else if(geom.type===6)g=new THREE.BoxGeometry(s[0]*2,s[1]*2,s[2]*2);
  else throw Error(`Unsupported recorded gait geom ${geom.type}`);
  g.computeBoundingBox();geometries.add(g);return g;
 }
 for(const [index,geom] of data.geoms.entries()){
  const implant=geom.role==='implant',material=new THREE.MeshStandardMaterial({color:new THREE.Color(...geom.rgba.slice(0,3)),roughness:implant?.38:.69,metalness:implant?.42:0,opacity:geom.rgba[3],transparent:geom.rgba[3]<1,side:THREE.DoubleSide});materials.add(material);
  const mesh=new THREE.Mesh(geometryFor(geom),material);mesh.name=geom.name;mesh.userData={sourceGeomId:geom.id,sourceMesh:geom.mesh,sourceRGBA:[...geom.rgba],role:geom.role,side:geom.side,sourceReflectedGeometry:geom.side==='right'};sourceGroup.add(mesh);objects.push({mesh,material,geom,index});
  if(implant)edgeHelpers.push(createShadedEdges(mesh,{thresholdAngle:28,color:0x2e3932,opacity:.26}));
  if(index%16===0){reportLoadStage('gait-meshes','Building walking meshes',{ratio:(index+1)/data.geoms.length});await new Promise(requestAnimationFrame);}
 }
 // Restore retained native shafts omitted by the device model's visual export.
 // Bone-local placement is recovered from the native STS frame; every gait pose
 // uses the saved femur/tibia body frames, with only the implant joint end hidden.
 const retainedBones=[];
 if(human){
  const native=human.sourceData,af=human.attachmentData.frames.at(-1),nf=native.frames.at(-1),matrix=(v)=>new THREE.Matrix4().compose(new THREE.Vector3(...v.p),new THREE.Quaternion(...v.q),unit);
  for(const side of ['left','right'])for(const role of ['femur','tibia']){
   const name=`${role}_${side==='left'?'l':'r'}_geom_1`,index=native.geoms.findIndex(g=>g.name===name),raw=human.sourceGroup.getObjectByName(name);if(index<0||!raw)throw Error(`Missing native shaft ${name}`);
   const local=matrix(af[side][role]).invert().multiply(new THREE.Matrix4().compose(new THREE.Vector3().fromArray(nf.p,index*3),new THREE.Quaternion().fromArray(nf.q,index*4),unit));
   const material=new THREE.MeshStandardMaterial({color:0xc8c5b8,roughness:.76,side:THREE.DoubleSide});materials.add(material);
   const clip={center:{value:new THREE.Vector3()},up:{value:new THREE.Vector3()}};
   material.onBeforeCompile=shader=>{Object.assign(shader.uniforms,{uShaftKnee:clip.center,uShaftUp:clip.up});shader.vertexShader='varying vec3 vShaftWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvShaftWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');shader.fragmentShader='varying vec3 vShaftWorld;uniform vec3 uShaftKnee;uniform vec3 uShaftUp;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat h=dot(vShaftWorld-uShaftKnee,uShaftUp);if(${role==='femur'?'h<.055':'h>-.055'})discard;`);};
   material.customProgramCacheKey=()=>`retained-gait-shaft-${role}`;
   const mesh=new THREE.Mesh(raw.geometry,material);mesh.name=`Restored_${name}`;mesh.matrixAutoUpdate=false;sourceGroup.add(mesh);retainedBones.push({mesh,material,local,side,role,clip});
  }
 }
 reportLoadStage('gait-meshes','Walking meshes ready' ,{ratio:1,state:'ready'});
 const muscleGeometry=new THREE.CylinderGeometry(1,1,1,8,1),muscleMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.74,metalness:0,transparent:true,opacity:.88});geometries.add(muscleGeometry);materials.add(muscleMaterial);
 const capacity=Math.max(...data.frames.map(frame=>frame.tendons.reduce((n,p)=>n+Math.max(0,p.length/3-1),0)));
 const muscles=new THREE.InstancedMesh(muscleGeometry,muscleMaterial,capacity);muscles.name='RecordedGaitTendonWrapPaths';muscles.frustumCulled=false;sourceGroup.add(muscles);
 const dummy=new THREE.Object3D(),a=new THREE.Vector3(),b=new THREE.Vector3(),delta=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),rgb=new THREE.Color();
 function updateMuscles(){
  let count=0;
  data.tendons.forEach((tendon,j)=>{
   let pa=frameA.tendons[j],pb=frameB.tendons[j];if(pa.length!==pb.length)pa=pb=mix<.5?pa:pb;
   rgb.setRGB(...tendon.rgba.slice(0,3));
   for(let k=0;k<pa.length/3-1;k++){
    a.fromArray(pa,k*3).lerp(positionB.fromArray(pb,k*3),mix);b.fromArray(pa,(k+1)*3).lerp(positionB.fromArray(pb,(k+1)*3),mix);delta.subVectors(b,a);const length=delta.length();
    dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,length>1e-10?delta.divideScalar(length):up);dummy.scale.set(tendon.width,length,tendon.width);dummy.updateMatrix();muscles.setMatrixAt(count,dummy.matrix);muscles.setColorAt(count,rgb);count++;
   }
  });
  muscles.count=count;muscles.instanceMatrix.needsUpdate=true;if(muscles.instanceColor)muscles.instanceColor.needsUpdate=true;
 }
 function refreshOpacity(){
  group.visible=opacity>.0001;
  for(const o of objects){const alpha=opacity*(o.geom.role==='implant'?implantOpacity:anatomyOpacity)*o.geom.rgba[3];o.material.opacity=alpha;o.material.transparent=alpha<.999;o.material.depthWrite=alpha>.97;o.mesh.visible=alpha>.0001;}
  for(const bone of retainedBones){bone.mesh.visible=opacity*anatomyOpacity>.001;bone.material.opacity=opacity*anatomyOpacity;bone.material.transparent=bone.material.opacity<.999;bone.material.depthWrite=bone.material.opacity>.97;}
  muscleMaterial.opacity=opacity*anatomyOpacity*muscleOpacity*.88;muscles.visible=muscleMaterial.opacity>.0001;muscleMaterial.depthWrite=muscleMaterial.opacity>.97;
  edgeHelpers.forEach(edge=>edge.sync());Object.assign(group.userData,{opacity,implantOpacity,anatomyOpacity,muscleOpacity});
 }
 function setProgress(value){
  if(disposed)return;progress=THREE.MathUtils.clamp(Number(value)||0,0,1);const x=progress*(data.frames.length-1),i=Math.floor(x),j=Math.min(i+1,data.frames.length-1);mix=x-i;frameA=data.frames[i];frameB=data.frames[j];
  for(const o of objects){o.mesh.position.fromArray(frameA.p,o.index*3).lerp(positionB.fromArray(frameB.p,o.index*3),mix);o.mesh.quaternion.fromArray(frameA.q,o.index*4).slerp(quaternionB.fromArray(frameB.q,o.index*4),mix);}
  for(const bone of retainedBones){const A=frameA.attachment[bone.side],B=frameB.attachment[bone.side],v=A[bone.role],w=B[bone.role];const M=new THREE.Matrix4().compose(new THREE.Vector3(...v.p).lerp(new THREE.Vector3(...w.p),mix),new THREE.Quaternion(...v.q).slerp(new THREE.Quaternion(...w.q),mix),unit);bone.mesh.matrix.copy(M.multiply(bone.local));const world=group.matrixWorld.clone().multiply(C);bone.clip.center.value.copy(new THREE.Vector3(...A.knee).lerp(new THREE.Vector3(...B.knee),mix).applyMatrix4(world));bone.clip.up.value.set(0,0,1).transformDirection(world);}
  updateMuscles();group.updateMatrixWorld(true);Object.assign(group.userData,{progress,sourceTime:THREE.MathUtils.lerp(frameA.t,frameB.t,mix),sourceFrameIndices:[frameA.sourceIndex,frameB.sourceIndex],tendonSegments:muscles.count});
 }
 const clamp=v=>THREE.MathUtils.clamp(Number(v)||0,0,1);
 function setOpacity(value){if(disposed)return;opacity=clamp(value);refreshOpacity();}
 function setState(next={}){if(next.opacity!==undefined)opacity=clamp(next.opacity);if(next.implantOpacity!==undefined)implantOpacity=clamp(next.implantOpacity);if(next.anatomyOpacity!==undefined)anatomyOpacity=clamp(next.anatomyOpacity);if(next.muscleOpacity!==undefined)muscleOpacity=clamp(next.muscleOpacity);if(next.progress!==undefined)setProgress(next.progress);refreshOpacity();}
 function sourceToWorld(){group.updateWorldMatrix(true,false);return group.matrixWorld.clone().multiply(C);}
 function getKneeAnchor(side='left'){
  const s=side==='right'?'right':'left';return new THREE.Vector3().fromArray(frameA.attachment[s].knee).lerp(positionB.fromArray(frameB.attachment[s].knee),mix).applyMatrix4(sourceToWorld());
 }
 function getAttachment(side='left'){
  const s=side==='right'?'right':'left',A=frameA.attachment[s],B=frameB.attachment[s],world=sourceToWorld();
  const body=role=>{const p=new THREE.Vector3().fromArray(A[role].p).lerp(new THREE.Vector3().fromArray(B[role].p),mix),q=new THREE.Quaternion().fromArray(A[role].q).slerp(new THREE.Quaternion().fromArray(B[role].q),mix);return world.clone().multiply(new THREE.Matrix4().compose(p,q,unit));};
  const femur=body('femur'),tibia=body('tibia'),r=data.registrations[s],registration=key=>new THREE.Matrix4().set(...r[key].flat());
  return {side:s,kneeAnchor:getKneeAnchor(s),kneeAxis:new THREE.Vector3().fromArray(A.axis).lerp(new THREE.Vector3().fromArray(B.axis),mix).transformDirection(world),nativeFlexionRad:THREE.MathUtils.lerp(A.nativeFlexionRad,B.nativeFlexionRad,mix),femur,tibia,cadToWorldFemur:femur.clone().multiply(registration('nativeFemurFromSourceCAD')).multiply(Ci),cadToWorldTibia:tibia.clone().multiply(registration('nativeTibiaFromSourceCAD')).multiply(Ci),rightReflectionAlreadyIncluded:s==='right',classification:'actual saved device-worn gait bone frames; source CAD registration'};
 }
 let motionBounds;
 function getBounds(){
  if(!motionBounds){motionBounds=new THREE.Box3();const P=new THREE.Vector3(),Q=new THREE.Quaternion(),M=new THREE.Matrix4();for(const frame of data.frames)for(const o of objects){P.fromArray(frame.p,o.index*3);Q.fromArray(frame.q,o.index*4);M.copy(C).multiply(new THREE.Matrix4().compose(P,Q,unit));motionBounds.union(o.mesh.geometry.boundingBox.clone().applyMatrix4(M));}}
  group.updateWorldMatrix(true,false);return motionBounds.clone().applyMatrix4(group.matrixWorld);
 }
 setProgress(0);refreshOpacity();
 data.loadingMetrics.meshBuildMs=performance.now()-meshBuildStarted;
 return {ready:true,group,sourceGroup,source:data.provenance,data,durationSeconds:data.provenance.durationSeconds,setProgress,getBounds,getKneeAnchor,getAttachment,setOpacity,setState,
  setImplantOpacity(value){implantOpacity=clamp(value);refreshOpacity();},
  dispose(){if(disposed)return;disposed=true;scene.remove(group);edgeHelpers.forEach(edge=>edge.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
 };
}
