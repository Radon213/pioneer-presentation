import * as THREE from 'three';
// A geometry's reference feature topology is shared by mirrored instances.
const topologyCache=new WeakMap();

/** Crease + boundary edges of the source surface, never triangle wireframe.
 * The line vertices retain source vertex IDs: sync() follows CPU deformation,
 * morphs and skinning without rebuilding the original feature topology.
 * For custom GPU deformation supply transformVertex(out, sourceIndex, mesh).
 * Attach to the source mesh so its complete animated hierarchy is preserved.
 */
export function createShadedEdges(mesh,options={}){
 if(!mesh?.isMesh)throw Error('Shaded edges require a source Mesh');
 const {thresholdAngle=28,color=0x29312e,opacity=.46}=options;
 const material=new THREE.LineBasicMaterial({color,transparent:true,opacity:0,linewidth:1,depthTest:true,depthWrite:false,depthFunc:THREE.LessEqualDepth,toneMapped:false});
 const lines=new THREE.LineSegments(new THREE.BufferGeometry(),material);
 lines.name=`FeatureEdges::${mesh.name||'source'}`;lines.frustumCulled=false;lines.renderOrder=mesh.renderOrder+1;
 lines.userData={classification:'source crease and boundary edges',thresholdAngle};mesh.add(lines);
 let sourceGeometry=null,sourceVersion=-1,sourceCount=0,sourceIndex=null,indexVersion=-1,ids=null,disposed=false;
 const point=new THREE.Vector3();
 function rebuild(){
  sourceGeometry=options.geometry||mesh.geometry;
  const positions=sourceGeometry.getAttribute('position');if(!positions)throw Error('Source geometry has no positions');
  let cached=topologyCache.get(sourceGeometry)?.get(thresholdAngle);
  const index=sourceGeometry.index;
  if(cached&&(cached.sourceCount!==positions.count||cached.index!==index||cached.indexVersion!==(index?.version??-1)))cached=null;
  if(!cached){
   const precomputed=sourceGeometry.userData.precomputedFeatureEdges;
   if(precomputed?.thresholdAngle===thresholdAngle&&precomputed.ids instanceof Uint32Array){ids=precomputed.ids;for(const id of ids)if(id>=positions.count)throw Error('Precomputed feature edge index is invalid');}
   else{
    const temporary=new THREE.EdgesGeometry(sourceGeometry,thresholdAngle),ep=temporary.getAttribute('position');
    const buckets=new Map(),precision=1e6,key=(x,y,z)=>`${Math.round(x*precision)},${Math.round(y*precision)},${Math.round(z*precision)}`;
    for(let i=0;i<positions.count;i++){const k=key(positions.getX(i),positions.getY(i),positions.getZ(i));if(!buckets.has(k))buckets.set(k,i);}
    ids=new Uint32Array(ep.count);
    for(let i=0;i<ep.count;i++){const id=buckets.get(key(ep.getX(i),ep.getY(i),ep.getZ(i)));if(id===undefined)throw Error('Feature edge lost source vertex correspondence');ids[i]=id;}temporary.dispose();
   }
   cached={ids,sourceCount:positions.count,index,indexVersion:index?.version??-1};
   if(!topologyCache.has(sourceGeometry))topologyCache.set(sourceGeometry,new Map());topologyCache.get(sourceGeometry).set(thresholdAngle,cached);
  }
  ids=cached.ids;const edges=new THREE.BufferGeometry();edges.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(ids.length*3),3));
  lines.geometry.dispose();lines.geometry=edges;sourceVersion=-1;sourceCount=positions.count;sourceIndex=sourceGeometry.index;indexVersion=sourceIndex?.version??-1;
  lines.userData.segmentCount=ids.length/2;
 }
 function sync(next={}){
  if(disposed)return;
  const requestedGeometry=options.geometry||mesh.geometry;
  if(sourceGeometry!==requestedGeometry||sourceCount!==requestedGeometry.getAttribute('position').count||sourceIndex!==requestedGeometry.index||indexVersion!==(requestedGeometry.index?.version??-1))rebuild();
  const sourceMaterials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  const sourceMaterial=sourceMaterials.find(m=>m?.visible!==false)||sourceMaterials[0];
  const sourceOpacity=sourceMaterial?.opacity??1;
  material.opacity=THREE.MathUtils.clamp((next.opacity??opacity)*sourceOpacity,0,1);
  material.clippingPlanes=next.clippingPlanes??sourceMaterial?.clippingPlanes??null;
  material.clipIntersection=sourceMaterial?.clipIntersection??false;
  material.clipShadows=sourceMaterial?.clipShadows??false;
  material.visible=sourceMaterial?.visible!==false;
  lines.visible=(next.visible??true)&&mesh.visible&&material.visible&&material.opacity>.003;
  const transform=next.transformVertex??options.transformVertex,positions=sourceGeometry.getAttribute('position');
  const morphing=!!mesh.morphTargetInfluences?.some(v=>v!==0);
  if(next.force||sourceVersion!==positions.version||mesh.isSkinnedMesh||morphing||transform){
   const out=lines.geometry.getAttribute('position');
   for(let i=0;i<ids.length;i++){
    if(sourceGeometry===mesh.geometry&&mesh.getVertexPosition)mesh.getVertexPosition(ids[i],point);else point.fromBufferAttribute(positions,ids[i]);
    transform?.(point,ids[i],mesh);out.setXYZ(i,point.x,point.y,point.z);
   }
   out.needsUpdate=true;sourceVersion=positions.version;
  }
  options.syncMaterial?.(material,sourceMaterial,lines);
 }
 rebuild();sync({force:true});
 return{lines,material,sync,update:sync,dispose(){if(disposed)return;disposed=true;mesh.remove(lines);lines.geometry.dispose();material.dispose();}};
}
