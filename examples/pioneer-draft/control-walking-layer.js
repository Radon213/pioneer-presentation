import * as THREE from 'three';
import {reportLoadStage} from './asset-loading.js?v=revision-20261029-49';
import {createShadedEdges} from './shaded-edges.js';

/** Saved walking candidate states only. The controller failed the 25 W test at 27.19 s. A renderer, animation loop, solver,
 * synthetic pose, policy or dynamic experiment is never created here. */
export function decodeControlWalkingBinary(buffer){
 const bytes=new Uint8Array(buffer),view=new DataView(buffer);
 if(new TextDecoder().decode(bytes.subarray(0,8))!=='PCWLK1\0\0')throw Error('Invalid Walking replay signature.');
 const size=view.getUint32(8,true),end=12+size;if(end>buffer.byteLength)throw Error('Truncated Walking replay manifest.');
 const manifest=JSON.parse(new TextDecoder().decode(bytes.subarray(12,end)));if(manifest.schema!=='pioneer-control-walking-binary-v1')throw Error('Unsupported Walking replay schema.');
 const base=Math.ceil(end/8)*8,types={f:Float32Array,I:Uint32Array};
 const revive=value=>{
  if(!value||typeof value!=='object')return value;
  if(value.$typed){const Type=types[value.$typed],start=base+value.offset;if(!Type||!Number.isInteger(value.offset)||!Number.isInteger(value.length)||value.offset<0||value.length<0||start+value.length*Type.BYTES_PER_ELEMENT>buffer.byteLength)throw Error('Invalid Walking typed buffer.');return new Type(buffer,start,value.length);}
  for(const key of Object.keys(value))value[key]=revive(value[key]);return value;
 };
 return revive(manifest.data);
}
async function loadReplay(){
 const gzip=typeof DecompressionStream==='function',url=new URL(`./assets/control-walking.bin${gzip?'.gz':''}`,import.meta.url),started=performance.now();let loaded=0;
 const report=(phase,detail={})=>reportLoadStage('control-walking',phase,{label:'Walking candidate replay',phase,state:'running',...detail});
 report('download',{ratio:0});const response=await fetch(url);if(!response.ok)throw Error(`Walking replay: HTTP ${response.status}`);
 const reader=response.body?.getReader(),chunks=[],total=Number(response.headers.get('content-length'))||0;
 if(reader){while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);loaded+=value.byteLength;report('download',{loadedBytes:loaded,totalBytes:total||null,ratio:total?Math.min(1,loaded/total):null});}}
 else{const value=new Uint8Array(await response.arrayBuffer());chunks.push(value);loaded=value.byteLength;}
 report('decode',{ratio:null,downloadComplete:true});const body=new Blob(chunks),buffer=gzip&&!response.headers.get('content-encoding')?.includes('gzip')?await new Response(body.stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():await body.arrayBuffer();
 const data=decodeControlWalkingBinary(buffer);data.loadingMetrics={observedBodyBytes:loaded,decodedBytes:buffer.byteLength,loadMs:performance.now()-started};report('ready',{state:'complete',ratio:1,...data.loadingMetrics});return data;
}

