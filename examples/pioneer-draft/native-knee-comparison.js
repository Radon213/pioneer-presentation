import * as THREE from 'three';
import {createShadedEdges} from './shaded-edges.js?v=revision-20261029-27';

/** Actual source bone surfaces, with an explicitly qualitative joint motion.
 *
 * Local frame: metres; +Y proximal, +Z anterior, X the hinge axis. The proper
 * rotation maps the source positive hinge to -X (there is no reflection).
 * The final recorded native standing pose supplies geometry placement only.
 * The source STS has a hinge knee: it does NOT measure rollback or medial pivot.
 * Those two motions below are authored explanatory motions, never measurements.
 * Root owns positioning, camera, Next clock and the visible schematic label.
 */
export async function createNativeKneeComparison(scene,{human,side='left',clipRadius=.075}={}){
 if(!human?.sourceData||!human?.attachmentData)throw Error('Native comparison requires the loaded source human layer.');
 const limb=side==='right'?'right':'left',letter=limb==='left'?'l':'r';
 const data=human.sourceData,frame=data.frames.at(-1),attachment=human.attachmentData.frames.at(-1)[limb];
 const group=new THREE.Group();group.name='NativeKneeComparisonSchematic';
 group.userData={classification:'actual native bone geometry; qualitative schematic flexion, rollback and medial pivot',source:'assets/simulation-scene.json',sourceEpisode:data.provenance.episode_index,sourceReferenceTime:frame.t,side:limb,units:'metres',axes:'+Y proximal; +Z anterior; positive source hinge maps to -X',measuredKinematics:false,contactSolution:false,croppedSurface:'local inspection box; uncapped source bone ends'};
 const C=new THREE.Matrix4().makeRotationX(-Math.PI/2);
 const knee=new THREE.Vector3().fromArray(attachment.knee).applyMatrix4(C),hip=new THREE.Vector3().fromArray(attachment.hip).applyMatrix4(C);
 const axis=new THREE.Vector3().fromArray(attachment.axis).transformDirection(C).normalize();
 const proximal=hip.clone().sub(knee).normalize(),forward=new THREE.Vector3().crossVectors(proximal,axis).normalize();proximal.crossVectors(axis,forward).normalize();
 const sourceKneeFrame=new THREE.Matrix4().makeBasis(forward,proximal,axis).setPosition(knee);
 const canonical=new THREE.Matrix4().makeRotationY(-Math.PI/2).multiply(sourceKneeFrame.clone().invert()).multiply(C);
 const femurPivot=new THREE.Group();femurPivot.name='SchematicFemoralMotion';group.add(femurPivot);
 const geometrySet=new Set(),materialSet=new Set(),edges=[],bones={};
 const localPlanes=[new THREE.Plane(new THREE.Vector3(1,0,0),clipRadius),new THREE.Plane(new THREE.Vector3(-1,0,0),clipRadius),new THREE.Plane(new THREE.Vector3(0,1,0),clipRadius),new THREE.Plane(new THREE.Vector3(0,-1,0),clipRadius),new THREE.Plane(new THREE.Vector3(0,0,1),clipRadius),new THREE.Plane(new THREE.Vector3(0,0,-1),clipRadius)];
 const worldPlanes=localPlanes.map(p=>p.clone());
 let disposed=false,phase=0,opacity=1,lastFlexion=0,lastPivot=0,lastRollback=0;
 function syncClipping(){group.updateWorldMatrix(true,false);worldPlanes.forEach((p,i)=>p.copy(localPlanes[i]).applyMatrix4(group.matrixWorld));}
 for(const role of ['femur','tibia']){
  const index=data.geoms.findIndex(g=>g.name===`${role}_${letter}_geom_1`);if(index<0)throw Error(`Source ${role} surface is absent.`);
  const geom=data.geoms[index],raw=data.meshes[geom.mesh];if(!raw)throw Error(`Source ${role} mesh ${geom.mesh} is absent.`);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(raw.positions,3));geometry.setIndex(raw.indices);
  const sourcePose=new THREE.Matrix4().compose(new THREE.Vector3().fromArray(frame.p,index*3),new THREE.Quaternion().fromArray(frame.q,index*4).normalize(),new THREE.Vector3(1,1,1));
  geometry.applyMatrix4(canonical.clone().multiply(sourcePose));geometry.computeVertexNormals();geometry.computeBoundingBox();geometrySet.add(geometry);
  const rgba=geom.rgba,material=new THREE.MeshStandardMaterial({color:new THREE.Color(...rgba.slice(0,3)),roughness:.68,metalness:0,side:THREE.DoubleSide,clippingPlanes:worldPlanes,clipShadows:true});materialSet.add(material);
  const mesh=new THREE.Mesh(geometry,material);mesh.name=`NativeComparison::${geom.name}`;mesh.userData={sourceGeomId:geom.id,sourceMesh:geom.mesh,sourceRGBA:[...rgba],geometryClassification:'unmodified source surface with rigid source-pose transform',motionClassification:role==='femur'?'qualitative authored joint motion':'fixed schematic reference'};
  (role==='femur'?femurPivot:group).add(mesh);mesh.onBeforeRender=syncClipping;bones[role]=mesh;
  edges.push(createShadedEdges(mesh,{thresholdAngle:35,color:0x37413a,opacity:.22}));
 }
 scene.add(group);
 // Surface landmarks are actual source vertices nearest these descriptive
 // joint-region seeds. They are visual anchors, not solved contact points.
 const sourcePoint=(mesh,seed)=>{const p=mesh.geometry.getAttribute('position'),q=new THREE.Vector3(),best=new THREE.Vector3();let distance=Infinity;for(let i=0;i<p.count;i++){q.fromBufferAttribute(p,i);const d=q.distanceToSquared(seed);if(d<distance){distance=d;best.copy(q);}}return best;};
 const medialSign=limb==='left'?-1:1;
 const medialLocal=sourcePoint(bones.femur,new THREE.Vector3(medialSign*.019,0,0));
 const lateralLocal=sourcePoint(bones.femur,new THREE.Vector3(-medialSign*.019,0,0));
 const tibialLocal=sourcePoint(bones.tibia,new THREE.Vector3(0,-.006,0));
 const yawPivot=new THREE.Vector3(medialLocal.x,0,medialLocal.z);
 const one=new THREE.Vector3(1,1,1),flexQ=new THREE.Quaternion(),yawQ=new THREE.Quaternion(),flexAxis=new THREE.Vector3(-1,0,0),yawAxis=new THREE.Vector3(0,1,0),motionMatrix=new THREE.Matrix4();
 function setPhase(value,override={}){
  if(disposed)return;phase=THREE.MathUtils.clamp(Number(value)||0,0,1);
  const flexion=Number.isFinite(override.flexionRad)?override.flexionRad:THREE.MathUtils.degToRad(90)*phase;
  const pivot=Number.isFinite(override.pivotRad)?override.pivotRad:THREE.MathUtils.degToRad(8)*phase;
  const rollback=Number.isFinite(override.rollbackM)?override.rollbackM:0;
  // Yaw about the medial condyle creates a larger posterior displacement at
  // the lateral side. Side-aware sign keeps posterior (-Z) rollback bilateral.
  flexQ.setFromAxisAngle(flexAxis,flexion);yawQ.setFromAxisAngle(yawAxis,pivot*(limb==='left'?1:-1));
  motionMatrix.makeTranslation(yawPivot.x,0,yawPivot.z-rollback).multiply(new THREE.Matrix4().makeRotationFromQuaternion(yawQ)).multiply(new THREE.Matrix4().makeTranslation(-yawPivot.x,0,-yawPivot.z)).multiply(new THREE.Matrix4().makeRotationFromQuaternion(flexQ));
  femurPivot.matrixAutoUpdate=false;femurPivot.matrix.copy(motionMatrix);femurPivot.matrixWorldNeedsUpdate=true;
  lastFlexion=flexion;lastPivot=pivot;lastRollback=rollback;
  Object.assign(group.userData,{phase,schematicFlexionRad:flexion,schematicPivotRad:pivot,schematicRollbackM:rollback,defaultAuthoredRange:'0..90 deg flexion; 0..8 deg axial pivot; values illustrative, not universal native-knee measurements'});
  syncClipping();edges.forEach(e=>e.sync());
 }
 const toWorld=(p,object=group)=>p.clone().applyMatrix4(object.matrixWorld);
 function getLandmarks(){
  syncClipping();group.updateMatrixWorld(true);
  const medial=toWorld(medialLocal,bones.femur),lateral=toWorld(lateralLocal,bones.femur);
  return {knee:toWorld(new THREE.Vector3()),origin:toWorld(new THREE.Vector3()),medial,lateral,medialStart:toWorld(medialLocal),lateralStart:toWorld(lateralLocal),medialCondyle:medial.clone(),lateralCondyle:lateral.clone(),tibialPlateau:toWorld(tibialLocal,bones.tibia),femur:toWorld(new THREE.Vector3(0,.055,0),femurPivot),tibia:toWorld(new THREE.Vector3(0,-.055,0)),anterior:toWorld(new THREE.Vector3(0,0,.05)),proximal:toWorld(new THREE.Vector3(0,.05,0)),hingeAxis:new THREE.Vector3(-1,0,0).transformDirection(group.matrixWorld),phase,flexionRad:lastFlexion,pivotRad:lastPivot,rollbackM:lastRollback,classification:'source-surface visual anchors; qualitative motion; not measured contact points'};
 }
 // Camera bounds describe the inspected joint region, not the cropped-away
 // long shafts. The source geometry remains complete and can be uncropped.
 function getBounds(){syncClipping();return new THREE.Box3(new THREE.Vector3(-clipRadius,-clipRadius,-clipRadius),new THREE.Vector3(clipRadius,clipRadius,clipRadius)).applyMatrix4(group.matrixWorld);}
 function setOpacity(value){opacity=THREE.MathUtils.clamp(Number(value)||0,0,1);group.visible=opacity>.001;for(const material of materialSet){material.opacity=opacity;material.transparent=opacity<.999;material.depthWrite=opacity>.97;}edges.forEach(edge=>edge.sync());group.userData.opacity=opacity;}
 setPhase(0);
 return {ready:true,group,bones,setPhase,setOpacity,getLandmarks,getBounds,update:syncClipping,get worldBounds(){return getBounds();},
  dispose(){if(disposed)return;disposed=true;scene.remove(group);edges.forEach(e=>e.dispose());geometrySet.forEach(g=>g.dispose());materialSet.forEach(m=>m.dispose());}
 };
}
