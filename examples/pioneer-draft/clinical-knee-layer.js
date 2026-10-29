import * as THREE from 'three';
import {createShadedEdges} from './shaded-edges.js';
import {mergeVertices} from '../pioneer-interactive/vendor/BufferGeometryUtils.js';

const ROOT=new URL('assets/motion/clinical-tka-source/',import.meta.url);
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));

/** Conventional TKA teaching layer. Actual Apache-2.0 source implant meshes;
 * placement/resection are explanatory and are not a surgical plan or fit result.
 * The caller supplies its existing recorded human and renderer/scene clock.
 */
export async function createClinicalKneeLayer(scene,{human}={}){
  if(!human?.ready)throw Error('Clinical TKA requires the existing recorded anatomy');
  const left=['l','left'].includes(human.defaultSide||human.side||human.group.userData.defaultSide),limb=left?'l':'r';
  const nativeGeoms=new Set(human.nativeKneeGeoms||[`femur_${limb}_geom_1`,`tibia_${limb}_geom_1`]);
  const femoralFile=left?'femoral-left.stl':'femoral-right.stl';
  async function loadSTL(name){
    const r=await fetch(new URL(name,ROOT));if(!r.ok)throw Error(`TKA source ${name}: ${r.status}`);
    const buffer=await r.arrayBuffer(),d=new DataView(buffer),n=d.getUint32(80,true);
    if(buffer.byteLength!==84+n*50)throw Error(`Unexpected binary STL: ${name}`);
    const a=new Float32Array(n*9);
    for(let i=0;i<n;i++)for(let j=0;j<9;j++)a[i*9+j]=d.getFloat32(84+i*50+12+j*4,true)*.001;
    const raw=new THREE.BufferGeometry();raw.setAttribute('position',new THREE.BufferAttribute(a,3));
    const g=mergeVertices(raw,.000001);raw.dispose();g.computeVertexNormals();g.computeBoundingBox();return g;
  }
  const [femoralGeometry,insertGeometry,plateGeometry]=await Promise.all([loadSTL(femoralFile),loadSTL('insert.stl'),loadSTL('baseplate.stl')]);
  const group=new THREE.Group();group.name='ConventionalTKA_OpenAcademicCAD';scene.add(group);
  const metal=new THREE.MeshPhysicalMaterial({color:0xbec5c9,metalness:.78,roughness:.34,clearcoat:.18,transparent:true,opacity:0});
  const trayMetal=new THREE.MeshStandardMaterial({color:0x9faeb4,metalness:.9,roughness:.29,transparent:true,opacity:0});
  const polyethylene=new THREE.MeshStandardMaterial({color:0xf2e8d5,metalness:0,roughness:.53,transparent:true,opacity:0});
  const femoral=new THREE.Mesh(femoralGeometry,metal);femoral.name='Conventional_Femoral_Metal_Component';group.add(femoral);
  const tibial=new THREE.Group();tibial.name='Registered_Tibial_Components_Shared_Source_Origin';tibial.rotation.z=Math.PI/2;group.add(tibial);
  const insert=new THREE.Mesh(insertGeometry,polyethylene);insert.name='Conventional_Polyethylene_Insert';tibial.add(insert);
  const plate=new THREE.Mesh(plateGeometry,trayMetal);plate.name='Conventional_Tibial_Metal_Baseplate';tibial.add(plate);
  // Preserve both tibial source origins and their +90° correction. One common
  // presentation fit scale is separate from the exact STL mm->m conversion.
  const fit=.9;group.scale.setScalar(fit);
  // The tibial footprint is aligned to the retained bone cross-section centroid.
  // Source surfaces are sampled at 0.25 mm spacing to retain articular contact.
  // Retain a 0.05 mm display clearance rather than interpenetrating the meshes.
  const TIBIAL_POSTERIOR=-.01055,ARTICULAR_LIFT=.002918,FEMORAL_Z=-.0199,TIBIAL_Z=-.0511+ARTICULAR_LIFT/fit;
  const up=new THREE.Vector3(0,1,0).applyQuaternion(human.kneeRotation).normalize();
  // The source cap reaches above the old -14 mm cut. Resect only the local
  // articular ends, leaving the complete shaft and surrounding anatomy. These
  // explanatory display planes are not patient-specific surgical resections.
  const femoralCut=fit*(FEMORAL_Z+femoralGeometry.boundingBox.max.z)-.003;
  // The baseplate underside is source z=5 mm. Raise the teaching resection
  // to that face, retaining more proximal tibial bone beneath the plate.
  const tibialCut=fit*(TIBIAL_Z+.005)-.0001;
  const inverse={femur:{value:new THREE.Matrix4()},tibia:{value:new THREE.Matrix4()}};
  const uniforms={highlight:{value:0},cut:{value:0},center:{value:human.kneeAnchor.clone()},up:{value:up.clone()}};
  const restored=[];
  human.group.traverse(o=>{
    if(!o.isMesh||!nativeGeoms.has(o.name))return;
    const role=o.name.startsWith('femur')?'femur':'tibia',materials=Array.isArray(o.material)?o.material:[o.material];
    for(const material of materials){
      const previous=material.onBeforeCompile,previousKey=material.customProgramCacheKey;
      restored.push({material,previous,previousKey});
      material.onBeforeCompile=shader=>{
        previous?.(shader);
        Object.assign(shader.uniforms,{uClinicalHighlight:uniforms.highlight,uClinicalCut:uniforms.cut,uClinicalCenter:uniforms.center,uClinicalUp:uniforms.up,uClinicalInverse:inverse[role]});
        shader.vertexShader='varying vec3 vClinicalWorld;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvClinicalWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
        shader.fragmentShader='varying vec3 vClinicalWorld;\nuniform float uClinicalHighlight;\nuniform float uClinicalCut;\nuniform vec3 uClinicalCenter;\nuniform vec3 uClinicalUp;\nuniform mat4 uClinicalInverse;\n'+shader.fragmentShader;
        // Five-plane femoral preparation follows the cap's anterior/posterior
        // walls and distal/chamfer envelope. Tibial preparation keeps the stem
        // within the opaque retained shaft. These are teaching cuts, not a fit.
        const localClip=role==='femur'?
          `vec3 q=(uClinicalInverse*vec4(vClinicalWorld,1.0)).xyz; float distal=mix(-.075,-.014,uClinicalCut); float chamfer=mix(-.075,abs(q.x-.003)*.85-.027,uClinicalCut); bool wall=q.z<mix(-.075,.023,uClinicalCut) && (q.x<-.021 || q.x>.024); if(uClinicalCut>.0001 && q.z<.055 && (q.z<max(distal,chamfer) || wall))discard;`:
          `float cutHeight=mix(.070,${tibialCut.toFixed(8)},uClinicalCut); if(uClinicalCut>.0001 && h>cutHeight && radial<.068) discard;`;
        shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
          vec3 deltaClinical=vClinicalWorld-uClinicalCenter;
          float h=dot(deltaClinical,uClinicalUp);
          float radial=length(deltaClinical-uClinicalUp*h);
          float endRegion=(1.0-smoothstep(.040,.062,abs(h)))*(1.0-smoothstep(.045,.064,radial));
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.95,.055,.025),endRegion*uClinicalHighlight*.88);
          ${localClip}`);
      };
      material.customProgramCacheKey=()=>`${previousKey?.call(material)||''}|clinical-TKA-local-${role}-v3-five-plane-surgery`;
      material.needsUpdate=true;
    }
  });
  const featureEdges=[femoral,insert,plate].map(mesh=>createShadedEdges(mesh,{thresholdAngle:28,color:0x24302e,opacity:.52}));
  let state={femoralInsertion:1,tibialInsertion:1,tibialReveal:1,upperOpacity:1,reveal:0,explode:0,highlight:0,cut:0,separation:0,insertion:1};
  function setState(next={}){
    state={...state,...next};group.position.copy(human.kneeAnchor);group.quaternion.copy(human.kneeRotation).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2));
    group.visible=state.reveal>.0001;
    for(const m of[metal,trayMetal,polyethylene]){m.opacity=clamp(state.reveal);m.depthWrite=state.reveal>.85;}
    for(const m of[trayMetal,polyethylene]){m.opacity*=state.tibialReveal;m.depthWrite=m.opacity>.85;}
    metal.opacity*=state.upperOpacity;metal.depthWrite=metal.opacity>.85;
    femoral.position.set(0,0,FEMORAL_Z+state.explode*.055+state.separation*.055/fit-(1-state.femoralInsertion)*.065/fit);
    tibial.position.set(TIBIAL_POSTERIOR/fit,.006/fit,TIBIAL_Z-state.separation*.055/fit+(1-state.tibialInsertion)*.065/fit);plate.position.set(0,0,-state.explode*.052);insert.position.set(0,0,state.explode*.015);
    uniforms.highlight.value=clamp(state.highlight);uniforms.cut.value=clamp(state.cut);uniforms.center.value.copy(human.kneeAnchor);up.set(0,1,0).applyQuaternion(human.kneeRotation).normalize();uniforms.up.value.copy(up);
    group.updateMatrixWorld(true);
    const upper=new THREE.Matrix4().makeTranslation(...up.clone().multiplyScalar(.055*state.separation).toArray()).multiply(group.matrixWorld),lower=new THREE.Matrix4().makeTranslation(...up.clone().multiplyScalar(-.055*state.separation).toArray()).multiply(group.matrixWorld);
    inverse.femur.value.copy(upper).invert();inverse.tibia.value.copy(lower).invert();
    uniforms.center.value.addScaledVector(up,-.055*state.separation);
    featureEdges.forEach(e=>e.sync());
    Object.assign(group.userData,{source:'aqnazar/TKA-implant-design',side:limb,sourceFemoralFile:femoralFile,commit:'5770570174487f0b59e3a5bbf684a958e21924b5',license:'Apache-2.0',sourceUnitScale:.001,presentationFitScale:fit,classification:'Actual academic conventional implant CAD / illustrative anatomical placement and resection',clinicalApprovedProduct:false,nativeKneeGeoms:[...nativeGeoms],resection:'Five-plane femoral envelope and source-fitted tibial teaching resection; no surgical validation',tibialPosteriorDisplayOffsetMeters:TIBIAL_POSTERIOR,articularDisplayLiftMeters:ARTICULAR_LIFT,nominalDisplayClearanceMeters:.00005,resectionFemoralHeightMeters:femoralCut,resectionTibialHeightMeters:tibialCut,shading:'authored surfaces with source crease/boundary edges',...state});
  }
  function center(mesh){return mesh.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(mesh.matrixWorld);}
  setState();
  return{ready:true,group,kneeAnchor:human.kneeAnchor.clone(),get componentCenters(){return{femoral:center(femoral),insert:center(insert),plate:center(plate)};},setState,getBounds(){return new THREE.Box3().setFromObject(group);},dispose(){scene.remove(group);featureEdges.forEach(e=>e.dispose());for(const r of restored){r.material.onBeforeCompile=r.previous;r.material.customProgramCacheKey=r.previousKey;r.material.needsUpdate=true;}femoralGeometry.dispose();insertGeometry.dispose();plateGeometry.dispose();metal.dispose();trayMetal.dispose();polyethylene.dispose();}};
}
