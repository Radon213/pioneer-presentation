import * as THREE from 'three';
import {loadSpringAnalysis} from './spring-analysis-data.js?v=revision-20261029-30';
import {createShadedEdges} from './shaded-edges.js';

const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const STOPS=[[0,0x244b69],[.32,0x348b8a],[.64,0xd4bd69],[1,0x9f3c29]];
export function springFEAColor(value){
 const u=clamp(value);let i=0;while(i<STOPS.length-2&&u>STOPS[i+1][0])i++;
 return new THREE.Color(STOPS[i][1]).lerp(new THREE.Color(STOPS[i+1][1]),(u-STOPS[i][0])/(STOPS[i+1][0]-STOPS[i][0]));
}

/** Actual converged FEA exterior in the caller's scene, in metres.
 * Source XY remains the spring plane; source +Z remains its rotation axis.
 * The origin is the actual source rotation axis, not a moving bounding-box
 * centre. No renderer, clock, controls, synthetic solved frame or stress
 * interpolation is created. This representative cartridge is not native CAD.
 */
export async function createSpringFEALayer(scene){
 if(!scene?.add)throw Error('Spring FEA requires the existing THREE scene');
 const data=await loadSpringAnalysis();
 const nodes=data.geometry?.nodes,triangles=data.geometry?.surface_triangles,frames=data.frames;
 if(!nodes?.length||!triangles?.length||!frames?.length)throw Error('Spring FEA asset is incomplete');
 const nodeValues=nodes.flatView??nodes.flat();
 const angles=frames.map(f=>f.actual_angle_deg??f.angle_deg);
 if(angles.some(a=>!Number.isFinite(a)))throw Error('Spring FEA has an invalid solved angle');
 const legendMax=data.max_von_mises_MPa;
 if(!(legendMax>0))throw Error('Spring FEA has no quantitative stress range');
 const group=new THREE.Group();group.name='ArchivedRepresentativeSpring_ActualFEA';group.visible=false;scene.add(group);
 const position=new THREE.Float32BufferAttribute(new Float32Array(nodes.length*3),3);
 const colors=new THREE.Float32BufferAttribute(new Float32Array(nodes.length*3),3);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',position);geometry.setAttribute('color',colors);geometry.setIndex(triangles.flat());
 for(let i=0;i<nodes.length;i++)position.setXYZ(i,nodes[i][0]*.001,nodes[i][1]*.001,nodes[i][2]*.001);
 geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 const referenceBounds=geometry.boundingBox.clone();
 const material=new THREE.MeshStandardMaterial({color:0xd8d0b9,metalness:0,roughness:.76,side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:false,vertexColors:false,toneMapped:false});
 const mesh=new THREE.Mesh(geometry,material);mesh.name='ActualFEA_WholeExterior_Scale1';group.add(mesh);
 const edges=createShadedEdges(mesh,{thresholdAngle:30,color:0x29312e,opacity:.38});
 // Cache the exact display frame after its first visit. Source topology is
 // unchanged; normals, scalar colours and bounds never need recomputing when
 // the same stored frame is replayed in reverse or on the following gait cycle.
 const displayCache=new Map(),normal=geometry.getAttribute('normal');
 const stopColors=STOPS.map(([at,hex])=>({at,c:new THREE.Color(hex)}));
 const replayMetrics={builds:0,hits:0,buildMs:0,restoreMs:0,maxBuildMs:0,maxRestoreMs:0};
 let frameIndex=-2,requestedAngle=0,opacity=0,disposed=false;
 const finiteOrNull=v=>Number.isFinite(v)?v:null;
 function getValues(){
  const f=frameIndex>=0?frames[frameIndex]:null;
  return{reference:!f,frameIndex,frameCount:frames.length,requestedAngleDeg:requestedAngle,actualAngleDeg:f?angles[frameIndex]:null,angleDeg:f?angles[frameIndex]:null,
   torqueInputNm:finiteOrNull(f?.torque_input_Nm??f?.torque_z_Nm),torqueSupportNm:finiteOrNull(f?.torque_outer_Nm??f?.outer_torque_z_Nm),maxVonMisesMPa:finiteOrNull(f?.max_von_mises_MPa),maxDisplacementMm:finiteOrNull(f?.max_displacement_mm),maxAbsPrincipalGreenStrain:finiteOrNull(f?.max_abs_principal_strain),loadParameter:finiteOrNull(f?.time),contactMetrics:f?.contact_metrics??null,
   stressLegendMaxMPa:legendMax,deformationScale:1,sourceUnitScale:.001,coordinateSystem:'source XY spring plane / source +Z rotation axis / metres',
   solver:data.solver,classification:'Exploratory elastic inter-arm contact of an archived representative cartridge',nativeDeviceCAD:false,frictionCoefficient:0,normalPenaltyMPaPerMm:100000,stressConvention:data.stress_convention,torqueConvention:data.torque_convention,frameSelection:'nearest actual converged stored frame; no interpolation'};
 }
 function setAngle(degrees=0){
  if(disposed)return getValues();requestedAngle=clamp(Number(degrees)||0,0,110);
  let selected=-1;
  if(requestedAngle>0){selected=0;for(let i=1;i<angles.length;i++)if(Math.abs(angles[i]-requestedAngle)<Math.abs(angles[selected]-requestedAngle))selected=i;}
  if(selected===frameIndex)return getValues();
  frameIndex=selected;const f=selected>=0?frames[selected]:null,withStress=!!f?.von_mises_MPa?.length;
  if(f&&f.displacements?.length!==nodes.length)throw Error('Spring FEA displacement node count changed');
  if(withStress&&f.von_mises_MPa.length!==nodes.length)throw Error('Spring FEA stress node count changed');
  const start=performance.now(),cached=displayCache.get(selected);
  if(cached){
   position.array.set(cached.position);colors.array.set(cached.colors);normal.array.set(cached.normal);
   geometry.boundingBox.copy(cached.box);geometry.boundingSphere.copy(cached.sphere);
   replayMetrics.hits++;const elapsed=performance.now()-start;replayMetrics.restoreMs+=elapsed;replayMetrics.maxRestoreMs=Math.max(replayMetrics.maxRestoreMs,elapsed);
  }else{
   const neutral=new THREE.Color(0xd8d0b9);
   for(let i=0;i<nodes.length;i++){
    const flat=f?.displacements.flatView,u=flat?null:f?.displacements[i],j=i*3;
    position.setXYZ(i,(nodeValues[j]+(flat?flat[j]:(u?.[0]??0)))*.001,(nodeValues[j+1]+(flat?flat[j+1]:(u?.[1]??0)))*.001,(nodeValues[j+2]+(flat?flat[j+2]:(u?.[2]??0)))*.001);
    if(withStress){
     const v=clamp(f.von_mises_MPa[i]/legendMax);let k=0;while(k<stopColors.length-2&&v>stopColors[k+1].at)k++;
     const a=stopColors[k],b=stopColors[k+1],t=(v-a.at)/(b.at-a.at);
     colors.setXYZ(i,a.c.r+(b.c.r-a.c.r)*t,a.c.g+(b.c.g-a.c.g)*t,a.c.b+(b.c.b-a.c.b)*t);
    }else colors.setXYZ(i,neutral.r,neutral.g,neutral.b);
   }
   geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
   displayCache.set(selected,{position:position.array.slice(),colors:colors.array.slice(),normal:normal.array.slice(),box:geometry.boundingBox.clone(),sphere:geometry.boundingSphere.clone()});
   replayMetrics.builds++;const elapsed=performance.now()-start;replayMetrics.buildMs+=elapsed;replayMetrics.maxBuildMs=Math.max(replayMetrics.maxBuildMs,elapsed);
  }
  position.needsUpdate=true;colors.needsUpdate=true;normal.needsUpdate=true;
  if(material.vertexColors!==withStress){material.vertexColors=withStress;material.needsUpdate=true;}
  material.color.set(withStress?0xffffff:0xd8d0b9);edges.sync();Object.assign(group.userData,getValues());return getValues();
 }
 function setOpacity(value=0){
  if(disposed)return;opacity=clamp(Number(value)||0);group.visible=opacity>.001;material.opacity=opacity;material.depthWrite=opacity>.85;edges.sync();group.userData.opacity=opacity;
 }
 setAngle(0);setOpacity(0);
 Object.assign(group.userData,{source:'assets/motion/spring-analysis-110.json',displayAsset:'assets/motion/spring-analysis-110.display.bin.gz',displayLoadMetrics:data.displayLoadMetrics,replayMetrics,case:'representative-180x2x2-110-envelope-mu0-K1e5',nodeCount:nodes.length,surfaceTriangleCount:triangles.length,sourceAxis:[0,0,1],sourceAxisOrigin:[0,0,0],sourcePreserved:true,wholeExterior:true,triangleWireframe:false,limits:data.limits});
 return{ready:true,group,mesh,axis:new THREE.Vector3(0,0,1),frameCount:frames.length,setAngle,setOpacity,getValues,
  getBounds(){group.updateMatrixWorld(true);return geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld);},
  getReferenceBounds(){group.updateMatrixWorld(true);return referenceBounds.clone().applyMatrix4(mesh.matrixWorld);},
  getLegend(){return{unit:'MPa',min:0,max:legendMax,stops:STOPS.map(([at,color])=>({at,color:`#${color.toString(16).padStart(6,'0')}`})),stressConvention:data.stress_convention};},
  getCurve(){return frames.map((f,i)=>({frameIndex:i,angleDeg:angles[i],torqueInputNm:finiteOrNull(f.torque_input_Nm??f.torque_z_Nm),torqueSupportNm:finiteOrNull(f.torque_outer_Nm??f.outer_torque_z_Nm),maxVonMisesMPa:finiteOrNull(f.max_von_mises_MPa)}));},
  dispose(){if(disposed)return;disposed=true;displayCache.clear();scene.remove(group);edges.dispose();geometry.dispose();material.dispose();}
 };
}
