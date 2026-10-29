import * as THREE from 'three';
import {loadBinaryWithProgress,reportLoadStage} from './asset-loading.js?v=revision-20261029-33';
import {createShadedEdges} from './shaded-edges.js';

/** Three source-composed wearable examples, in the parent's one scene and clock.
 * Loading is lazy: call this only when Background's wearable step is needed.
 * Motion is a small interpolation of source canonical keyframes evaluated by
 * MuJoCo forward kinematics. It is not an integrated gait or efficacy result.
 */
export async function createMyoAssistExamplesLayer(scene){
 const started=performance.now(),gzip=typeof DecompressionStream==='function';
 const buffer=await loadBinaryWithProgress(new URL(`./assets/myoassist-examples/examples.bin${gzip?'.gz':''}`,import.meta.url),{key:'myoassist-examples',label:'MyoAssist wearable examples',expectedBytes:gzip?4419742:6715932,compression:gzip?'gzip':'identity',priority:'low'});
 const view=new DataView(buffer),bytes=new Uint8Array(buffer),decoder=new TextDecoder();
 if(decoder.decode(bytes.subarray(0,8))!=='PMY1LE\0\0')throw Error('Invalid MyoAssist examples binary signature.');
 const length=view.getUint32(8,true),end=12+length;if(end>buffer.byteLength)throw Error('Truncated MyoAssist examples manifest.');
 const manifest=JSON.parse(decoder.decode(bytes.subarray(12,end))),base=Math.ceil(end/8)*8;
 if(manifest.schema!=='pioneer-myoassist-examples-binary-v1')throw Error('Unsupported MyoAssist examples schema.');
 const types={f:Float32Array,d:Float64Array,H:Uint16Array,I:Uint32Array,h:Int16Array};
 function revive(value){
  if(!value||typeof value!=='object')return value;
  if(value.$typed){const Type=types[value.$typed],start=base+value.offset;if(!Type||!Number.isInteger(value.offset)||!Number.isInteger(value.length)||value.offset<0||value.length<0||start+value.length*Type.BYTES_PER_ELEMENT>buffer.byteLength)throw Error('Invalid MyoAssist display buffer.');return new Type(buffer,start,value.length);}
  for(const key of Object.keys(value))value[key]=revive(value[key]);return value;
 }
 const data=revive(manifest.data);if(data.schema!=='pioneer-myoassist-examples-v1'||data.examples.length!==3)throw Error('Invalid attached-device examples.');
 const group=new THREE.Group();group.name='SourceAttachedMyoAssistExamples';group.visible=false;scene.add(group);
 const geometries=new Map(),materials=new Set(),edges=[],objects=[],models=[],unit=new THREE.Vector3(1,1,1),C=new THREE.Matrix4().makeRotationX(-Math.PI/2);
 let opacity=0,progress=0,disposed=false;
 const pB=new THREE.Vector3(),qB=new THREE.Quaternion(),A=new THREE.Vector3(),B=new THREE.Vector3(),delta=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),dummy=new THREE.Object3D();
 function geometryFor(geom){
  if(geom.type===7){
   if(geometries.has(geom.mesh))return geometries.get(geom.mesh);
   const raw=data.meshes[geom.mesh],g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(raw.positions,3));g.setAttribute('normal',new THREE.BufferAttribute(raw.normals,3,true));g.setIndex(new THREE.BufferAttribute(raw.indices,1));g.computeBoundingBox();geometries.set(geom.mesh,g);return g;
  }
  const key=`primitive:${geom.type}:${geom.size.join(',')}`;if(geometries.has(key))return geometries.get(key);
  const s=geom.size;let g;
  if(geom.type===2)g=new THREE.SphereGeometry(s[0],16,10);
  else if(geom.type===3){g=new THREE.CapsuleGeometry(s[0],s[1]*2,4,12);g.rotateX(Math.PI/2);}
  else if(geom.type===4){g=new THREE.SphereGeometry(1,16,10);g.scale(...s);}
  else if(geom.type===5){g=new THREE.CylinderGeometry(s[0],s[0],s[1]*2,16);g.rotateX(Math.PI/2);}
  else if(geom.type===6)g=new THREE.BoxGeometry(s[0]*2,s[1]*2,s[2]*2);
  else throw Error(`Unsupported attached-device geom ${geom.type}`);
  g.computeBoundingBox();geometries.set(key,g);return g;
 }
 const muscleGeometry=new THREE.CylinderGeometry(1,1,1,6,1);geometries.set('muscle-unit',muscleGeometry);
 for(const [index,example] of data.examples.entries()){
  const modelRoot=new THREE.Group();modelRoot.name=example.name;modelRoot.position.x=(index-1)*.68;modelRoot.rotation.y=example.displayYaw;group.add(modelRoot);
  const sourceGroup=new THREE.Group();sourceGroup.rotation.x=-Math.PI/2;modelRoot.add(sourceGroup);
  const rows=[];
  for(const geom of example.geoms){
   const device=geom.role==='device',rgba=geom.rgba,mat=new THREE.MeshStandardMaterial({color:device?new THREE.Color(...rgba.slice(0,3)):0xbeb7aa,roughness:device?.44:.82,metalness:device?.17:0,side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:false});materials.add(mat);
   const mesh=new THREE.Mesh(geometryFor(geom),mat);mesh.name=geom.name;mesh.userData={sourceGeomId:geom.sourceId,sourceBody:geom.sourceBody,sourceRGBA:[...rgba],role:geom.role,sourceDevice:example.key};sourceGroup.add(mesh);
   const row={mesh,mat,geom,baseOpacity:device?rgba[3]:1};rows.push(row);objects.push(row);
   if(device)edges.push(createShadedEdges(mesh,{thresholdAngle:34,color:0x353b35,opacity:.21}));
  }
  const muscleMat=new THREE.MeshStandardMaterial({color:0xad8a7f,roughness:.85,transparent:true,opacity:0,depthWrite:false}),cableMat=new THREE.MeshStandardMaterial({color:0x383b36,roughness:.55,transparent:true,opacity:0,depthWrite:false});materials.add(muscleMat);materials.add(cableMat);
  const segments=role=>Math.max(...example.frames.map(f=>f.tendons.reduce((n,path,j)=>n+(example.tendons[j].role===role?Math.max(0,path.length/3-1):0),0)));
  const muscles=new THREE.InstancedMesh(muscleGeometry,muscleMat,Math.max(1,segments('muscle'))),cables=new THREE.InstancedMesh(muscleGeometry,cableMat,Math.max(1,segments('device')));
  muscles.name=`${example.name} source muscle paths`;cables.name=`${example.name} source cable paths`;muscles.frustumCulled=false;cables.frustumCulled=false;sourceGroup.add(muscles,cables);
  models.push({example,root:modelRoot,sourceGroup,rows,muscles,cables,muscleMat,cableMat,label:new THREE.Vector3(0,example.sourceBoundsZUp[1][2]-example.sourceFloorZ+.065,0)});
  reportLoadStage('myoassist-example-setup','Building attached-device examples',{label:'MyoAssist wearable examples',ratio:(index+1)/data.examples.length});await new Promise(requestAnimationFrame);
 }
 function setProgress(value){
  if(disposed)return;progress=THREE.MathUtils.clamp(Number(value)||0,0,1);
  for(const model of models){
   const frames=model.example.frames,x=progress*(frames.length-1),i=Math.floor(x),j=Math.min(i+1,frames.length-1),t=x-i,a=frames[i],b=frames[j];
   model.rows.forEach((row,k)=>{row.mesh.position.fromArray(a.p,k*3).lerp(pB.fromArray(b.p,k*3),t);row.mesh.quaternion.fromArray(a.q,k*4).slerp(qB.fromArray(b.q,k*4),t);});
   let muscleCount=0,cableCount=0;
   model.example.tendons.forEach((tendon,k)=>{
    let pa=a.tendons[k],pb=b.tendons[k];if(pa.length!==pb.length)pa=pb=t<.5?pa:pb;
    const device=tendon.role==='device',instanced=device?model.cables:model.muscles;
    for(let n=0;n<pa.length/3-1;n++){
     A.fromArray(pa,n*3).lerp(pB.fromArray(pb,n*3),t);B.fromArray(pa,(n+1)*3).lerp(pB.fromArray(pb,(n+1)*3),t);delta.subVectors(B,A);const length=delta.length();
     dummy.position.copy(A).add(B).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,length>1e-10?delta.divideScalar(length):up);dummy.scale.set(tendon.width,length,tendon.width);dummy.updateMatrix();instanced.setMatrixAt(device?cableCount++:muscleCount++,dummy.matrix);
    }
   });
   model.muscles.count=muscleCount;model.cables.count=cableCount;model.muscles.instanceMatrix.needsUpdate=true;model.cables.instanceMatrix.needsUpdate=true;
  }
  group.updateMatrixWorld(true);group.userData.progress=progress;
 }
 function setReveal(value){
  if(disposed)return;opacity=THREE.MathUtils.clamp(Number(value)||0,0,1);group.visible=opacity>.001;
  for(const row of objects){const a=opacity*row.baseOpacity;row.mat.opacity=a;row.mat.transparent=a<.999;row.mat.depthWrite=a>.97;row.mesh.visible=a>.001;}
  for(const m of models){m.muscleMat.opacity=opacity*.52;m.cableMat.opacity=opacity;m.cableMat.depthWrite=opacity>.97;m.muscles.visible=opacity>.001;m.cables.visible=opacity>.001;}
  edges.forEach(edge=>edge.sync());group.userData.opacity=opacity;
 }
 let localBounds;
 function getBounds(){
  if(!localBounds){
   localBounds=new THREE.Box3();const matrix=new THREE.Matrix4(),P=new THREE.Vector3(),Q=new THREE.Quaternion();
   for(const m of models){m.root.updateMatrix();for(const frame of m.example.frames)for(const [i,row]of m.rows.entries()){P.fromArray(frame.p,i*3);Q.fromArray(frame.q,i*4);matrix.copy(m.root.matrix).multiply(C).multiply(new THREE.Matrix4().compose(P,Q,unit));localBounds.union(row.mesh.geometry.boundingBox.clone().applyMatrix4(matrix));}}
  }
  group.updateWorldMatrix(true,false);return localBounds.clone().applyMatrix4(group.matrixWorld);
 }
 Object.assign(group.userData,{classification:data.provenance.classification,provenance:data.provenance,exampleNames:data.examples.map(e=>e.name),geometryCount:objects.length,uniqueMeshCount:data.meshes.length,frameCount:33,physicsSteps:0,sourceAttached:true,independentRenderer:false,kinematicIllustration:true});
 setProgress(0);setReveal(0);reportLoadStage('myoassist-example-setup','Attached-device examples ready',{label:'MyoAssist wearable examples',ratio:1,state:'complete',elapsedMs:performance.now()-started});
 return {ready:true,group,examples:data.examples.map(e=>({name:e.name,key:e.key,description:e.description,classification:e.classification})),source:data.provenance,data,durationSeconds:3.6,setReveal,setOpacity:setReveal,setProgress,getBounds,
  get labels(){group.updateMatrixWorld(true);return models.map(m=>({name:m.example.name,detail:m.example.description,position:m.label.clone().applyMatrix4(m.root.matrixWorld)}));},
  dispose(){if(disposed)return;disposed=true;scene.remove(group);edges.forEach(edge=>edge.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
 };
}
