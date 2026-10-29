/** A presentation cycle for explaining series-elastic storage, not an FEA
 * solution or calibrated load test. The output is locked; unequal spring
 * deflections sum to the motor-side angle (referred to the spring axis).
 */
export function sampleSpringWinding(timeSec=0,{periodSec=8,maxInputDeg=24}={}){
 if(!(periodSec>0)||!(maxInputDeg>=0))throw new RangeError('Winding timing and amplitude must be nonnegative.');
 const time=Math.max(0,Number(timeSec)||0),phase=(time%periodSec)/periodSec;
 // Smooth endpoints and short pauses make the storage/release state readable.
 const ease=x=>x*x*x*(x*(x*6-15)+10),u=phase<.08?0:phase<.46?ease((phase-.08)/.38):phase<.54?1:phase<.92?1-ease((phase-.54)/.38):0;
 const inputDeg=maxInputDeg*u,strongDeg=inputDeg*.29,weakDeg=inputDeg-strongDeg;
 return {phase,inputDeg,outputDeg:0,deflectionDeg:inputDeg,weakDeg,strongDeg,weakBaseDeg:strongDeg,torqueFraction:.18*u+.82*u*u*u,storing:phase<.5,classification:'illustrative series-elastic winding; qualitative torque'};
}

/** Apply only rigid component rotations AFTER source pose/reset and the
 * viewer's distributed spring warp. Always starts from current source pose,
 * never accumulating transforms, and leaves the output mesh untouched.
 */
export function applySpringWindingPose({THREE,parts,weak,model,sample}){
 const key=p=>p.name.split('::')[0],deg=Math.PI/180;
 const rotateWorld=(p,origin,axis,angle)=>{
  if(Math.abs(angle)<1e-10)return;
  const M=new THREE.Matrix4().makeTranslation(...origin.toArray()).multiply(new THREE.Matrix4().makeRotationAxis(axis,angle)).multiply(new THREE.Matrix4().makeTranslation(-origin.x,-origin.y,-origin.z));
  p.mesh.updateWorldMatrix(true,false);
  const local=p.mesh.parent.matrixWorld.clone().invert().multiply(M).multiply(p.mesh.matrixWorld);
  local.decompose(p.mesh.position,p.mesh.quaternion,p.mesh.scale);p.mesh.updateMatrix();
 };
 model.updateMatrixWorld(true);
 const origin=weak.axisPoint.clone().applyMatrix4(weak.mesh.matrixWorld),axis=weak.axis.clone().transformDirection(weak.mesh.matrixWorld).normalize();
 // The weak unit's output terminal follows the inter-unit coupling; the
 // strong unit's output terminal remains fixed to the output shaft.
 rotateWorld(weak,origin,axis,sample.weakBaseDeg*deg);
 const motor=parts.find(p=>key(p)==='motor'),shaft=parts.find(p=>key(p)==='motor_shaft');
 if(motor&&shaft){
  const center=p=>p.mesh.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(p.mesh.matrixWorld);
  const a=center(shaft),motorAxis=center(motor).sub(a).normalize();
  if(motorAxis.lengthSq()>.5)rotateWorld(shaft,a,motorAxis,sample.inputDeg*deg);
 }
 model.updateMatrixWorld(true);
 return sample;
}
