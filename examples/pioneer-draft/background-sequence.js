import * as THREE from 'three';
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{const t=clamp(n);return t*t*(3-2*t);};
export const BACKGROUND_SURFACE_DURATION=7.3;
/** One continuous inspection: two small flexions, then orbit above the actual
 * tibial plateau. This is an explanatory joint inspection, not a measured path. */
export function sampleBackgroundSurfaceSequence(seconds){
 const t=Math.max(0,Number(seconds)||0),u=clamp(t/3.8);
 return{bgWiggle:t<3.8?.15*Math.sin(u*4*Math.PI)*Math.sin(Math.PI*u):0,bgSurfaceInspect:ease((t-4.0)/2.0),bgSurfaceLabels:ease((t-6.2)/.8),clinicalHighlight:.72+.16*Math.abs(Math.sin(u*4*Math.PI)),complete:t>=BACKGROUND_SURFACE_DURATION};
}
export function applyBackgroundSurfaceView({human,live,viewRotation,viewTarget,viewDistance}){
 const weight=clamp(live.bgSurfaceInspect||0);if(!weight||!human)return viewDistance;
 const a=human.getAttachment('left'),surfaces=human.getJointSurfaceLandmarks(),target=surfaces?.center||a.kneeAnchor;
 const up=a.hipAnchor.clone().sub(a.kneeAnchor).normalize(),front=new THREE.Vector3(1,0,0).applyQuaternion(a.kneeRotation);
 const top=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(target.clone().add(up),target,front));
 viewTarget.lerp(target,weight);viewRotation.slerp(top,weight);
 return THREE.MathUtils.lerp(viewDistance,.145/(2*Math.tan(THREE.MathUtils.degToRad(16))),weight);
}
export function backgroundClinicalHighlight(chapter,build,highlight,surgery){
 return chapter===2&&build===1?highlight*(1-ease(surgery/.12)):highlight;
}
