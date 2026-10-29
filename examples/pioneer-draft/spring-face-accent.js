import * as THREE from 'three';

/** The two original monolithic spring exports expose their spiral cuts from
 * opposite ends. This rotates a complete source component, around its actual
 * axial centre, without clipping or rewriting the CAD's triangle indices.
 * Call after the source pose / axial explosion has reset the component.
 */
export function applyOppositeSpringFace(part,amount=1){
  if(!part||amount<=0)return;
  part.mesh.updateWorldMatrix(true,false);
  const origin=part.axisPoint.clone().addScaledVector(part.axis,(part.band[0]+part.band[1])*.5).applyMatrix4(part.mesh.matrixWorld);
  const normal=part.normal.clone().transformDirection(part.mesh.matrixWorld).normalize();
  const rotation=new THREE.Matrix4().makeTranslation(origin.x,origin.y,origin.z)
    .multiply(new THREE.Matrix4().makeRotationAxis(normal,Math.PI*Math.min(1,amount)))
    .multiply(new THREE.Matrix4().makeTranslation(-origin.x,-origin.y,-origin.z));
  const local=part.mesh.parent.matrixWorld.clone().invert().multiply(rotation).multiply(part.mesh.matrixWorld);
  local.decompose(part.mesh.position,part.mesh.quaternion,part.mesh.scale);
  part.mesh.updateMatrix();part.mesh.updateWorldMatrix(false,true);
}

/** Boundary edges of the actual exposed planar spiral face. CAD exporters
 * split vertices at normals, so use quantized positions when cancelling shared
 * triangle edges. Radial limits remove the housing circumference and shaft;
 * the retained lines trace real spring / slot boundaries, not an invented helix.
 */
export function springFaceBoundary(part){
  const geometry=part.geometry||part.mesh.geometry,position=geometry.getAttribute('position'),indices=geometry.index;
  const face=part.name.startsWith('weak')?part.band[0]:part.band[1],sign=part.name.startsWith('weak')?-1:1;
  const edgeMap=new Map(),quantize=v=>[v.x,v.y,v.z].map(x=>Math.round(x/1e-7)).join(','),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  const n=indices?indices.count:position.count;
  for(let i=0;i<n;i+=3){
    const vs=[a,b,c].map((v,j)=>v.fromBufferAttribute(position,indices?indices.getX(i+j):i+j).clone());
    if(!vs.every(v=>Math.abs(v.clone().sub(part.axisPoint).dot(part.axis)-face)<.000065))continue;
    for(let j=0;j<3;j++){
      const p=vs[j],q=vs[(j+1)%3],pk=quantize(p),qk=quantize(q),key=pk<qk?`${pk}|${qk}`:`${qk}|${pk}`;
      const found=edgeMap.get(key);if(found)found.count++;else edgeMap.set(key,{count:1,p:p.clone(),q:q.clone()});
    }
  }
  const points=[],radial=p=>{const d=p.clone().sub(part.axisPoint);return d.addScaledVector(part.axis,-d.dot(part.axis)).length();};
  for(const e of edgeMap.values()){
    if(e.count!==1)continue;
    const r0=radial(e.p),r1=radial(e.q);if(Math.min(r0,r1)<.0040||Math.max(r0,r1)>.01005)continue;
    const offset=part.axis.clone().multiplyScalar(sign*.000035);
    points.push(e.p.add(offset),e.q.add(offset));
  }
  return {points,face,faceSign:sign,segmentCount:points.length/2};
}

/** Narrow coral traces briefly illuminate the real spiral edges. No full-surface
 * glow, camera-facing fake circle or decorative particles are added.
 */
export function createSpringFaceAccents(parts){
  const entries=parts.filter(p=>p.name.startsWith('weak_spring_top')||p.name.startsWith('strong_spring_bottom')).map(part=>{
    const boundary=springFaceBoundary(part),geometry=new THREE.BufferGeometry().setFromPoints(boundary.points);
    const material=new THREE.LineBasicMaterial({color:0xbf4520,transparent:true,opacity:0,depthWrite:false,depthTest:true});
    const line=new THREE.LineSegments(geometry,material);line.name='ActualSpiralFaceBoundary';line.visible=false;line.renderOrder=12;line.frustumCulled=false;
    part.mesh.add(line);line.userData={source:'original source CAD planar-face boundary',faceMm:boundary.face*1000,segmentCount:boundary.segmentCount};
    return {part,line,geometry,material,base:new Float32Array(geometry.getAttribute('position').array)};
  });
  return {
    update({chapter=0,build=0,timeSec=0,reveal=1,deformationAngle=0}={}){
      const active=chapter===4&&(build===3||build===4);
      for(const {part,line,material,geometry,base}of entries){const onlyWeak=build===4,visible=active&&(!onlyWeak||part.name.startsWith('weak'));
        const faceDeformation=onlyWeak?deformationAngle:0;if(visible&&line.userData.lastDeformation!==faceDeformation){line.userData.lastDeformation=faceDeformation;const position=geometry.getAttribute('position'),a=part.axis,o=part.axisPoint;for(let i=0;i<position.count;i++){const n=i*3,x=base[n]-o.x,y=base[n+1]-o.y,z=base[n+2]-o.z,h=x*a.x+y*a.y+z*a.z,rx=x-a.x*h,ry=y-a.y*h,rz=z-a.z*h,r=Math.hypot(rx,ry,rz),u=Math.max(0,Math.min(1,(r-.0035)/(.0102-.0035))),t=faceDeformation*(1-u*u*(3-2*u)),c=Math.cos(t),sn=Math.sin(t);position.setXYZ(i,o.x+a.x*h+rx*c+(a.y*rz-a.z*ry)*sn,o.y+a.y*h+ry*c+(a.z*rx-a.x*rz)*sn,o.z+a.z*h+rz*c+(a.x*ry-a.y*rx)*sn);}position.needsUpdate=true;}
        line.visible=visible;material.opacity=visible?Math.max(0,Math.min(1,reveal))*(build===4?.82+.13*Math.sin(timeSec*2.1):.88+.10*Math.sin(timeSec*2.1)):0;}
    },
    get segments(){return Object.fromEntries(entries.map(e=>[e.part.name,e.line.userData.segmentCount]));},
    dispose(){for(const e of entries){e.part.mesh.remove(e.line);e.geometry.dispose();e.material.dispose();}}
  };
}
