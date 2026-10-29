import * as THREE from 'three';
/** Same-scene, same-frame knee close-up. It shows actual saved kinematics;
 * no stress field is inferred from the walking replay or the adjacent FEA.
 * Uses the parent's renderer (no second canvas, meshes or animation clock).
 */
export function createCoverKneeFocus(host){
 const root=document.createElement('div');root.className='cover-knee-focus';root.hidden=true;
 root.style.cssText='position:absolute;left:28.5%;top:24%;width:15%;height:45%;pointer-events:none;border-top:1px solid rgba(45,49,66,.25);border-bottom:1px solid rgba(45,49,66,.25);z-index:2;color:#bf4520;';
 root.innerHTML='<svg viewBox="0 0 160 260" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible" aria-hidden="true"><path d="M94 97 A38 38 0 0 1 94 173" fill="none" stroke="rgba(191,69,32,.17)" stroke-width="3"/><path data-knee-arc fill="none" stroke="#bf4520" stroke-width="3" stroke-linecap="round"/></svg><div style="position:absolute;top:-1.45em;left:0;width:100%;font-size:21px;text-align:center;white-space:nowrap">Knee flexion</div><div data-knee-angle style="position:absolute;bottom:.2em;left:0;width:100%;font-size:28px;text-align:center;font-variant-numeric:tabular-nums"></div>';
 host.append(root);const camera=new THREE.OrthographicCamera(-.1,.1,.14,-.14,.001,20),angle=root.querySelector('[data-knee-angle]');const arc=root.querySelector('[data-knee-arc]');let lastNumber=-1;
 return {render({active,renderer,scene,sourceCamera,gait,width,height}){
  root.hidden=!active||!gait;if(root.hidden)return;
  const x=width*.285,y=height*.31,w=width*.15,h=height*.45,half=.135;
  const attachment=gait.getAttachment('left'),target=attachment.kneeAnchor;
  // Keep the familiar cover orientation and magnify its real left knee.
  camera.left=-half*w/h;camera.right=half*w/h;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();
  camera.quaternion.copy(sourceCamera.quaternion);camera.position.copy(target).add(new THREE.Vector3(0,0,5).applyQuaternion(camera.quaternion));
  renderer.setViewport(x,y,w,h);renderer.setScissor(x,y,w,h);renderer.setScissorTest(true);renderer.clearDepth();renderer.render(scene,camera);renderer.setScissorTest(false);
  const value=Math.round(Math.abs(attachment.nativeFlexionRad)*180/Math.PI);if(value!==lastNumber){lastNumber=value;angle.textContent=`${value}°`;const theta=Math.max(.02,Math.min(Math.PI*.9,value*Math.PI/180)),r=38,start=-Math.PI/2,end=start+theta,x=94+r*Math.cos(end),y=135+r*Math.sin(end);arc.setAttribute('d',`M94 97 A38 38 0 0 1 ${x} ${y}`);}
  host.dataset.coverKneeVisualization='saved walking knee kinematics; same scene and frame';host.dataset.coverKneeFlexionDeg=String(value);
 },dispose(){root.remove();}};
}
