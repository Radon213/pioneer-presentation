import {loadJSONWithProgress} from './asset-loading.js?v=revision-20261029-28';
import * as THREE from 'three';

/** One-scene replay of the actual native-muscle STS reference.
 * CAD-to-bone matrices come from the source bilateral model, not a display Euler
 * rotation. The implant graft remains illustrative: this trace contains no AAKJ.
 */
export async function createContinuousHumanLayer(scene,{side='left'}={}){
 const load=name=>loadJSONWithProgress(new URL(`./assets/${name}`,import.meta.url),{key:name,label:name==='simulation-scene.json'?'Native musculoskeletal model':'Bilateral attachment frames'});
 const [data,attachments]=await Promise.all([load('simulation-scene.json'),load('bilateral-sts-attachments.json')]);
 if(data.provenance.trace_sha256!==attachments.provenance.trace_sha256||data.frames.length!==attachments.frames.length)throw Error('Native replay and bilateral attachment sources differ.');
 const defaultSide=side==='right'?'right':'left';
 let focusLeft=0,anatomyFlexion=0,anatomySeparation=0,upperOpacity=1,anatomyInspect=0;
 const group=new THREE.Group();group.name='ActualRecordedBilateralSTS';
 group.userData={source:'assets/simulation-scene.json',attachmentSource:'assets/bilateral-sts-attachments.json',classification:attachments.classification,episode:data.provenance.episode_index,defaultSide,activeAssistance:false,registration:'Source bilateral CAD registration; native recorded movement with illustrative graft'};
 const C=new THREE.Matrix4().makeRotationX(-Math.PI/2),Ci=C.clone().invert();
 const source=new THREE.Group();source.name='MuJoCo_Zup_to_viewer_Yup';source.matrixAutoUpdate=false;source.matrix.copy(C);group.add(source);scene.add(group);
 const cache=new Map(),geometries=new Set(),materials=new Set(),objects=[];
 const clips=Object.fromEntries(['left','right'].map(s=>[s,{amount:{value:0},center:{value:new THREE.Vector3()},radius:{value:.052}}]));
 const registrations={};for(const s of ['left','right']){
  const r=attachments.registrations[s];registrations[s]={femur:new THREE.Matrix4().set(...r.nativeFemurFromSourceCAD.flat()),tibia:new THREE.Matrix4().set(...r.nativeTibiaFromSourceCAD.flat())};
 }
 const roleNames={femoral:'femur',tibial:'tibia',mechanism:'intermediate'},partRoles={};
 for(const [role,names] of Object.entries(attachments.componentGroups))for(const name of names)partRoles[name]=roleNames[role];
 // The two CAD retained-bone links are separate from the 49 hardware geoms.
 partRoles.femur_medium='femur';partRoles.tibia_medium='tibia';
 const getPartRole=name=>partRoles[String(name).toLowerCase().replace(/^aakj_/,'').split('::')[0].replace(/_visual$/,'')]||'intermediate';
 let reveal=0,replaceLeft=0,replaceRight=0,muscleReveal=1,chairReveal=0,motionProgress=1,disposed=false;
 let currentFrameA=data.frames.at(-1),currentFrameB=currentFrameA,currentAttachmentA=attachments.frames.at(-1),currentAttachmentB=currentAttachmentA,frameMix=0;
 const tempPosition=new THREE.Vector3(),tempQuaternion=new THREE.Quaternion(),quatB=new THREE.Quaternion();
 function makeGeometry(geom){
  if(geom.type===7){if(cache.has(geom.mesh))return cache.get(geom.mesh);const raw=data.meshes[geom.mesh],g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(raw.positions,3));g.setIndex(raw.indices);g.computeVertexNormals();g.computeBoundingBox();cache.set(geom.mesh,g);geometries.add(g);return g;}
  const s=geom.size;let g;
  if(geom.type===2)g=new THREE.SphereGeometry(s[0],20,14);
  else if(geom.type===3){g=new THREE.CapsuleGeometry(s[0],s[1]*2,5,12);g.rotateX(Math.PI/2);}
  else if(geom.type===4){g=new THREE.SphereGeometry(1,20,14);g.scale(...s);}
  else if(geom.type===5){g=new THREE.CylinderGeometry(s[0],s[0],s[1]*2,20);g.rotateX(Math.PI/2);}
  else if(geom.type===6)g=new THREE.BoxGeometry(s[0]*2,s[1]*2,s[2]*2);
  else g=new THREE.SphereGeometry(.005,10,8);
  g.computeBoundingBox();geometries.add(g);return g;
 }
 function localKneeCut(material,limb){
  const clip=clips[limb];
  material.onBeforeCompile=shader=>{
   shader.uniforms.uNativeKneeCut=clip.amount;shader.uniforms.uNativeKneeCenter=clip.center;shader.uniforms.uNativeKneeRadius=clip.radius;
   shader.vertexShader='varying vec3 vNativeKneeWorld;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvNativeKneeWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
   shader.fragmentShader='varying vec3 vNativeKneeWorld;\nuniform float uNativeKneeCut;\nuniform vec3 uNativeKneeCenter;\nuniform float uNativeKneeRadius;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float nearNativeKnee=1.0-smoothstep(uNativeKneeRadius*.82,uNativeKneeRadius,distance(vNativeKneeWorld,uNativeKneeCenter));
    float nativeRemoval=nearNativeKnee*uNativeKneeCut;
    if(nativeRemoval>.995)discard;
    diffuseColor.a*=(1.0-nativeRemoval);`);
  };
  material.customProgramCacheKey=()=>`continuous-native-knee-local-resection-${limb}-v2`;
 }
 for(let i=0;i<data.geoms.length;i++){
  const geom=data.geoms[i];if(geom.type===0)continue;
  const rgba=geom.rgba,isChair=/^chair_|^seat$/i.test(geom.name);
  const limb=/^(femur|tibia)_l_geom_1$/.test(geom.name)?'left':(/^(femur|tibia)_r_geom_1$/.test(geom.name)?'right':null);
  const material=new THREE.MeshStandardMaterial({color:new THREE.Color(...rgba.slice(0,3)),opacity:0,transparent:true,roughness:.7,metalness:0,side:THREE.DoubleSide});
  if(limb)localKneeCut(material,limb);
  const mesh=new THREE.Mesh(makeGeometry(geom),material);mesh.name=geom.name;mesh.userData={sourceGeomId:geom.id,sourceMesh:geom.mesh,nativeLocalResection:!!limb,sourceRGBA:rgba,recordedChair:isChair};
  source.add(mesh);objects.push({mesh,material,baseAlpha:rgba[3],limb,isChair,index:i});materials.add(material);
 }
 const muscleGeometry=new THREE.CylinderGeometry(1,1,1,8,1);geometries.add(muscleGeometry);
 const muscleMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.75,transparent:true,opacity:0});materials.add(muscleMaterial);
 const capacity=Math.max(...data.frames.map(f=>f.tendons.reduce((n,p)=>n+Math.max(0,p.length/3-1),0)));
 const muscles=new THREE.InstancedMesh(muscleGeometry,muscleMaterial,capacity);muscles.name='ActualRecordedTendonWrapPaths';muscles.frustumCulled=false;source.add(muscles);
 const dummy=new THREE.Object3D(),a=new THREE.Vector3(),b=new THREE.Vector3(),dir=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 const interpolatePoint=(out,fa,fb,offset)=>{out.fromArray(fa,offset);tempPosition.fromArray(fb,offset);out.lerp(tempPosition,frameMix);return out;};
 function updateMuscles(){
  let index=0;
  data.tendons.forEach((tendon,j)=>{
   if(focusLeft>.999&&tendon.name.includes('_r_'))return;
   let pa=currentFrameA.tendons[j],pb=currentFrameB.tendons[j];
   // Wrap topology can change at a real contact event; switch source topology
   // rather than inventing extra path points between mismatched wrap arrays.
   if(pa.length!==pb.length){pa=pb=frameMix<.5?pa:pb;}
   const rgb=new THREE.Color().setRGB(...tendon.rgba.slice(0,3));
   for(let k=0;k<pa.length/3-1;k++){
    interpolatePoint(a,pa,pb,k*3);interpolatePoint(b,pa,pb,(k+1)*3);dir.subVectors(b,a);const length=dir.length();
    dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,length>1e-10?dir.divideScalar(length):up);dummy.scale.set(tendon.width*(tendon.name.includes('_r_')?1-focusLeft:1),length,tendon.width*(tendon.name.includes('_r_')?1-focusLeft:1));dummy.updateMatrix();muscles.setMatrixAt(index,dummy.matrix);muscles.setColorAt(index,rgb);index++;
   }
  });
  muscles.count=index;muscles.instanceMatrix.needsUpdate=true;if(muscles.instanceColor)muscles.instanceColor.needsUpdate=true;
 }
 function applyFrame(p){
  motionProgress=THREE.MathUtils.clamp(Number(p)||0,0,1);const x=motionProgress*(data.frames.length-1),i=Math.floor(x),j=Math.min(i+1,data.frames.length-1);frameMix=x-i;
  currentFrameA=data.frames[i];currentFrameB=data.frames[j];currentAttachmentA=attachments.frames[i];currentAttachmentB=attachments.frames[j];
  for(const o of objects){const k=o.index;o.mesh.position.fromArray(currentFrameA.p,k*3).lerp(tempPosition.fromArray(currentFrameB.p,k*3),frameMix);o.mesh.quaternion.fromArray(currentFrameA.q,k*4).slerp(quatB.fromArray(currentFrameB.q,k*4),frameMix);}
  updateMuscles();Object.assign(group.userData,{motionProgress,frameTime:THREE.MathUtils.lerp(currentFrameA.t,currentFrameB.t,frameMix),frameIndices:[i,j],muscleSegments:muscles.count});
 }
 function bodyMatrix(frameA,frameB,bone){
  const A=frameA[bone],B=frameB[bone];tempPosition.fromArray(A.p).lerp(a.fromArray(B.p),frameMix);tempQuaternion.fromArray(A.q).slerp(quatB.fromArray(B.q),frameMix);
  return new THREE.Matrix4().compose(tempPosition,tempQuaternion,new THREE.Vector3(1,1,1));
 }
 function getAttachment(requestedSide=defaultSide){
  const s=requestedSide==='right'?'right':'left',A=currentAttachmentA[s],B=currentAttachmentB[s];group.updateMatrixWorld(true);
  const W=group.matrixWorld.clone().multiply(C),F=W.clone().multiply(bodyMatrix(A,B,'femur')),T=W.clone().multiply(bodyMatrix(A,B,'tibia'));
  const knee=new THREE.Vector3().fromArray(A.knee).lerp(new THREE.Vector3().fromArray(B.knee),frameMix).applyMatrix4(W);
  const hip=new THREE.Vector3().fromArray(A.hip).lerp(new THREE.Vector3().fromArray(B.hip),frameMix).applyMatrix4(W);
  const axis=new THREE.Vector3().fromArray(A.axis).lerp(new THREE.Vector3().fromArray(B.axis),frameMix).transformDirection(W).normalize();
  const proximal=hip.clone().sub(knee).normalize(),forward=new THREE.Vector3().crossVectors(proximal,axis).normalize();proximal.crossVectors(axis,forward).normalize();
  const rotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(forward,proximal,axis));
  const descriptor=M=>{const position=new THREE.Vector3(),quaternion=new THREE.Quaternion(),scale=new THREE.Vector3();M.decompose(position,quaternion,scale);return{position,quaternion,matrix:M,scale};};
  return {side:s,kneeAnchor:knee,kneeAxis:axis,kneeRotation:rotation,hipAnchor:hip,nativeFlexionRad:THREE.MathUtils.lerp(A.nativeFlexionRad,B.nativeFlexionRad,frameMix),femur:descriptor(F),tibia:descriptor(T),cadToWorldFemur:F.clone().multiply(registrations[s].femur).multiply(Ci),cadToWorldTibia:T.clone().multiply(registrations[s].tibia).multiply(Ci),mirror:s==='right',reflectionIncludedInCADMatrices:true,sourceCADCoordinates:'original zero-pose GLB world, Y-up meters',classification:'actual native recorded body frames + source CAD registration; illustrative uncoupled graft'};
 }
 function applyAnatomyPose(){
  const A=currentAttachmentA.left,B=currentAttachmentB.left,k=new THREE.Vector3(...A.knee).lerp(new THREE.Vector3(...B.knee),frameMix),hip=new THREE.Vector3(...A.hip).lerp(new THREE.Vector3(...B.hip),frameMix),up=hip.sub(k).normalize(),axis=new THREE.Vector3(...A.axis).normalize(),q=new THREE.Quaternion().setFromAxisAngle(axis,anatomyFlexion);
  for(const o of objects){const i=o.index;o.mesh.position.fromArray(currentFrameA.p,i*3).lerp(tempPosition.fromArray(currentFrameB.p,i*3),frameMix);o.mesh.quaternion.fromArray(currentFrameA.q,i*4).slerp(quatB.fromArray(currentFrameB.q,i*4),frameMix);
   if(!o.mesh.name.includes('_l_geom'))continue;
   if(o.mesh.name.startsWith('femur'))o.mesh.position.addScaledVector(up,.055*anatomySeparation);
   else if(/^(tibia|fibula|talus|calcn|toes|patella)/.test(o.mesh.name)){o.mesh.position.sub(k).applyQuaternion(q).add(k).addScaledVector(up,-.055*anatomySeparation);o.mesh.quaternion.premultiply(q);}
  }
 }
 function refresh(){
  if(disposed)return;applyAnatomyPose();group.updateMatrixWorld(true);group.visible=reveal>.0001;
  const sc=group.getWorldScale(new THREE.Vector3());
  for(const s of ['left','right']){clips[s].amount.value=s==='left'?replaceLeft:replaceRight;clips[s].center.value.copy(getAttachment(s).kneeAnchor);clips[s].radius.value=.052*Math.max(sc.x,sc.y,sc.z);}
  for(const o of objects){const alpha=reveal*(1-anatomyInspect)*(o.mesh.name.startsWith('femur_l')?upperOpacity:1)*(o.isChair?chairReveal:1)*(o.mesh.name.includes('_r_geom')?1-focusLeft:1);o.material.opacity=o.baseAlpha*alpha;o.mesh.visible=alpha>.0001;const cut=o.limb==='left'?replaceLeft:(o.limb==='right'?replaceRight:0);o.material.depthWrite=alpha>.97&&cut<.001;}
  muscleMaterial.opacity=reveal*muscleReveal*.82;muscleMaterial.depthWrite=false;muscles.visible=muscleReveal>.0001&&reveal>.0001;
  Object.assign(group.userData,{reveal,replaceLeft,replaceRight,muscleReveal,chairReveal,resectionRadiusMeters:.052});
 }
 const clamp=v=>THREE.MathUtils.clamp(Number(v)||0,0,1);
 function setState(next={}){
  if(next.anatomyInspect!==undefined)anatomyInspect=clamp(next.anatomyInspect);
  if(next.upperOpacity!==undefined)upperOpacity=clamp(next.upperOpacity);
  if(next.anatomyFlexion!==undefined)anatomyFlexion=Number(next.anatomyFlexion)||0;
  if(next.anatomySeparation!==undefined)anatomySeparation=clamp(next.anatomySeparation);
  if(next.focusLeft!==undefined&&clamp(next.focusLeft)!==focusLeft){focusLeft=clamp(next.focusLeft);updateMuscles();}
  if(next.reveal!==undefined)reveal=clamp(next.reveal);if(next.muscles!==undefined)muscleReveal=clamp(next.muscles);if(next.chair!==undefined)chairReveal=clamp(next.chair);
  if(next.replace!==undefined){if(defaultSide==='left')replaceLeft=clamp(next.replace);else replaceRight=clamp(next.replace);}
  if(next.replaceLeft!==undefined)replaceLeft=clamp(next.replaceLeft);if(next.replaceRight!==undefined)replaceRight=clamp(next.replaceRight);
  if(next.motionProgress!==undefined&&clamp(next.motionProgress)!==motionProgress)applyFrame(next.motionProgress);refresh();
 }
 function setMotionPhase(p){if(clamp(p)!==motionProgress)applyFrame(p);refresh();}
 function getBounds(){group.updateMatrixWorld(true);const box=new THREE.Box3();for(const o of objects)if(!o.isChair||chairReveal>.001)box.expandByObject(o.mesh);return box;}
 let motionBounds=null;
 function getMotionBounds(){
  if(!motionBounds){motionBounds=new THREE.Box3();const M=new THREE.Matrix4(),P=new THREE.Vector3(),Q=new THREE.Quaternion(),S=new THREE.Vector3(1,1,1);for(const frame of data.frames)for(const o of objects){P.fromArray(frame.p,o.index*3);Q.fromArray(frame.q,o.index*4);M.copy(C).multiply(new THREE.Matrix4().compose(P,Q,S));motionBounds.union(o.mesh.geometry.boundingBox.clone().applyMatrix4(M));}}
  group.updateMatrixWorld(true);return motionBounds.clone().applyMatrix4(group.matrixWorld);
 }
 applyFrame(1);refresh();
 return {ready:true,group,sourceGroup:source,defaultSide,side:defaultSide,sourceEpisode:data.provenance.episode_index,sourceData:data,attachmentData:attachments,mechanismLookupRangeRad:attachments.mechanismLookupRangeRad,partRoles,getPartRole,getAttachment,setMotionPhase,getMotionBounds,
  get sourceFrame(){return group.userData.frameTime;},get kneeAnchor(){return getAttachment().kneeAnchor;},get kneeAxis(){return getAttachment().kneeAxis;},get kneeRotation(){return getAttachment().kneeRotation;},
  nativeKneeGeoms:[`femur_${defaultSide==='left'?'l':'r'}_geom_1`,`tibia_${defaultSide==='left'?'l':'r'}_geom_1`],nativeKneeGeomsBySide:{left:['femur_l_geom_1','tibia_l_geom_1'],right:['femur_r_geom_1','tibia_r_geom_1']},registration:attachments.classification,
  setReveal:alpha=>setState({reveal:alpha}),setNativeKneeCut:amount=>setState({replace:amount}),setState,getBounds,resize:refresh,
  dispose(){disposed=true;scene.remove(group);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
 };
}
export const createHumanLayer=createContinuousHumanLayer;
