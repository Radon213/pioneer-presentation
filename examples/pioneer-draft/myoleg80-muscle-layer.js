import * as THREE from 'three';
import {loadJSONWithProgress} from './asset-loading.js?v=revision-20261029-19';
/** Original 80-muscle model paths, displayed with fusiform envelopes for legibility.
 * Envelope thickness is explanatory; no activation or segmented volume is claimed. */
export async function createMyoLeg80MuscleLayer(scene,{human}){
 const data=await loadJSONWithProgress(new URL('./assets/myoleg80-muscles.json',import.meta.url),{key:'myoleg80',label:'MyoLeg 80-muscle anatomy'});
 if(data.muscleCount!==80||data.paths.length!==40)throw Error('MyoLeg80 source count differs');
 const group=new THREE.Group();group.name='SourceMyoLeg80_Left40MusclePaths';scene.add(group);const geometries=[],materials=[];
 for(const [index,path]of data.paths.entries()){
  if(path.points.length<2)continue;const points=path.points.map(p=>new THREE.Vector3(...p)),curve=new THREE.CatmullRomCurve3(points,false,'centripetal'),tube=new THREE.TubeGeometry(curve,48,1,8,false),pos=tube.attributes.position;
  // Taper tendon ends into a visible muscle belly without altering path centres.
  for(let i=0;i<=48;i++){const t=i/48,center=curve.getPointAt(t),radius=.0012+.0062*Math.pow(Math.sin(Math.PI*t),1.15);for(let j=0;j<=8;j++){const n=i*9+j,v=new THREE.Vector3().fromBufferAttribute(pos,n).sub(center).multiplyScalar(radius).add(center);pos.setXYZ(n,v.x,v.y,v.z);}}
  tube.computeVertexNormals();geometries.push(tube);const mat=new THREE.MeshStandardMaterial({color:index%3===0?0x9f493b:index%3===1?0xb96350:0x874237,roughness:.79,side:THREE.DoubleSide,transparent:true,opacity:0});materials.push(mat);const mesh=new THREE.Mesh(tube,mat);mesh.name=path.name;group.add(mesh);
 }
 let opacity=0;
 function setReveal(value){opacity=THREE.MathUtils.clamp(value,0,1);group.visible=opacity>.001;group.position.copy(human.kneeAnchor);group.quaternion.copy(human.kneeRotation);for(const mat of materials){mat.opacity=opacity;mat.depthWrite=opacity>.97;}}
 setReveal(0);group.userData={source:data.sourceModel,muscleCount:80,displayMuscles:40,classification:data.provenance.classification};
 return{ready:true,group,setReveal,dispose(){scene.remove(group);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
}