export async function createControlWalkingLayer(scene,{gait,human}={}){
 if(!gait?.sourceGroup||!human?.sourceData)throw Error('Walking replay requires the loaded native gait geometry and original human shafts.');
 const data=await loadReplay();if(data.schema!=='pioneer-control-walking-v1'||data.frames.length<2)throw Error('Invalid Walking replay data.');
 const group=new THREE.Group();group.name='ActualRecordedWalkingCandidate';
 const sourceGroup=new THREE.Group();sourceGroup.name='WalkingSource_Zup_to_Yup';sourceGroup.rotation.x=-Math.PI/2;group.add(sourceGroup);scene.add(group);
 group.userData={...data.provenance,loadingMetrics:data.loadingMetrics,independentRenderer:false,sourcePoseRepair:false};
 const ownedGeometries=new Set(),materials=new Set(),edgeHelpers=[],objects=[],cache=new Map(),unit=new THREE.Vector3(1,1,1),C=new THREE.Matrix4().makeRotationX(-Math.PI/2);
 const P=new THREE.Vector3(),Q=new THREE.Quaternion();let progress=0,opacity=0,anatomyOpacity=1,implantOpacity=1,muscleOpacity=.82,chairOpacity=.68,disposed=false,frameA=data.frames[0],frameB=frameA,mix=0;
 function geometryFor(g){
  if(g.stsMesh){if(cache.has(g.stsMesh))return cache.get(g.stsMesh);const raw=data.meshes[g.stsMesh],geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(raw.positions,3));geometry.setIndex(new THREE.BufferAttribute(raw.indices,1));geometry.computeVertexNormals();geometry.computeBoundingBox();ownedGeometries.add(geometry);cache.set(g.stsMesh,geometry);return geometry;}
  if(g.role==='chair'){const s=g.size,geometry=new THREE.BoxGeometry(2*s[0],2*s[1],2*s[2]);geometry.computeBoundingBox();ownedGeometries.add(geometry);return geometry;}
  const original=gait.sourceGroup.getObjectByName(g.name);if(!original?.geometry)throw Error(`Missing compatible Walking source geometry: ${g.name}`);return original.geometry;
 }
 for(const [index,geom] of data.geoms.entries()){
  const implant=geom.role==='implant',material=new THREE.MeshStandardMaterial({color:new THREE.Color(...geom.rgba.slice(0,3)),roughness:implant?.38:.76,metalness:implant?.42:0,side:THREE.DoubleSide});materials.add(material);
  const mesh=new THREE.Mesh(geometryFor(geom),material);mesh.name=`Walking_${geom.name}`;mesh.userData={sourceGeom:geom.stsSourceGeomId,sourceBody:geom.stsSourceBodyId,role:geom.role,side:geom.side,sourceGeometryShared:!geom.stsMesh,sourceReflectedGeometry:geom.side==='right'};sourceGroup.add(mesh);objects.push({mesh,material,geom,index});
  if(implant)edgeHelpers.push(createShadedEdges(mesh,{thresholdAngle:28,color:0x2e3932,opacity:.22}));
  if(index%24===0)await new Promise(requestAnimationFrame);
 }
 // Restore only the native bone shafts hidden by the device plant's visual
 // export. This is the cover's same bone-local registration, evaluated on the
 // actual Walking femur/tibia body frames, never a borrowed gait pose.
 const retainedBones=[],matrix=v=>new THREE.Matrix4().compose(new THREE.Vector3(...v.p),new THREE.Quaternion(...v.q),unit),native=human.sourceData,af=human.attachmentData.frames.at(-1),nf=native.frames.at(-1);
 for(const side of ['left','right'])for(const role of ['femur','tibia']){
  const name=`${role}_${side==='left'?'l':'r'}_geom_1`,index=native.geoms.findIndex(g=>g.name===name),original=human.sourceGroup.getObjectByName(name);if(index<0||!original)throw Error(`Missing original Walking shaft: ${name}`);
  const local=matrix(af[side][role]).invert().multiply(new THREE.Matrix4().compose(new THREE.Vector3().fromArray(nf.p,index*3),new THREE.Quaternion().fromArray(nf.q,index*4),unit));
  const material=new THREE.MeshStandardMaterial({color:0xc8c5b8,roughness:.76,side:THREE.DoubleSide}),clip={center:{value:new THREE.Vector3()},up:{value:new THREE.Vector3()}};materials.add(material);
  material.onBeforeCompile=shader=>{Object.assign(shader.uniforms,{uShaftKnee:clip.center,uShaftUp:clip.up});shader.vertexShader='varying vec3 vShaftWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvShaftWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');shader.fragmentShader='varying vec3 vShaftWorld;uniform vec3 uShaftKnee;uniform vec3 uShaftUp;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat h=dot(vShaftWorld-uShaftKnee,uShaftUp);if(${role==='femur'?'h<.055':'h>-.055'})discard;`);};
  material.customProgramCacheKey=()=>`retained-walking-shaft-${role}`;const mesh=new THREE.Mesh(original.geometry,material);mesh.name=`Walking_Restored_${name}`;mesh.matrixAutoUpdate=false;sourceGroup.add(mesh);retainedBones.push({mesh,material,local,side,role,clip});
 }
 const muscleGeometry=new THREE.CylinderGeometry(1,1,1,8,1),muscleMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.74,transparent:true});ownedGeometries.add(muscleGeometry);materials.add(muscleMaterial);
 const capacity=Math.max(...data.frames.map(f=>f.tendons.reduce((n,path)=>n+Math.max(0,path.length/3-1),0))),muscles=new THREE.InstancedMesh(muscleGeometry,muscleMaterial,capacity);muscles.name='ActualWalkingTendonWrapPaths';muscles.frustumCulled=false;sourceGroup.add(muscles);
 const dummy=new THREE.Object3D(),a=new THREE.Vector3(),b=new THREE.Vector3(),delta=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),rgb=new THREE.Color();
 function updateMuscles(){let count=0;data.tendons.forEach((tendon,j)=>{let pa=frameA.tendons[j],pb=frameB.tendons[j];if(pa.length!==pb.length)pa=pb=mix<.5?pa:pb;rgb.setRGB(...tendon.rgba.slice(0,3));for(let k=0;k<pa.length/3-1;k++){a.fromArray(pa,k*3).lerp(P.fromArray(pb,k*3),mix);b.fromArray(pa,(k+1)*3).lerp(P.fromArray(pb,(k+1)*3),mix);delta.subVectors(b,a);const length=delta.length();dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,length>1e-10?delta.divideScalar(length):up);dummy.scale.set(tendon.width,length,tendon.width);dummy.updateMatrix();muscles.setMatrixAt(count,dummy.matrix);muscles.setColorAt(count,rgb);count++;}});muscles.count=count;muscles.instanceMatrix.needsUpdate=true;if(muscles.instanceColor)muscles.instanceColor.needsUpdate=true;}
 const clamp=v=>THREE.MathUtils.clamp(Number(v)||0,0,1);
 function refreshOpacity(){
  group.visible=opacity>.0001;for(const o of objects){const role=o.geom.role,alpha=opacity*(role==='implant'?implantOpacity:role==='chair'?chairOpacity:anatomyOpacity)*o.geom.rgba[3];o.mesh.visible=alpha>.0001;o.material.opacity=alpha;o.material.transparent=alpha<.999;o.material.depthWrite=alpha>.97;}
  for(const bone of retainedBones){bone.mesh.visible=opacity*anatomyOpacity>.001;bone.material.opacity=opacity*anatomyOpacity;bone.material.transparent=bone.material.opacity<.999;bone.material.depthWrite=bone.material.opacity>.97;}
  muscleMaterial.opacity=opacity*anatomyOpacity*muscleOpacity;muscles.visible=muscleMaterial.opacity>.0001;muscleMaterial.depthWrite=muscleMaterial.opacity>.97;edgeHelpers.forEach(edge=>edge.sync());Object.assign(group.userData,{opacity,anatomyOpacity,implantOpacity,muscleOpacity,chairOpacity});
 }
 function setProgress(value){
  if(disposed)return;progress=clamp(value);const time=THREE.MathUtils.lerp(data.frames[0].t,data.frames.at(-1).t,progress);let lo=0,hi=data.frames.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(data.frames[mid].t<=time)lo=mid;else hi=mid;}frameA=data.frames[lo];frameB=data.frames[hi];mix=THREE.MathUtils.clamp((time-frameA.t)/(frameB.t-frameA.t),0,1);
  for(const o of objects){o.mesh.position.fromArray(frameA.p,o.index*3).lerp(P.fromArray(frameB.p,o.index*3),mix);o.mesh.quaternion.fromArray(frameA.q,o.index*4).slerp(Q.fromArray(frameB.q,o.index*4),mix);}
  group.updateMatrixWorld(true);const world=group.matrixWorld.clone().multiply(C);
  for(const bone of retainedBones){const A=frameA.attachment[bone.side],B=frameB.attachment[bone.side],v=A[bone.role],w=B[bone.role];const M=new THREE.Matrix4().compose(new THREE.Vector3(...v.p).lerp(P.fromArray(w.p),mix),new THREE.Quaternion(...v.q).slerp(Q.fromArray(w.q),mix),unit);bone.mesh.matrix.copy(M.multiply(bone.local));bone.clip.center.value.copy(new THREE.Vector3(...A.knee).lerp(P.fromArray(B.knee),mix).applyMatrix4(world));bone.clip.up.value.set(0,0,1).transformDirection(world);}
  updateMuscles();group.updateMatrixWorld(true);Object.assign(group.userData,{progress,sourceTime:THREE.MathUtils.lerp(frameA.t,frameB.t,mix),sourceFrameIndices:[frameA.sourceIndex,frameB.sourceIndex],retainedNativeShaftCount:retainedBones.length,tendonSegments:muscles.count});
 }
 function setState(next={}){
  let changed=false;
  for(const key of ['opacity','anatomyOpacity','implantOpacity','muscleOpacity','chairOpacity'])if(next[key]!==undefined){
   const value=clamp(next[key]),previous={opacity,anatomyOpacity,implantOpacity,muscleOpacity,chairOpacity}[key];if(value===previous)continue;changed=true;
   if(key==='opacity')opacity=value;else if(key==='anatomyOpacity')anatomyOpacity=value;else if(key==='implantOpacity')implantOpacity=value;else if(key==='muscleOpacity')muscleOpacity=value;else chairOpacity=value;
  }
  if(next.progress!==undefined)setProgress(next.progress);if(changed)refreshOpacity();
 }
 function getValues(){const A=frameA.values,B=frameB.values,out={telemetrySide:'left',motorPowerDefinition:data.provenance.motorPowerDefinition};for(const key of Object.keys(A))out[key]=typeof A[key]==='number'?THREE.MathUtils.lerp(A[key],B[key],mix):(mix<.5?A[key]:B[key]);return out;}
 let fullBounds;
 function getReferenceBounds(){if(!fullBounds){fullBounds=new THREE.Box3();const M=new THREE.Matrix4();for(const frame of data.frames)for(const o of objects){if(!o.mesh.geometry.boundingBox)o.mesh.geometry.computeBoundingBox();M.copy(C).multiply(new THREE.Matrix4().compose(P.fromArray(frame.p,o.index*3),Q.fromArray(frame.q,o.index*4),unit));fullBounds.union(o.mesh.geometry.boundingBox.clone().applyMatrix4(M));}for(const f of data.frames)for(const side of ['left','right'])for(const role of ['femur','tibia']){const p=f.attachment[side][role].p;fullBounds.expandByPoint(new THREE.Vector3(...p).applyMatrix4(C));}}return fullBounds.clone();}
 function getBounds(){group.updateWorldMatrix(true,false);return getReferenceBounds().applyMatrix4(group.matrixWorld);}
 function getKneeAnchor(side='left'){const A=frameA.attachment[side],B=frameB.attachment[side];group.updateWorldMatrix(true,false);return new THREE.Vector3(...A.knee).lerp(P.fromArray(B.knee),mix).applyMatrix4(C).applyMatrix4(group.matrixWorld);}
 setProgress(0);refreshOpacity();
 return {ready:true,group,sourceGroup,data,source:data.provenance,durationSeconds:data.provenance.durationSeconds,startTimeSec:data.frames[0].t,endTimeSec:data.frames.at(-1).t,setTime:time=>setProgress((time-data.frames[0].t)/data.provenance.durationSeconds),setProgress,setState,setOpacity:value=>setState({opacity:value}),getValues,getBounds,getReferenceBounds,getKneeAnchor,
  dispose(){if(disposed)return;disposed=true;scene.remove(group);edgeHelpers.forEach(e=>e.dispose());ownedGeometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
 };
}
