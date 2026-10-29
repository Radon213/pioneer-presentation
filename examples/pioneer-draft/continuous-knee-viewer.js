import {getMotionRate} from './motion-clock.js?v=revision-20261029-22';
import * as THREE from 'three';
import {GLTFLoader} from '../pioneer-interactive/vendor/GLTFLoader.js';
import {DRACOLoader} from '../pioneer-interactive/vendor/DRACOLoader.js';
import {RoomEnvironment} from '../pioneer-interactive/vendor/RoomEnvironment.js';
import {createContinuousHumanLayer} from './continuous-human-layer.js?v=revision-20261029-22';
import {createClinicalKneeLayer} from './clinical-knee-layer.js?v=revision-20261029-22';
import {createShadedEdges} from './shaded-edges.js?v=revision-20261029-22';
import {createNativeKneeComparison} from './native-knee-comparison.js?v=revision-20261029-22';
import {buildVisualExplanation} from './visual-explanations.js?v=revision-20261029-22';
import {buildChapterOverlay} from './chapter-overlays.js?v=revision-20261029-22';
import {createGaitChapterLayer} from './gait-chapter-layer.js?v=revision-20261029-22';
import {createSpringFEALayer} from './spring-fea-layer.js?v=revision-20261029-22';
import {loadJSONWithProgress,loadBinaryWithProgress,reportLoadStage} from './asset-loading.js?v=revision-20261029-22';

const ASSETS=new URL('../pioneer-interactive/assets/',import.meta.url);
const VENDOR=new URL('../pioneer-interactive/vendor/',import.meta.url);
const C={paper:0xfdfcf8,ink:'#2d3142',muted:'#4f5d75',accent:'#bf4520'};
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=t=>t*t*(3-2*t);
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const UP=new THREE.Vector3(0,1,0),R5_ORIGIN=new THREE.Vector3(.002871470,.063386300,.011999999);
const R5_AXIS=new THREE.Vector3(-.121869,-.992546,0).normalize();
const isSpring=n=>n.startsWith('weak_spring_top')||n.startsWith('strong_spring_bottom');
const isLong=n=>['femur_stem','fem_4_7','o_ring_stem','motor::','motor_cable','sspsr3_20::','root::'].some(s=>n.startsWith(s));
const isLink=n=>['link_1','link_3','linkage_base','tibial_base','joint3_shaft','peek_bushing','insert_','plate'].some(s=>n.startsWith(s));
const partKey=name=>name.split('::')[0];
// Keep complete source joint assemblies together. J3's shaft is carried by
// Link_3 and paired JFM bushings; the cam follower includes its real housing,
// inserts and JTM washers. LMSBM6 belongs to the motor-side assembly and must
// not appear as an unsupported ring during the linkage explanation.
const MECHANISM_CORE=new Set(['link_1','link_3','linkage_base','tibial_base','joint3_shaft','slpt6_25__1_','pos_5ecbody__pos_5ecbody__1_','pos_5ecball__pos_5ecball__1_','jfm_0507_05_1','jfm_0507_05_2','peek_bushing','body_c_cfs2_4_5__cut_extrude1','bearing_holder','insert_left','insert_right','insert_middle','jtm_0512_010','jtm_0512_010_1','guide1_e_crvs1020__mirror1_2','mta05_13_h_zz_dbs','plate','4mm_m3_shcs','4mm_m3_shcs_1','4mm_m4_shcs','12mm_m5_shcs','12mm_m5_shcs_1']);
const DRIVE_ASSEMBLY=new Set([...MECHANISM_CORE,'motor','motor_cable','motor_shaft','lmsbm6_5_60','sspsr3_20','sspsr2_16','helical_1m_21t','squre_splined_bevel_gear','part_49','jfm_0507_05','jfm_0507_05_3','jsm_0508_05','weak_spring_top','strong_spring_bottom','12mm_m3_shcs','12mm_m3_shcs_1','o_ring_shaft_','o_ring_stem_','4x12_washer','20mm_m4_shcs']);
const originString=v=>v.toArray().map(n=>Number(n.toFixed(6))).join(',');

/** One renderer, scene, original GLB and material family from implant to spring.
 * Every animated transition starts from the current interpolated state.
 * Source CAD warp is an explicitly identified explanation, never a solved field.
 */
export async function createContinuousKneeViewer(host){
  Object.assign(host.dataset,{ready:'loading',instance:THREE.MathUtils.generateUUID(),component:'continuous-knee',animation:'idle'});
  host.style.overflow='hidden';
  const status=host.querySelector('.scene-status')||document.createElement('div');status.className='scene-status';status.textContent='Loading the original knee implant…';if(!status.parentNode)host.append(status);
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});}
  catch(e){status.textContent='3D unavailable. Original figures remain available.';host.dataset.ready='error';return{ready:false,setStory(){},resize(){},pause(){},dispose(){status.remove();}};}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
  renderer.localClippingEnabled=true;renderer.domElement.setAttribute('aria-label','The same Pioneer knee implant, progressively revealed from the complete joint to the original nonlinear spring');
  renderer.domElement.style.cssText='position:absolute;inset:0;width:100%;height:100%;';host.prepend(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color(C.paper);
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,.0001,30);camera.aspect=1;
  let projectionHeight=1;
  function updateOrthographicProjection(){const half=projectionHeight/2;camera.left=-half*camera.aspect;camera.right=half*camera.aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();}
  const envScene=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(envScene,.04).texture;
  scene.environment=env;envScene.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff,0x8d887e,.6));
  for(const [xyz,power]of[[[1,2,3],1.3],[[-2,.5,-1],.35]]){const l=new THREE.DirectionalLight(0xffffff,power);l.position.set(...xyz);scene.add(l);}
  const inspectionLight=new THREE.DirectionalLight(0xffffff,0);scene.add(inspectionLight);scene.add(inspectionLight.target);
  const draco=new DRACOLoader();draco.setDecoderPath(VENDOR.href);draco.setDecoderConfig({type:'wasm'});draco.setWorkerLimit(2);
  let gltf,meta,trajectory,cadLoadedBytes=0;
  reportLoadStage('cad-model','download',{label:'Original knee CAD',phase:'download',loadedBytes:0,totalBytes:null});
  try{[gltf,meta,trajectory]=await Promise.all([
    (async()=>{const loader=new GLTFLoader().setDRACOLoader(draco);let result;if(typeof DecompressionStream==='function'){const buffer=await loadBinaryWithProgress(new URL('aakj-v3-native-rebound.glb.gz',ASSETS),{key:'cad-model',label:'Original knee CAD',expectedBytes:8575386});reportLoadStage('cad-model','parse',{label:'Original knee CAD',phase:'parse'});result=await loader.parseAsync(buffer,ASSETS.href);cadLoadedBytes=8575386;}else{result=await loader.loadAsync(new URL('aakj-v3-native-rebound.glb',ASSETS).href);cadLoadedBytes=10617124;}reportLoadStage('cad-model','ready',{label:'Original knee CAD',phase:'ready',state:'complete',ratio:1,loadedBytes:cadLoadedBytes,totalBytes:cadLoadedBytes});return result;})(),
    loadJSONWithProgress(new URL('model-meta-native-rebound.json',ASSETS),{key:'cad-metadata',label:'CAD source metadata'}),
    loadJSONWithProgress(new URL('assets/motion/mechanism-motion.json',import.meta.url),{key:'cad-kinematics',label:'Validated mechanism poses'})]);}
  catch(e){status.textContent='The source knee model could not load.';host.dataset.ready='error';draco.dispose();return{ready:false,setStory(){},resize(){},pause(){},dispose(){renderer.dispose();env.dispose();status.remove();}};}
  draco.dispose();const model=gltf.scene;scene.add(model);
  const mixer=new THREE.AnimationMixer(model);gltf.animations.forEach(c=>mixer.clipAction(c).play());mixer.setTime(0);model.updateMatrixWorld(true);
  const restoredJointSpecs=[['revolute_1',[0,1,0]],['revolute_2',[1,0,0]],['revolute_3',[-1,0,0]],['revolute_4',[1,0,0]],['revolute_5',[-.121869,-.992546,0]],['slider_1',[-.0324732,0,.999473]],['cylindrical_1',[0,1,0]],['cylindrical_1_1',[0,1,0]],['revolute_6_loop_closure',[-1,0,0]]];
  const restoredJointNodes=restoredJointSpecs.map(([name,axis])=>{const node=model.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(`JOINT::${name}`));if(!node)throw Error(`Restored source joint ${name} is absent`);const vector=new THREE.Vector3(...axis);if(name!=='slider_1'&&name!=='cylindrical_1')vector.normalize();return{name,node,prismatic:name==='slider_1'||name==='cylindrical_1',axis:vector,position:node.position.clone(),rotation:node.quaternion.clone(),q0:trajectory.frames[0].jointCoordinates[name]};});
  const parts=[],sourceMaterials=new Map(gltf.parser.json.materials.map(m=>[m.name,m.pbrMetallicRoughness]));
  model.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const original=meta.meshes.find(p=>p.name===mesh.name||THREE.PropertyBinding.sanitizeNodeName(p.name)===mesh.name);
    const name=original?.name||mesh.name;
    const sourceArray=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    const materials=sourceArray.map(m=>{const c=m.clone();c.transparent=true;return c;});
    mesh.material=Array.isArray(mesh.material)?materials:materials[0];mesh.geometry.computeBoundingBox();
    const part={mesh,name,category:original?.category||'structure',materials,basePosition:mesh.position.clone(),baseQuaternion:mesh.quaternion.clone(),baseScale:mesh.scale.clone(),sourceWorldZero:mesh.matrixWorld.clone(),opacity:1};
    if(isSpring(name)){
      // Leaf geometry, not the ancestor weak-spring frame: no double explosion.
      const inverse=mesh.matrixWorld.clone().invert();
      part.axisPoint=R5_ORIGIN.clone().applyMatrix4(inverse);
      part.axis=R5_AXIS.clone().transformDirection(inverse).normalize();
      part.normal=new THREE.Vector3(0,0,1).transformDirection(inverse).normalize();
      part.geometry=mesh.geometry.clone();mesh.geometry=part.geometry;
      part.positions=new Float32Array(part.geometry.attributes.position.array);
      part.band=name.startsWith('weak')?[-.0223,-.0163]:[-.0443,-.0243];
      part.fullIndices=part.geometry.index?Array.from(part.geometry.index.array):Array.from({length:part.geometry.attributes.position.count},(_,i)=>i);
      part.topIndices=[];
      for(let i=0;i<part.fullIndices.length;i+=3){const ids=part.fullIndices.slice(i,i+3),hs=[],rs=[];for(const id of ids){const v=new THREE.Vector3().fromBufferAttribute(part.geometry.attributes.position,id).sub(part.axisPoint),h=v.dot(part.axis);hs.push(h);rs.push(v.addScaledVector(part.axis,-h).length());}if(Math.min(...hs)>=part.band[0]-.00006&&Math.max(...hs)<=part.band[1]+.00006&&Math.max(...rs)<=.01004&&!hs.every(h=>Math.abs(h-part.band[0])<.00006))part.topIndices.push(...ids);}
      const center=part.geometry.boundingBox.getCenter(new THREE.Vector3());
      part.axialCenter=part.axisPoint.clone().addScaledVector(part.axis,center.clone().sub(part.axisPoint).dot(part.axis));
      part.lastAngle=NaN;
    }
    parts.push(part);
  });
  const weak=parts.find(p=>p.name.startsWith('weak_spring_top')),strong=parts.find(p=>p.name.startsWith('strong_spring_bottom'));
  if(!weak||!strong)throw Error('The original spring meshes are missing');
  let human=null;
  try{human=await createContinuousHumanLayer(scene,{side:'left'});}catch(e){console.warn('Recorded anatomy could not load',e);host.dataset.humanReady='error';}
  let clinical=null;
  if(human)try{clinical=await createClinicalKneeLayer(scene,{human});host.dataset.clinicalReady='true';}catch(e){console.warn('Conventional TKA source could not load',e);host.dataset.clinicalReady='error';}
  let attachmentSource=null;try{attachmentSource=await fetch(new URL('assets/bilateral-sts-attachments.json',import.meta.url)).then(r=>r.json());}catch(e){console.warn('Bilateral attachment evidence unavailable',e);}
  const roleByName=new Map();for(const [role,names]of Object.entries(attachmentSource?.componentGroups||{}))for(const name of names)roleByName.set(name,role);
  for(const p of parts)p.attachmentRole=roleByName.get(p.name.split('::')[0])||(p.name==='Slider_Cover'?'tibial':'mechanism');
  const rightAssembly=new THREE.Group();rightAssembly.name='SourceMirroredRightImplant';rightAssembly.visible=false;scene.add(rightAssembly);
  const rightParts=parts.map(p=>{const mats=p.materials.map(m=>{const c=m.clone();c.clippingPlanes=[];return c;});const mesh=new THREE.Mesh(p.mesh.geometry,Array.isArray(p.mesh.material)?mats:mats[0]);mesh.name=`RIGHT_MIRROR::${p.name}`;mesh.matrixAutoUpdate=false;rightAssembly.add(mesh);return{mesh,materials:mats,source:p};});
  for(const p of parts)p.edges=createShadedEdges(p.mesh,{opacity:.46,thresholdAngle:28});
  for(const p of rightParts)p.edges=createShadedEdges(p.mesh,{opacity:.46,thresholdAngle:28});
  let nativeComparison=null;try{if(human)nativeComparison=await createNativeKneeComparison(scene,{human});}catch(e){console.warn('Native knee comparison unavailable',e);}
  if(nativeComparison)nativeComparison.group.visible=false;
  if(nativeComparison)nativeComparison.group.position.set(...trajectory.frames[0].jointCenters.j3);
  const materials=parts.flatMap(p=>p.materials),mismatches=materials.filter(m=>{const s=sourceMaterials.get(m.name),c=s?.baseColorFactor||[1,1,1,1];return!s||Math.max(...[m.color.r,m.color.g,m.color.b].map((v,i)=>Math.abs(v-c[i])))>1e-6||Math.abs(m.metalness-(s.metallicFactor??1))>1e-6||Math.abs(m.roughness-(s.roughnessFactor??1))>1e-6;});
  Object.assign(host.dataset,{materialSource:'original-cad-native-subtrees-correctly-owned',materialMismatches:String(mismatches.length),meshCount:String(parts.length),restoredJointCount:String(restoredJointNodes.length),rendererCount:'1',modelCount:'2',leftSourceInstance:model.uuid,rightMirrorInstance:rightAssembly.uuid,rightMirror:'source-registration-affine-reflection; no additional mirror',attachmentSource:'assets/bilateral-sts-attachments.json',ready:'true'});host.querySelectorAll('.scene-poster,.scene-status').forEach(el=>el.hidden=true);

  const overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');overlay.setAttribute('viewBox','0 0 1600 540');overlay.setAttribute('preserveAspectRatio','none');overlay.setAttribute('aria-hidden','true');
  overlay.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;font-family:inherit;';host.append(overlay);
  const sectionLines=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:C.accent,transparent:true,opacity:.43,depthTest:false}));sectionLines.renderOrder=15;scene.add(sectionLines);
  let live=null,raf=0,transition=null,last=0,initialized=false,disposed=false,page=1,step=0,cutDimensions=null,chapter=0,build=0,gaitClock=0,suspended=false;
  let gait=null,fea=null,chapterToken=0;status.hidden=false;status.textContent='Loading recorded bilateral gait…';
  try{gait=await createGaitChapterLayer(scene,{human});gait.setOpacity(0);host.dataset.gaitGeometryCount=String(gait.group.userData.geometryCount);host.dataset.gaitRestoredNativeBones=String(gait.group.userData.retainedNativeShaftCount);host.dataset.gaitVisualRecovery='6 original native POS5/SLPT subtrees rebound once to saved body poses';}catch(e){console.warn('Recorded gait unavailable',e);}
  status.hidden=true;let feaPromise=null;
  const ensureFEA=()=>feaPromise??=(createSpringFEALayer(scene).then(layer=>{fea=layer;fea.setOpacity(0);return layer;}));
  // This concept reuses the original Maxon mesh, without exposing the complete
  // Pioneer assembly. It is a visual addition, not a direct-drive surgical fit.
  const conceptMotor=new THREE.Group();conceptMotor.name='Concept_ConventionalTKA_Plus_OriginalMaxon';scene.add(conceptMotor);
  const conceptMaterials=[],conceptEdges=[];
  for(const p of parts.filter(p=>['motor','motor_cable','motor_shaft'].includes(partKey(p.name)))){
    const mats=p.materials.map(m=>{const c=m.clone();c.clippingPlanes=[];c.transparent=false;c.opacity=1;conceptMaterials.push(c);return c;});
    const mesh=new THREE.Mesh(p.mesh.geometry,Array.isArray(p.mesh.material)?mats:mats[0]);mesh.name=`CONCEPT_MAXON::${p.name}`;mesh.matrixAutoUpdate=false;mesh.matrix.copy(p.sourceWorldZero);conceptMotor.add(mesh);
    conceptEdges.push(createShadedEdges(mesh,{thresholdAngle:28,opacity:.46}));
  }
  conceptMotor.updateMatrixWorld(true);const motorBox=new THREE.Box3().setFromObject(conceptMotor),motorCenter=motorBox.getCenter(new THREE.Vector3());
  for(const mesh of conceptMotor.children)mesh.matrix.premultiply(new THREE.Matrix4().makeTranslation(-motorCenter.x,-motorCenter.y,-motorCenter.z));
  conceptMotor.visible=false;let myo80=null,myo80Promise=null,backgroundClock=0;
  const ensureMyo80=()=>myo80Promise??=(import('./myoleg80-muscle-layer.js?v=revision-20261029-22').then(m=>m.createMyoLeg80MuscleLayer(scene,{human})).then(layer=>myo80=layer));
  let myoExamples=null,myoPromise=null,myoPrefetchTimer=0;
  const ensureMyoExamples=()=>myoPromise??=import('./myoassist-examples-layer.js?v=revision-20261029-22').then(m=>m.createMyoAssistExamplesLayer(scene)).then(layer=>{myoExamples=layer;layer.setReveal(0);return layer;}).catch(error=>{myoPromise=null;throw error;});
  function backgroundRotation(){const target=new THREE.Vector3(),direction=new THREE.Vector3(1.3,.14,-.4).normalize();return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(direction,target,UP));}
  function backgroundState(st,to){
    human.group.position.set(0,0,0);human.setState({motionProgress:1});
    const a=human.getAttachment('left'),knee=a.kneeAnchor,hip=a.hipAnchor,rotation=backgroundRotation();
    if(st===0){const up=hip.clone().sub(knee).normalize(),forward=new THREE.Vector3(1,0,0).applyQuaternion(a.kneeRotation),direction=a.kneeAxis.clone().negate().addScaledVector(forward,.16).addScaledVector(up,.03).normalize();rotation.setFromRotationMatrix(new THREE.Matrix4().lookAt(knee.clone().add(direction),knee,up));}
    const right=new THREE.Vector3(1,0,0).applyQuaternion(rotation);
    Object.assign(to,{phase:0,stemCut:0,section:0,attach:0,leftInsertion:0,rightInsertion:0,rightReveal:0,nativeCut:0,nativeCutLeft:0,nativeCutRight:0,nativeComparisonOpacity:0,humanReveal:1,muscles:st===2?0:st===1?0:.12,motionProgress:1,chair:0,gait:0,fea:0,clinicalReveal:st>=1?1:0,clinicalCut:st>=1?1:0,clinicalHighlight:st===0?.9:0,clinicalExplode:0,bgExamples:st===3?1:0,bgMotor:st===4?1:0,bgSurgery:st>=1?1:0,bgWiggle:0,bgMuscle80:st===2?1:0,bgFocus:st!==3?1:0,opacities:parts.map(()=>0)});
    to.rotation.copy(rotation);let height;
    if(st===0){to.target.copy(knee).addScaledVector(right,.035);height=.36;}
    else if(st===1){to.target.copy(knee).add(new THREE.Vector3(0,.005,0)).addScaledVector(right,.035);height=.47;}
    else if(st===2){to.target.copy(knee).lerp(hip,.42).addScaledVector(right,.19);height=.74;}
    else if(st===3&&myoExamples){
      myoExamples.group.position.set(0,0,0);myoExamples.group.quaternion.identity();const bounds=myoExamples.getBounds(),size=bounds.getSize(new THREE.Vector3());to.target.copy(bounds.getCenter(new THREE.Vector3()));height=Math.max(size.y*1.2,size.x/camera.aspect*1.15);to.rotation.setFromRotationMatrix(new THREE.Matrix4().lookAt(to.target.clone().add(new THREE.Vector3(.45,.08,1)),to.target,UP));
    }else{to.target.copy(knee).add(new THREE.Vector3(0,.025,0)).addScaledVector(right,.095);height=.36;}
    to.distance=height/(2*Math.tan(THREE.MathUtils.degToRad(16)));
    return to;
  }

  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const autoplayAllowed=()=>!reduced()&&new URLSearchParams(location.search).get('motion')!=='static';
  const cloneState=s=>({...s,target:s.target.clone(),rotation:s.rotation.clone(),devicePosition:s.devicePosition.clone(),deviceRotation:s.deviceRotation.clone(),opacities:s.opacities.slice()});
  const plane=new THREE.Plane(),stemPlane=new THREE.Plane(new THREE.Vector3(0,1,0),.012);
  function sourceFrame(phase){const x=clamp(phase)*(trajectory.frames.length-1),i=Math.floor(x),j=Math.min(i+1,trajectory.frames.length-1),t=x-i,a=trajectory.frames[i],b=trajectory.frames[j],r={jointCenters:{}};
    for(const k of Object.keys(a.jointCenters))r.jointCenters[k]=a.jointCenters[k].map((v,n)=>v+(b.jointCenters[k][n]-v)*t);
    r.jointCoordinates={};for(const k of Object.keys(a.jointCoordinates))r.jointCoordinates[k]=a.jointCoordinates[k]+(b.jointCoordinates[k]-a.jointCoordinates[k])*t;
    for(const k of['clipTime','inputDeg','h3mm','sliderMm','pivotDeg'])r[k]=a[k]+(b[k]-a[k])*t;return r;
  }
  function applyRestoredPose(frame){
    // The GLB keys start at Blender frame1 / 30 and were exported every third
    // frame. Use its source hierarchy, then apply the full-resolution validated
    // joint coordinates so CAD surfaces and joint-centre annotations agree.
    mixer.setTime(frame.clipTime+1/30);
    for(const joint of restoredJointNodes){const dq=frame.jointCoordinates[joint.name]-joint.q0;joint.node.position.copy(joint.position);joint.node.quaternion.copy(joint.rotation);if(joint.prismatic)joint.node.position.addScaledVector(joint.axis.clone().applyQuaternion(joint.rotation),dq);else joint.node.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(joint.axis,dq));}
  }
  function opacityFor(p,pg,st){
    if(chapter===3){
      const key=partKey(p.name);
      if(build<=3){
        if(MECHANISM_CORE.has(key))return 1;
        // The curved slot is part of this genuine femoral shell. Retain it as
        // assembly context rather than leaving the follower without a slot.
        if(key==='condyle_right')return .18;
        if(key==='condyle_left')return .06;
        if(key==='Slider_Cover')return build===2?.10:.24;
        return 0;
      }
      if(build===4){if(DRIVE_ASSEMBLY.has(key))return 1;if(key==='motor_housing'||key==='condyle_right')return .13;if(key==='condyle_left')return .05;if(key==='Slider_Cover')return .24;return 0;}
      if(isSpring(p.name))return 1;
      if(key==='motor_shaft'||key==='squre_splined_bevel_gear'||key==='jsm_0508_05')return .55;
      return DRIVE_ASSEMBLY.has(key)?.12:0;
    }
    if(pg===18||pg===19||pg===28)return 1;
    if(pg===13&&st>=3)return isSpring(p.name)?1:0;
    if((pg===12&&st>=2)||pg===13||pg===16||pg===17)return p===weak?1:0;
    if(pg<=4)return p.name.startsWith('femur_medium')||p.name.startsWith('tibia_medium')?.13:1;
    if(pg===5)return isLong(p.name)?.27:1;
    if(pg===6)return p.category==='shell'?.14:isLong(p.name)?.07:1;
    if(pg===7||pg===8){if(p.name.startsWith('condyle_right'))return 0;return ['link_1','link_3','linkage_base','joint3_shaft','peek_bushing','tibial_base','body_c_cfs2_4_5','guide1_e_crvs1020','plate','lmsbm6'].some(n=>p.name.startsWith(n))?1:0;}
    if(pg===9||pg===10)return p.name.startsWith('motor::')||p.name.startsWith('motor_shaft')?1:p.category==='shell'?.04:isLong(p.name)?0:1;
    if(pg>=11){if(isSpring(p.name))return pg>=13&&p.name.startsWith('strong')?.1:1;if(p.name.startsWith('motor_shaft'))return pg>=13?.12:.55;return p.category==='shell'?(pg>=13?.035:.16):isLong(p.name)?.018:pg===11?.26:pg===12?.14:.035;}
    return 1;
  }
  function fixedPhase(pg,st){
    // The same restored physical pose is retained through the actuator reveal
    // and spring handoff. No unexplained reverse bend between these causes.
    if(chapter===3)return[0,.40,.58,.82,.82,.82][Math.min(build,5)];
    if(pg===18||pg===19||pg===28)return 0;
    if(pg<=4)return 0;
    if(pg===5)return[0,.08,.16][Math.min(st,2)];
    if(pg===6)return[0,.16,.32][Math.min(st,2)];
    if(pg===7)return[0,.07,.32,.55][Math.min(st,3)];
    if(pg===8)return[.55,.62,.69,.77,.83][Math.min(st,4)];
    if(pg===9)return[.83,.76,.65,.57][Math.min(st,3)];
    if(pg===10)return[.57,.48,.38,.25][Math.min(st,3)];
    return.25;
  }
  const clipFlexion=trajectory.frames.map(f=>Math.abs(f.jointCoordinates.revolute_2-f.jointCoordinates.revolute_3));
  const maxClipFlexion=Math.max(...clipFlexion);
  function phaseForFlexion(angle){const desired=Math.abs(angle||0);let best=0;for(let i=1;i<clipFlexion.length;i++)if(Math.abs(clipFlexion[i]-desired)<Math.abs(clipFlexion[best]-desired))best=i;return best/(clipFlexion.length-1);}
  function outsideOffset(side){return new THREE.Vector3(.085,0,side==='left'?-.17:.17);}
  function blendMatrix(a,b,u){if(u>=.99999)return b.clone();const ap=new THREE.Vector3(),aq=new THREE.Quaternion(),as=new THREE.Vector3(),bp=new THREE.Vector3(),bq=new THREE.Quaternion(),bs=new THREE.Vector3();a.decompose(ap,aq,as);b.decompose(bp,bq,bs);return new THREE.Matrix4().compose(ap.lerp(bp,u),aq.slerp(bq,u),as.lerp(bs,u));}
  function attachmentTransform(part,attachment,nativeSource){return (part.attachmentRole==='femoral'?attachment.cadToWorldFemur:attachment.cadToWorldTibia).clone().multiply(part.attachmentRole==='mechanism'?nativeSource:part.sourceWorldZero);}
  function pose(s){
    model.position.copy(s.devicePosition);model.quaternion.copy(s.deviceRotation);model.scale.setScalar(s.deviceScale);
    for(const p of parts){p.mesh.matrixAutoUpdate=true;p.mesh.position.copy(p.basePosition);p.mesh.quaternion.copy(p.baseQuaternion);p.mesh.scale.copy(p.baseScale);}
    const leftAttachment=human?.getAttachment?.('left'),rightAttachment=human?.getAttachment?.('right');
    const effectivePhase=s.attach>.001&&leftAttachment?phaseForFlexion(leftAttachment.nativeFlexionRad):s.phase;
    const f=sourceFrame(effectivePhase);applyRestoredPose(f);
    model.updateMatrixWorld(true);
    for(const p of[weak,strong]){
      const sign=p===weak?1:-1,amount=p===weak?s.explodeWeak:s.explodeStrong;
      const axis=p.axis.clone().transformDirection(p.mesh.matrixWorld).normalize();
      const localAxis=axis.transformDirection(p.mesh.parent.matrixWorld.clone().invert());
      p.mesh.position.copy(p.basePosition).addScaledVector(localAxis,amount*.016*sign);
      if(p===strong&&s.spreadStrong){const sideways=p.normal.clone().transformDirection(p.mesh.matrixWorld).transformDirection(p.mesh.parent.matrixWorld.clone().invert());p.mesh.position.addScaledVector(sideways,s.spreadStrong*.033);}
    }
    model.updateMatrixWorld(true);
    if(s.attach>.00001&&leftAttachment){
      const rootInverse=model.matrixWorld.clone().invert(),baseWorld=parts.map(p=>p.mesh.matrixWorld.clone()),leftLocal=baseWorld.map(m=>rootInverse.clone().multiply(m));
      let rightLocal=leftLocal;
      if(rightAttachment&&s.rightReveal>.0001){const rp=sourceFrame(phaseForFlexion(rightAttachment.nativeFlexionRad));applyRestoredPose(rp);model.updateMatrixWorld(true);rightLocal=parts.map(p=>rootInverse.clone().multiply(p.mesh.matrixWorld));applyRestoredPose(f);model.updateMatrixWorld(true);}
      parts.forEach((p,i)=>{const target=attachmentTransform(p,leftAttachment,leftLocal[i]);target.setPosition(new THREE.Vector3().setFromMatrixPosition(target).addScaledVector(outsideOffset('left'),1-s.leftInsertion));const world=blendMatrix(baseWorld[i],target,s.attach);p.mesh.matrix.copy(p.mesh.parent.matrixWorld.clone().invert().multiply(world));p.mesh.matrixAutoUpdate=false;});
      model.updateMatrixWorld(true);rightAssembly.visible=s.rightReveal>.002;
      rightParts.forEach((p,i)=>{p.mesh.visible=s.rightReveal>.002;if(rightAttachment){const target=attachmentTransform(p.source,rightAttachment,rightLocal[i]);target.setPosition(new THREE.Vector3().setFromMatrixPosition(target).addScaledVector(outsideOffset('right'),1-s.rightInsertion));p.mesh.matrix.copy(target);}for(const m of p.materials){m.opacity=s.rightReveal;m.transparent=true;m.depthWrite=s.rightReveal>.7;m.clippingPlanes=[];}});rightAssembly.updateMatrixWorld(true);
      const leftFlex=Math.abs(leftAttachment.nativeFlexionRad||0),rightFlex=Math.abs(rightAttachment?.nativeFlexionRad||0);
      Object.assign(host.dataset,{leftPlacement:s.leftInsertion.toFixed(4),rightPlacement:s.rightInsertion.toFixed(4),rightReveal:s.rightReveal.toFixed(4),leftSource:'original persistent GLB instance',rightSource:'source-verified mirrored counterpart',leftMirror:'false',rightMirror:'true; included once in cadToWorld affine',leftRegistrationDeterminant:String(leftAttachment.cadToWorldTibia.determinant()),rightRegistrationDeterminant:String(rightAttachment?.cadToWorldTibia.determinant()),leftFemurAttachment:originString(leftAttachment.femur.position),leftTibiaAttachment:originString(leftAttachment.tibia.position),rightFemurAttachment:rightAttachment?originString(rightAttachment.femur.position):'',rightTibiaAttachment:rightAttachment?originString(rightAttachment.tibia.position):'',nativeLeftFlexionDeg:THREE.MathUtils.radToDeg(leftFlex).toFixed(4),nativeRightFlexionDeg:THREE.MathUtils.radToDeg(rightFlex).toFixed(4),mechanismVerifiedFlexionMaxDeg:THREE.MathUtils.radToDeg(maxClipFlexion).toFixed(4),mechanismRangeExceeded:String(Math.max(leftFlex,rightFlex)>maxClipFlexion+.00001),mechanismMapping:'nearest verified source-kinematic pose; clamped outside 0–102 degree evidence; illustrative graft',attachmentMethod:'independent source femoral/tibial bone matrices; source four-bar pose for intermediate parts'});
      for(const [side,attachment]of[['left',leftAttachment],['right',rightAttachment]])if(attachment){
        const index=Math.round(phaseForFlexion(attachment.nativeFlexionRad)*(trajectory.frames.length-1));
        host.dataset[`${side}MechanismFlexionDeg`]=THREE.MathUtils.radToDeg(clipFlexion[index]).toFixed(4);
        host.dataset[`${side}MechanismFlexionDifferenceDeg`]=THREE.MathUtils.radToDeg(Math.abs(attachment.nativeFlexionRad)-clipFlexion[index]).toFixed(4);
        host.dataset[`${side}AnteriorVector`]=originString(new THREE.Vector3(0,0,1).transformDirection(attachment.cadToWorldTibia));
        host.dataset[`${side}LateralVector`]=originString(new THREE.Vector3(1,0,0).transformDirection(attachment.cadToWorldTibia));
        host.dataset[`${side}FemoralProximalVector`]=originString(new THREE.Vector3(0,1,0).transformDirection(attachment.cadToWorldFemur));
        host.dataset[`${side}RegisteredJ3ErrorM`]=String(new THREE.Vector3(...sourceFrame(0).jointCenters.j3).applyMatrix4(attachment.cadToWorldTibia).distanceTo(attachment.kneeAnchor));
      }
    }else rightAssembly.visible=false;
    if(chapter===3){
      const visible=parts.filter((p,i)=>s.opacities[i]>.15).map(p=>partKey(p.name));
      Object.assign(host.dataset,{mechanismPoseSource:'all 9 source joint coordinates; original native POS5/SLPT subtrees split from composite owners and correctly rebound',mechanismVisibleParts:visible.join(','),j3AssemblyComplete:String(['joint3_shaft','slpt6_25__1_','pos_5ecbody__pos_5ecbody__1_','pos_5ecball__pos_5ecball__1_','jfm_0507_05_1','jfm_0507_05_2','link_3'].every(name=>visible.includes(name))),motorBearingContext:build<=3?'hidden with motor assembly':'source motor-side assembly visible',pos5SourceGeometry:'Original native POS5 body/ball reused once from composite source glTF; vendor duplicates removed',pos5RecoveredPresent:String(parts.filter(p=>p.name.startsWith('pos_5ec')).length===2)});
    }
    return f;
  }
  function worldSpringPoint(p){return p.axisPoint.clone().addScaledVector(p.axis,(p.band[0]+p.band[1])*.5).applyMatrix4(p.mesh.matrixWorld);}
  function focusBox(filter){const b=new THREE.Box3();for(const p of parts){if(!filter(p))continue;b.union(p.mesh.geometry.boundingBox.clone().applyMatrix4(p.mesh.matrixWorld));}return b;}
  function endState(pg,st){
    if(gait)gait.group.position.set(0,0,0);
    if(human)human.group.position.set(0,0,0);
    const s={coverInset:0,bgExamples:0,bgMotor:0,bgFocus:0,bgSurgery:1,bgWiggle:0,bgMuscle80:0,phase:fixedPhase(pg,st),explodeWeak:0,explodeStrong:0,spreadStrong:0,coilInspection:(pg===12&&st>=2)||pg===13||pg===16||pg===17?1:0,deform:0,section:0,transverse:0,stemCut:pg>=6&&pg<=10?1:0,nativeComparisonOpacity:chapter===3&&build===0?1:0,humanReveal:0,nativeCut:0,nativeCutLeft:0,nativeCutRight:0,muscles:0,motionProgress:1,chair:0,attach:0,leftInsertion:0,rightInsertion:0,rightReveal:0,clinicalReveal:0,clinicalCut:0,clinicalHighlight:0,clinicalExplode:0,deviceScale:1,devicePosition:new THREE.Vector3(),deviceRotation:new THREE.Quaternion(),opacities:parts.map(p=>opacityFor(p,pg,st)),target:new THREE.Vector3(),rotation:new THREE.Quaternion(),distance:1};
    if(chapter===3)s.stemCut=0;
    if(human)human.setState({motionProgress:1});
    if(pg===2&&human&&clinical){
      const left=human.getAttachment?.('left'),knee=left?.kneeAnchor||human.kneeAnchor,alignment=left?new THREE.Quaternion().setFromRotationMatrix(left.cadToWorldTibia):human.kneeRotation.clone();
      const aside=new THREE.Vector3(1.3,0,-1).normalize(),proximal=UP.clone().applyQuaternion(alignment).normalize();
      s.deviceScale=.22;s.deviceRotation.copy(alignment);
      s.devicePosition.copy(knee).addScaledVector(aside,.17).addScaledVector(proximal,.02).sub(new THREE.Vector3(...sourceFrame(0).jointCenters.j3).applyQuaternion(alignment).multiplyScalar(s.deviceScale));
      s.humanReveal=.78;s.muscles=0;s.clinicalHighlight=st===1?1:st===2?.3:0;s.clinicalCut=st>=2?1:0;s.clinicalReveal=st>=3?1:0;s.clinicalExplode=st===3?1:0;
    }
    // Reveal whole source parts; no open mesh-skin cross-section on springs.
    if(pg===11&&st>=1)s.opacities=parts.map(p=>isSpring(p.name)?1:p.name.startsWith('motor_shaft')?.22:0);
    if(pg===12){s.explodeWeak=st>=1?.75:0;s.explodeStrong=st>=1?.75:0;}
    if(pg===13){s.explodeWeak=.75;s.explodeStrong=.75;s.deform=[0,.42,.72,1][Math.min(st,3)];}
    if(pg===13&&st>=3)s.spreadStrong=1;
    if(pg===16){s.explodeWeak=.75;s.explodeStrong=.75;s.deform=[0,.5,.9][Math.min(st,2)];}
    if(pg===17){s.explodeWeak=.75;s.explodeStrong=.75;s.deform=[.15,1,.08][Math.min(st,2)];}
    if((pg===18||pg===19||pg===28)&&human?.getAttachment){
      s.attach=1;s.humanReveal=pg===18?[.12,.38,.65,.82][Math.min(st,3)]:.64;s.muscles=pg===18?[0,.15,.35,.65][Math.min(st,3)]:.23;
      s.leftInsertion=pg===28||pg===19&&st>=1?1:0;
      s.rightReveal=pg===28||pg===19&&st>=2?1:0;s.rightInsertion=pg===28||pg===19&&st>=3?1:0;
      s.nativeCutLeft=s.leftInsertion;s.nativeCutRight=s.rightInsertion;
      s.chair=pg===28?.6:pg===19&&st>=4?1:0;
      s.motionProgress=pg===19&&st===4?0:1;
      human.setState({motionProgress:s.motionProgress});
      const attachment=human.getAttachment('left'),pos=new THREE.Vector3(),quat=new THREE.Quaternion(),scale=new THREE.Vector3();attachment.cadToWorldTibia.decompose(pos,quat,scale);
      s.devicePosition.copy(pos).addScaledVector(outsideOffset('left'),1-s.leftInsertion);s.deviceRotation.copy(quat);
    }
    pose(s);
    let height,direction=new THREE.Vector3(.65,.18,.77),up=UP.clone();
    if(pg===2&&human&&clinical){s.target.copy(human.kneeAnchor).add(new THREE.Vector3(0,-.015,0));height=[.38,.33,.31,.36,.27][Math.min(st,4)];direction.set(1.3,.17,-.4);}
    else if(pg<=4){const b=focusBox(p=>!p.name.startsWith('femur_medium')&&!p.name.startsWith('tibia_medium'));s.target.copy(b.getCenter(new THREE.Vector3()));height=[.43,.48,.40,.35][pg-1]||.4;direction.set(.75,.15,.8);}
    else if(pg===5){s.target.set(0,.07,.012);height=.23;direction.set(.75,.2,.8);}
    else if(pg===6){s.target.set(0,.055,.012);height=st>=1?.14:.19;direction.set(-.8,.17,.6);}
    else if(pg===7||pg===8){const f=sourceFrame(s.phase),a=new THREE.Vector3(...f.jointCenters.j3),b=new THREE.Vector3(...f.jointCenters.j4);s.target.copy(a).lerp(b,.45);s.target.y-=.012;height=pg===8&&st>=2?.115:.135;direction.set(-1,.12,.2);if(pg===8&&st>=2){s.target.copy(new THREE.Vector3(...f.jointCenters.pivot)).lerp(new THREE.Vector3(...f.jointCenters.j3),.5);direction.set(-.12,1,.16);up.set(0,0,-1);}}
    else if(pg===9||pg===10){const f=sourceFrame(s.phase);s.target.set(...f.jointCenters.j3);s.target.lerp(worldSpringPoint(weak),.52);height=.15;direction.set(-.9,.28,.55);}
    else if((pg===18||pg===19||pg===28)&&human){
      const wide=pg===18||pg===28||st>=4,bounds=wide?(human.getMotionBounds?.()||human.getBounds()):human.getBounds(),size=bounds.getSize(new THREE.Vector3());
      const left=human.getAttachment?.('left').kneeAnchor||human.kneeAnchor,right=human.getAttachment?.('right').kneeAnchor||left;
      s.target.copy(wide?bounds.getCenter(new THREE.Vector3()):left.clone().lerp(right,.5).add(new THREE.Vector3(.015,.04,0)));
      height=wide?Math.max(1.12,size.y*1.13):.66;direction.set(1.4,.12,wide?(pg===18?.15:1.05):pg===19&&st<=1?-.45:.25);
    }
    else{
      const a=worldSpringPoint(weak),b=worldSpringPoint(strong),axis=weak.axis.clone().transformDirection(weak.mesh.matrixWorld),normal=weak.normal.clone().transformDirection(weak.mesh.matrixWorld);
      s.target.copy(a).lerp(b,.5);height=pg===11?(st>=2?.083:.13):pg===12?(st>=2?.07:.105):.062;
      direction.copy(normal).multiplyScalar(.8).addScaledVector(axis,-.42).normalize();
      if(pg===12&&st>=2){s.target.copy(a);direction.copy(axis);up.crossVectors(axis,normal).normalize();height=.034;}
      if(pg===13||pg===16||pg===17){s.target.copy(a);direction.copy(axis);up.crossVectors(axis,normal).normalize();height=.034;}
      if(pg===13&&st>=3){s.target.copy(a).lerp(b,.5);direction.copy(axis);up.crossVectors(axis,normal).normalize();height=.042;}
    }
    if(chapter===3&&build===4){
      // Include the actual complete motor, not a cropped shaft end posing as
      // the actuator. Supporting bearings/gear meshes share their source pose.
      const box=focusBox(p=>DRIVE_ASSEMBLY.has(partKey(p.name))),size=box.getSize(new THREE.Vector3());s.target.copy(box.getCenter(new THREE.Vector3()));height=Math.max(.17,size.y*1.17,size.z*.85);direction.set(-.95,.18,.6);up.copy(UP);
    }
    if(chapter===3&&build===0){s.target.set(...trajectory.frames[0].jointCenters.j3);height=.19;direction.set(-1,.12,.2);up.copy(UP);}
    if(chapter===3&&(build===1||build===2)){
      // Look down the actual shared pin axis, not an oblique view through both
      // separated flanges. The CAD mates/part transforms remain untouched.
      const joint=restoredJointNodes.find(j=>j.name==='revolute_3');
      s.target.copy(joint.node.getWorldPosition(new THREE.Vector3()));
      direction.copy(joint.axis).transformDirection(joint.node.matrixWorld).normalize();
      height=.135;up.copy(UP);
    }
    // Preserve source geometry; the orthographic field follows these framing controls.
    s.distance=height/(2*Math.tan(THREE.MathUtils.degToRad(16)));
    const position=s.target.clone().add(direction.normalize().multiplyScalar(s.distance));
    s.rotation.setFromRotationMatrix(new THREE.Matrix4().lookAt(position,s.target,up));
    return s;
  }
  function warp(p,angle){
    if(Math.abs(p.lastAngle-angle)<1e-5)return;p.lastAngle=angle;
    const a=p.axis,o=p.axisPoint,position=p.geometry.attributes.position,base=p.positions;
    for(let i=0;i<position.count;i++){
      const n=i*3,x=base[n]-o.x,y=base[n+1]-o.y,z=base[n+2]-o.z,h=x*a.x+y*a.y+z*a.z;
      const rx=x-a.x*h,ry=y-a.y*h,rz=z-a.z*h,r=Math.hypot(rx,ry,rz);
      const radial=1-smooth(clamp((r-.0035)/(.0102-.0035)));
      const axial=smooth(clamp((h-(p.band[0]-.0004))/.0004))*smooth(clamp(((p.band[1]+.0004)-h)/.0004));
      const t=angle*radial*axial,c=Math.cos(t),sn=Math.sin(t);
      position.setXYZ(i,o.x+a.x*h+rx*c+(a.y*rz-a.z*ry)*sn,o.y+a.y*h+ry*c+(a.z*rx-a.x*rz)*sn,o.z+a.z*h+rz*c+(a.x*ry-a.y*rx)*sn);
    }
    position.needsUpdate=true;p.geometry.computeVertexNormals();
  }
  function setPlanes(s){
    const origin=worldSpringPoint(weak).lerp(worldSpringPoint(strong),.5);
    const normal=weak.normal.clone().transformDirection(weak.mesh.matrixWorld).normalize();
    // A longitudinal half-section contains the spring shaft axis. Start outside
    // the pack and sweep to the centre: actual clipping, not a hidden-shell swap.
    const offset=-.055*(1-smooth(s.section));
    plane.setFromNormalAndCoplanarPoint(normal,origin.clone().addScaledVector(normal,offset));
    renderer.clippingPlanes=[];if(s.stemCut>.5)renderer.clippingPlanes.push(stemPlane);
    for(const p of parts){
      let own=plane;
      if(isSpring(p.name)){
        const axis=p.axis.clone().transformDirection(p.mesh.matrixWorld).normalize(),n=normal.clone().lerp(axis,s.transverse).normalize();
        const center=origin.clone().lerp(worldSpringPoint(p),s.transverse).addScaledVector(n,offset);
        own=new THREE.Plane().setFromNormalAndCoplanarPoint(n,center);p.currentPlane=own;
      }
      for(const m of p.materials)m.clippingPlanes=s.section>.0001?[own]:[];
    }
    Object.assign(host.dataset,{section:s.section.toFixed(4),sectionPlane:s.section>.0001?[...plane.normal.toArray(),plane.constant].map(x=>Number(x.toFixed(6))).join(','):'none',sectionType:page>=11?'intact-source-top-view':'uncut',sectionStatus:'intact-source-geometry',springClippingPlanes:'0'});
  }
  function updateContours(){
    cutDimensions=null;
    if(live.section<.95){sectionLines.visible=false;if(page===12&&step>=2)deriveTopDimensions();return;}
    const segments=[],a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
    for(const p of[weak,strong]){
      p.cutSegments=[];
      if(p.opacity<.01||!p.mesh.visible)continue;
      const currentPlane=p.currentPlane||plane,pos=p.geometry.attributes.position,index=p.geometry.index,lp=currentPlane.clone().applyMatrix4(p.mesh.matrixWorld.clone().invert()),count=index?index.count:pos.count;
      for(let i=0;i<count;i+=3){const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j),vs=[a.fromBufferAttribute(pos,ids[0]).clone(),b.fromBufferAttribute(pos,ids[1]).clone(),c.fromBufferAttribute(pos,ids[2]).clone()],hit=[];
        for(let j=0;j<3;j++){const v=vs[j],w=vs[(j+1)%3],d=lp.distanceToPoint(v),e=lp.distanceToPoint(w);if(d*e<0)hit.push(v.clone().lerp(w,d/(d-e)));}
        if(hit.length===2){const pair=[];for(const v of hit){v.applyMatrix4(p.mesh.matrixWorld);pair.push(v.clone());v.addScaledVector(currentPlane.normal,.000012);segments.push(v.x,v.y,v.z);}p.cutSegments.push(pair);}
      }
    }
    sectionLines.geometry.dispose();sectionLines.geometry=new THREE.BufferGeometry();sectionLines.geometry.setAttribute('position',new THREE.Float32BufferAttribute(segments,3));sectionLines.visible=segments.length>0;host.dataset.cutContourSegments=String(segments.length/6);
    if(page===12&&step>=2)deriveCutDimensions();
  }
  function deriveCutDimensions(){
    const origin=worldSpringPoint(weak),axis=weak.axis.clone().transformDirection(weak.mesh.matrixWorld).normalize(),u=weak.normal.clone().transformDirection(weak.mesh.matrixWorld).normalize(),v=new THREE.Vector3().crossVectors(axis,u).normalize(),radii=[];
    // Intersect a radial ray with the actual triangle/section intersection edges.
    for(const [a,b]of weak.cutSegments||[]){const da=a.clone().sub(origin).dot(v),db=b.clone().sub(origin).dot(v);if(da*db>=0)continue;const p=a.clone().lerp(b,da/(da-db)),r=p.clone().sub(origin).dot(u);if(r>.003&&r<.0103)radii.push(r);}
    radii.sort((a,b)=>a-b);const rs=radii.filter((r,i)=>!i||r-radii[i-1]>.000008);
    const probeMaterial=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),probe=new THREE.Mesh(weak.geometry,probeMaterial);probe.matrixWorld.copy(weak.mesh.matrixWorld);probe.matrixAutoUpdate=false;
    const inside=r=>{const p=origin.clone().addScaledVector(u,r),ray=new THREE.Raycaster(p.clone().addScaledVector(axis,-.1),axis,0,.1-.000001);const hits=ray.intersectObject(probe,false).map(h=>h.distance).sort((a,b)=>a-b);return hits.filter((d,i)=>!i||d-hits[i-1]>.000008).length%2===1;};
    let width=null,gap=null;
    for(let i=0;i<rs.length-1;i++){if(rs[i]<.0042||rs[i+1]>.0099)continue;const pair=[rs[i],rs[i+1]];if(inside((pair[0]+pair[1])/2)){if(!width&&pair[1]-pair[0]<.0012)width=pair;}else if(!gap&&pair[1]-pair[0]<.0012)gap=pair;}
    probeMaterial.dispose();
    if(!width||!gap){
      // A ray can land on a tessellation seam or an exported open CAD face.
      // Keep the teaching labels, anchored to actual section vertices, but do
      // not present the symbolic directions as measured boundary-to-boundary
      // dimensions when the closed-solid test cannot establish that claim.
      const points=(weak.cutSegments||[]).flat(),radial=p=>p.clone().sub(origin).dot(u),side=p=>p.clone().sub(origin).dot(v);
      const candidates=points.filter(p=>{const r=p.clone().sub(origin).length();return r>.0045&&r<.0101;}).sort((a,b)=>Math.abs(side(a))-Math.abs(side(b))+Math.abs(radial(a)-.007)*.2-Math.abs(radial(b)-.007)*.2);
      if(candidates.length){
        const center=project(origin),nearest=(dx,dy)=>candidates.reduce((best,p)=>{const a=project(p),b=project(best);return Math.hypot(a[0]-center[0]-dx,a[1]-center[1]-dy)<Math.hypot(b[0]-center[0]-dx,b[1]-center[1]-dy)?p:best;},candidates[0]).clone();
        const surface=nearest(-60,-50),gapEdge=nearest(80,-20),depthEdge=nearest(35,70),gapRadius=gapEdge.clone().sub(origin).normalize();
        const across=candidates.filter(p=>{const d=p.clone().sub(gapEdge);return d.dot(gapRadius)>.0002&&d.length()<.0015;}).sort((a,b)=>a.distanceTo(gapEdge)-b.distanceTo(gapEdge))[0]||gapEdge;
        const gapPoint=gapEdge.clone().lerp(across,.5),depth=weak.band[1]-weak.band[0];
        cutDimensions={symbolic:true,a:[surface,surface.clone()],gap:[gapPoint,gapPoint.clone()],b:[depthEdge.clone().addScaledVector(axis,-depth/2),depthEdge.clone().addScaledVector(axis,depth/2)]};
        host.dataset.sectionDimensions='source-CAD-symbolic-dimension-directions';
      }else host.dataset.sectionDimensions='section-boundary-identification-unavailable';
      return;
    }
    const p=r=>origin.clone().addScaledVector(u,r),solid=p((width[0]+width[1])/2),depth=weak.band[1]-weak.band[0];
    cutDimensions={a:width.map(p),gap:gap.map(p),b:[solid.clone().addScaledVector(axis,-depth/2),solid.clone().addScaledVector(axis,depth/2)]};
    host.dataset.sectionDimensions='actual-source-cross-section-boundaries';
  }
  function deriveTopDimensions(){
    const origin=worldSpringPoint(weak),candidates=[],pos=weak.geometry.attributes.position;
    for(let i=0;i<pos.count;i++){const p=new THREE.Vector3().fromBufferAttribute(pos,i),delta=p.clone().sub(weak.axisPoint),h=delta.dot(weak.axis),r=delta.addScaledVector(weak.axis,-h).length();if(Math.abs(h-weak.band[1])<.00006&&r>.0043&&r<.0099)candidates.push(p.applyMatrix4(weak.mesh.matrixWorld));}
    if(!candidates.length){cutDimensions=null;return;}
    const center=project(origin),nearest=(dx,dy)=>candidates.reduce((best,p)=>{const a=project(p),b=project(best);return Math.hypot(a[0]-center[0]-dx,a[1]-center[1]-dy)<Math.hypot(b[0]-center[0]-dx,b[1]-center[1]-dy)?p:best;},candidates[0]);
    const a=nearest(-65,-45),gap=nearest(70,-25);cutDimensions={symbolic:true,top:true,a:[a,a],gap:[gap,gap]};host.dataset.sectionDimensions='source-CAD-top-view-symbolic-width-and-gap';
  }
  function applyState(s,renderNow=true){
    const bgRight=new THREE.Vector3(1,0,0).applyQuaternion(backgroundRotation());
    if(human)human.group.position.set(-4*(s.bgExamples||0),0,0);
    const surgery=chapter===2&&build===1?(s.bgSurgery??1):1;
    const rise=(a,b)=>smooth(clamp((surgery-a)/(b-a))),separation=chapter===2&&build===1?rise(.03,.14)*(1-rise(.89,1)):0;
    const clinicalReveal=chapter===2&&build===1?rise(.24,.29):s.clinicalReveal,clinicalCut=chapter===2&&build===1?rise(.14,.24):s.clinicalCut,insertion=chapter===2&&build===1?rise(.30,.46):1;
    const inspect=chapter===2&&build===1?rise(.48,.59)*(1-rise(.79,.88)):0;
    s.bgInspect=inspect;live=s;Object.assign(host.dataset,{attachmentActive:String(s.attach>.95),leftPlacement:s.leftInsertion.toFixed(4),rightPlacement:s.rightInsertion.toFixed(4),rightReveal:s.rightReveal.toFixed(4)});human?.setState({reveal:s.humanReveal,replace:s.nativeCut,replaceLeft:s.nativeCutLeft,replaceRight:s.nativeCutRight,muscles:s.muscles,motionProgress:s.motionProgress,chair:s.chair,focusLeft:s.bgFocus||0,anatomyFlexion:s.bgWiggle||0,anatomySeparation:separation,anatomyInspect:inspect,upperOpacity:1-inspect});const frame=pose(s);
    for(let i=0;i<parts.length;i++){const p=parts[i],opacity=clamp(s.opacities[i]);p.opacity=opacity;p.mesh.visible=opacity>.002;for(const m of p.materials){m.opacity=opacity;m.depthWrite=opacity>.7;}}
    const weakAngle=THREE.MathUtils.degToRad(12*clamp(s.deform/.65));
    const strongAngle=THREE.MathUtils.degToRad(4*(.2*s.deform+.8*clamp((s.deform-.35)/.65)));warp(weak,weakAngle);warp(strong,strongAngle);
    const inspection=s.coilInspection>.5;
    for(const p of[weak,strong])if(p.inspection!==inspection){p.inspection=inspection;p.geometry.setIndex(inspection?p.topIndices:p.fullIndices);p.geometry.computeVertexNormals();}
    clinical?.setState({reveal:clinicalReveal,cut:clinicalCut,highlight:s.clinicalHighlight,explode:s.clinicalExplode,separation,insertion,femoralInsertion:chapter===2&&build===1?rise(.30,.38):1,tibialInsertion:chapter===2&&build===1?rise(.38,.46):1,tibialReveal:chapter===2&&build===1?rise(.35,.39):1,upperOpacity:1-inspect});
    myo80?.setReveal(s.bgMuscle80||0);
    host.dataset.surgeryInsertTopView=inspect.toFixed(4);host.dataset.surgeryPhase=String(surgery);host.dataset.surgerySeparation=String(separation);host.dataset.backgroundMuscleModel=(s.bgMuscle80||0)>.99?'myoleg80: 80 source muscles; 40 left paths':'native22';
    if(myoExamples){myoExamples.setReveal((s.bgExamples||0)>.0001?1:0);myoExamples.group.position.set(4*(1-(s.bgExamples||0)),0,0);}
    conceptMotor.visible=(s.bgMotor||0)>.0001;
    if(human&&conceptMotor.visible){conceptMotor.position.copy(human.kneeAnchor).addScaledVector(bgRight,.17+.38*(1-s.bgMotor)).addScaledVector(UP,.03);// Motor's long source axis is +Y. Keep it upright in camera space and
      // expose its shaft/cap in a clean three-quarter view, independent of spring.
      conceptMotor.quaternion.copy(backgroundRotation()).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(.22,0,-.18)));conceptMotor.updateMatrixWorld(true);conceptEdges.forEach(e=>e.sync());}
    Object.assign(host.dataset,{backgroundScene:chapter===2?'persistent-anatomy-and-conventional-TKA':'inactive',backgroundExamples:myoExamples&&s.bgExamples>.99?'HMEDI / OpenExo / Dephy ExoBoot':'off',backgroundConceptMotor:String(conceptMotor.visible),backgroundFullPioneerVisible:String(chapter===2&&parts.some(p=>p.mesh.visible))});
    const viewRotation=s.rotation.clone(),viewTarget=s.target.clone();let viewDistance=s.distance;
    if(inspect>.001&&clinical){
      const a=human.getAttachment('left'),up=new THREE.Vector3(0,1,0).applyQuaternion(a.kneeRotation),front=new THREE.Vector3(1,0,0).applyQuaternion(a.kneeRotation),side=a.kneeAxis;
      const target=clinical.componentCenters.insert,direction=up.clone(),top=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(target.clone().add(direction),target,front));
      viewTarget.lerp(target,inspect);viewRotation.slerp(top,inspect);viewDistance=THREE.MathUtils.lerp(s.distance,.105/(2*Math.tan(THREE.MathUtils.degToRad(16))),inspect);
    }
    projectionHeight=2*viewDistance*Math.tan(THREE.MathUtils.degToRad(16));updateOrthographicProjection();
    camera.quaternion.copy(viewRotation);camera.position.copy(viewTarget).add(new THREE.Vector3(0,0,5).applyQuaternion(viewRotation));
    host.dataset.cameraProjection='orthographic';host.dataset.orthographicHeightMeters=projectionHeight.toFixed(6);
    inspectionLight.intensity=1.5*s.coilInspection;inspectionLight.position.copy(camera.position);inspectionLight.target.position.copy(s.target);host.dataset.springDisplay=inspection?'original coil face subset; carrier hidden; no generated caps':'complete original source mesh';host.dataset.rightVisible=String(rightAssembly.visible);
    setPlanes(s);
    for(const p of parts)p.edges.sync();for(const p of rightParts)p.edges.sync();
    if(nativeComparison){nativeComparison.setPhase(s.phase,{flexionRad:clipFlexion[Math.round(s.phase*(clipFlexion.length-1))]});nativeComparison.setOpacity(s.nativeComparisonOpacity||0);}
    const cover=parts.find(p=>p.name==='Slider_Cover');Object.assign(host.dataset,{renderStyle:'shaded-with-feature-edges',sliderCoverPresent:String(!!cover),sliderCoverVisible:String(!!cover?.mesh.visible),sliderCoverTriangles:String((cover?.mesh.geometry.index?.count||0)/3),nativeComparison:String((s.nativeComparisonOpacity||0)>.001),nativeComparisonOpacity:String(s.nativeComparisonOpacity||0),viewportContract:'fixed-left-64-percent-full-height'});
    Object.assign(host.dataset,{phase:s.phase.toFixed(5),inputDeg:frame.inputDeg.toFixed(3),pivotDeg:frame.pivotDeg.toFixed(3),cameraPosition:originString(camera.position),cameraTarget:originString(s.target),explodeWeak:s.explodeWeak.toFixed(4),explodeStrong:s.explodeStrong.toFixed(4),deformation:s.deform.toFixed(4),deformationStatus:s.deform>0?'source-CAD-distributed-warp-illustration':'undeformed-original-CAD',humanReveal:s.humanReveal.toFixed(4),nativeKneeCut:s.nativeCut.toFixed(4),nativeCutLeft:s.nativeCutLeft.toFixed(4),nativeCutRight:s.nativeCutRight.toFixed(4),motionProgress:s.motionProgress.toFixed(5),recordedTime:String(human?.sourceFrame),chairReveal:s.chair.toFixed(4),motionSource:'recorded unassisted native STS; illustrative source-CAD graft',implantPosition:originString(s.devicePosition),implantScale:String(s.deviceScale),implantRegistration:'source bone-frame placement; illustrative uncoupled graft',clinicalStep:String(page===2?step:-1),clinicalSource:'aqnazar/TKA-implant-design; Apache-2.0; actual conventional meshes',clinicalReveal:s.clinicalReveal.toFixed(4),clinicalCut:s.clinicalCut.toFixed(4),clinicalRegistration:'illustrative anatomical fit; not a surgical plan'});
    if(chapter){gait?.setState({opacity:s.gait||0,implantOpacity:1,anatomyOpacity:1,muscleOpacity:chapter===6||chapter===7?.58:.18});if(fea){fea.setOpacity(s.fea||0);if(s.fea>.001)fea.setAngle(s.feaAngle||0);}host.dataset.chapter=String(chapter);host.dataset.build=String(build);host.dataset.recordedGait=String(gait?.group.visible||false);host.dataset.feaVisible=String(fea?.group.visible||false);}
    const inset=s.coverInset||0,right=new THREE.Vector3(1,0,0).applyQuaternion(s.rotation);
    if(gait)gait.group.position.copy(right).multiplyScalar(-.42*inset);
    if(fea){fea.group.position.copy(s.target).addScaledVector(right,.68).multiplyScalar(inset);fea.group.scale.setScalar(1+34*inset);fea.group.quaternion.identity().slerp(s.rotation,inset);}
    if(renderNow)render();
  }
  const FIGURE_WIDTH=.64;
  overlay.style.width=`${FIGURE_WIDTH*100}%`;
  let outgoingOverlay=null;
  function project(p){const v=p.clone().project(camera);return[(v.x+1)*.5*1600,(1-v.y)*.5*540];}
  const projectNative=project;
  function partPoint(prefix){
    if(prefix==='clinical')return clinical?.componentCenters;
    if(prefix==='leftKnee'||prefix==='rightKnee')return human?.getAttachment?.(prefix==='leftKnee'?'left':'right').kneeAnchor;
    if(prefix==='leftOutside'||prefix==='rightOutside'){const side=prefix==='leftOutside'?'left':'right';return human.getAttachment(side).kneeAnchor.clone().addScaledVector(outsideOffset(side),1-(side==='left'?live.leftInsertion:live.rightInsertion));}
    if(prefix==='coilEdge'||prefix==='coilGap'){const pts=cutDimensions?.[prefix==='coilEdge'?'a':'gap'];return pts?pts[0].clone().lerp(pts[1],.5):worldSpringPoint(weak);}
    const p=parts.find(p=>p.name.startsWith(prefix));return p?p.mesh.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(p.mesh.matrixWorld):null;
  }
  function drawOverlay(){
    if(!live)return;
    if(chapter===3){const joint=restoredJointNodes.find(j=>j.name==='revolute_3'),origin=joint.node.getWorldPosition(new THREE.Vector3()),axis=joint.axis.clone().transformDirection(joint.node.matrixWorld),a=project(origin),b=project(origin.clone().addScaledVector(axis,.04));host.dataset.j3ProjectedAxisSpan=Math.hypot(a[0]-b[0],a[1]-b[1]).toFixed(5);host.dataset.mechanismView=build===1||build===2?'actual-J3-axis-aligned':'source-perspective';}
    const diagramOnly=chapter===4&&build<=1||chapter===5||chapter===7;overlay.setAttribute('viewBox',diagramOnly?'0 0 720 500':'0 0 1600 540');overlay.setAttribute('preserveAspectRatio',diagramOnly?'xMidYMid meet':'none');
    const conceptPoints=conceptMotor.visible&&clinical?{joint:clinical.componentCenters.insert,motor:conceptMotor.position.clone()}:null;
    const context={myoExamples,conceptPoints,page,step,live,compact:!!chapter,frame:sourceFrame(live.phase),project,point:a=>new THREE.Vector3(...a),partPoint,springPoint:n=>worldSpringPoint(n==='weak'?weak:strong),history:sourceFrame,nativeLandmarks:nativeComparison?.getLandmarks(),projectNative};
    overlay.innerHTML=chapter?buildChapterOverlay({...context,chapter,build,fea,gait,human,legacy:()=>buildVisualExplanation(context)}):buildVisualExplanation(context);
    // Preserve the academic font proportions while projected geometry fills the host.
    const textAspect=(host.clientHeight/540)/(host.clientWidth*FIGURE_WIDTH/1600);for(const t of diagramOnly?[]:overlay.querySelectorAll('text')){const y=Number(t.getAttribute('y'));t.setAttribute('transform',`translate(0 ${y}) scale(1 ${1/textAspect}) translate(0 ${-y})`);}
  }
  function render(){
    if(disposed||host.clientWidth<2||host.clientHeight<2)return;const w=host.clientWidth,H=host.clientHeight;
    renderer.setScissorTest(false);renderer.setViewport(0,0,w,H);renderer.clear();
    renderer.setViewport(0,0,w*FIGURE_WIDTH,H);renderer.setScissor(0,0,w*FIGURE_WIDTH,H);renderer.setScissorTest(true);renderer.render(scene,camera);
    renderer.setScissorTest(false);drawOverlay();
  }
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(w<2||h<2)return;renderer.setSize(w,h,false);camera.aspect=w*FIGURE_WIDTH/h;updateOrthographicProjection();if(live)render();}
  function interpolate(a,b,u){const s={...b,target:a.target.clone().lerp(b.target,u),rotation:a.rotation.clone().slerp(b.rotation,u),devicePosition:a.devicePosition.clone().lerp(b.devicePosition,u),deviceRotation:a.deviceRotation.clone().slerp(b.deviceRotation,u),opacities:a.opacities.map((v,i)=>THREE.MathUtils.lerp(v,b.opacities[i],u))};for(const k of['phase','explodeWeak','explodeStrong','spreadStrong','coilInspection','deform','section','transverse','stemCut','distance','nativeComparisonOpacity','humanReveal','nativeCut','nativeCutLeft','nativeCutRight','muscles','motionProgress','chair','attach','leftInsertion','rightInsertion','rightReveal','clinicalReveal','clinicalCut','clinicalHighlight','clinicalExplode','deviceScale','gait','fea','feaAngle','coverInset','bgExamples','bgMotor','bgFocus','bgSurgery','bgWiggle','bgMuscle80'])s[k]=THREE.MathUtils.lerp(a[k]??0,b[k]??0,u);
    if(chapter===2&&build===1)s.bgSurgery=u<.5?Math.cbrt(u/4):1-Math.cbrt((1-u)/4);
    // Pull back before introducing full human–device models; retract them before
    // approaching the knee again. This prevents oversized passing bodies.
    if(chapter===2&&(build===3||build===4)){
      const cameraU=ease(clamp(build===3?u/.55:(u-.45)/.55));
      s.target.copy(a.target).lerp(b.target,cameraU);s.rotation.copy(a.rotation).slerp(b.rotation,cameraU);s.distance=THREE.MathUtils.lerp(a.distance,b.distance,cameraU);
      s.bgExamples=THREE.MathUtils.lerp(a.bgExamples||0,b.bgExamples||0,ease(clamp(build===3?(u-.55)/.45:u/.45)));
      if(build===4)s.bgMotor=THREE.MathUtils.lerp(a.bgMotor||0,b.bgMotor||0,ease(clamp((u-.65)/.35)));
    }
    return s;}
  function pause(){outgoingOverlay?.remove();outgoingOverlay=null;overlay.style.opacity='1';if(raf)cancelAnimationFrame(raf);raf=0;transition=null;last=0;suspended=true;host.dataset.animation='idle';}
  function tick(now){
    if(disposed||suspended)return;const dt=last?Math.min(.08,(now-last)/1000):0;last=now;host.dataset.scenePlaybackRate=String(getMotionRate());
    if(transition){transition.elapsed+=dt*getMotionRate();const u=clamp(transition.elapsed/transition.duration);sectionLines.visible=false;applyState(interpolate(transition.from,transition.to,ease(u)),false);host.dataset.transitionProgress=u.toFixed(4);overlay.style.opacity=chapter===2?'1':String(ease(clamp((u-.32)/.68)));if(outgoingOverlay)outgoingOverlay.style.opacity=String(1-ease(clamp(u/.25)));if(u>=1){outgoingOverlay?.remove();outgoingOverlay=null;}if(u>=1){transition=null;host.dataset.animation='idle';updateContours();}}
    if(chapter&&gait&&live?.gait>.001&&autoplayAllowed()){gaitClock+=dt;const phase=(gaitClock/(gait.durationSeconds||1.12))%1;gait.setProgress(phase);host.dataset.gaitPhase=phase.toFixed(5);host.dataset.gaitSourceTime=String(gait.group.userData.sourceTime);}
    if(chapter===1&&fea&&live?.coverInset>.001){
      const phase=(gaitClock/(gait?.durationSeconds||1.12))%1,angle=55*(1-Math.cos(2*Math.PI*phase)),springFrame=fea.setAngle(angle);
      Object.assign(host.dataset,{coverSpringPhase:phase.toFixed(5),coverSpringAngleDeg:angle.toFixed(3),coverSpringFrameIndex:String(springFrame.frameIndex),coverSpringActualAngleDeg:String(springFrame.actualAngleDeg??0),coverSpringReplay:'Stored loading frames forward/reverse, timed visually to gait; not computed gait response'});
    }
    if(chapter===2&&build===0&&autoplayAllowed()){
      backgroundClock+=dt*getMotionRate();const t=clamp(backgroundClock/5.4),wiggle=t<1?Math.sin(t*6*Math.PI)*.15*Math.sin(Math.PI*t):0;
      applyState({...live,bgWiggle:wiggle,clinicalHighlight:t<1?.70+.30*Math.abs(Math.sin(t*6*Math.PI)):.85},false);
    }
    if(chapter===2&&build===3&&myoExamples&&autoplayAllowed())myoExamples.setProgress((now/3500)%1);
    render();
    if(transition||chapter&&live?.gait>.001&&autoplayAllowed()||chapter===2&&(build===3||build===0&&backgroundClock<5.4)&&autoplayAllowed())raf=requestAnimationFrame(tick);else{raf=0;last=0;}
  }
  function setStory(nextPage,nextStep=0,animate=true){
    if(![1,2,3,4,5,6,7,8,9,10,11,12,13,16,17,18,19,28].includes(Number(nextPage))){pause();return;}
    pause();suspended=false;page=Number(nextPage);step=Math.max(0,Number(nextStep)||0);camera.aspect=host.clientWidth*FIGURE_WIDTH/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();
    const from=live?cloneState(live):null,to=endState(page,step);
    Object.assign(host.dataset,{page:String(page),step:String(step),sourceModel:'same-aakj-v3-glb',continuity:'one-scene-one-renderer',cameraStartsFrom:'current-interpolated-state'});
    if(from&&initialized&&animate&&!reduced()){
      applyState(from,false);sectionLines.visible=false;transition={from,to,elapsed:0,duration:page===19&&step===5?7.2:3.1};last=0;host.dataset.animation='running';host.dataset.transitionProgress='0';render();raf=requestAnimationFrame(tick);
    }else{applyState(to,false);updateContours();resize();host.dataset.transitionProgress='1';}
    initialized=true;
  }
  const mapping={1:[[28,0]],2:[[18,0],[2,4],[18,2],[18,3],[1,0]],3:[[7,0],[7,3],[8,1],[8,4],[9,3],[11,0]],4:[[11,0],[12,1],[13,3],[13,3],[12,2],[12,2],[12,2]],5:[[16,0],[16,1],[16,2]],6:[[18,0],[18,3],[9,3],[18,3]],7:[[18,3],[18,3],[18,3],[18,3]],8:[[28,0],[28,2]]};
  async function setChapter(nextChapter,nextBuild=0,animate=true){
    clearTimeout(myoPrefetchTimer);
    const requestToken=++chapterToken,c=Number(nextChapter),b=Math.max(0,Math.min(mapping[c].length-1,Number(nextBuild)||0));
    if(c===1||c===4&&b===5){status.hidden=false;status.textContent='Preparing solved spring fields…';await ensureFEA();status.hidden=true;if(requestToken!==chapterToken)return;}
    if(c===2&&b===2){status.hidden=false;status.textContent='Preparing MyoLeg 80-muscle anatomy…';await ensureMyo80();status.hidden=true;if(requestToken!==chapterToken)return;}
    if(c===2&&b===3){status.hidden=false;status.textContent='Preparing three MyoAssist wearable examples…';await ensureMyoExamples();status.hidden=true;if(requestToken!==chapterToken)return;}
    const previous=live?cloneState(live):null,oldOverlay=initialized&&animate&&!reduced()&&c!==2?overlay.cloneNode(true):null;pause();if(oldOverlay){outgoingOverlay=oldOverlay;oldOverlay.removeAttribute('id');host.append(oldOverlay);} suspended=false;chapter=c;build=b;[page,step]=mapping[c][b];const to=endState(page,step);to.gait=0;to.fea=0;to.feaAngle=0;
    if(c===1||c===8||c===6&&b!==2||c===7){
      to.gait=gait?1:0;to.humanReveal=gait?0:.75;to.muscles=0;to.chair=0;to.opacities=parts.map(()=>gait?0:1);to.rightReveal=0;to.attach=0;to.clinicalReveal=0;to.clinicalCut=0;
      const bounds=gait?.getBounds()||human.getMotionBounds(),center=bounds.getCenter(new THREE.Vector3()),height=Math.max(1.72,bounds.getSize(new THREE.Vector3()).y*1.05);to.target.copy(center);to.distance=height/(2*Math.tan(THREE.MathUtils.degToRad(16)));const direction=new THREE.Vector3(1.3,.16,1).normalize();to.rotation.setFromRotationMatrix(new THREE.Matrix4().lookAt(center.clone().addScaledVector(direction,to.distance),center,UP));
    }
    if(c===1){to.coverInset=1;to.fea=1;to.feaAngle=0;}
    if(c===2&&b===0){to.opacities=parts.map(()=>0);to.humanReveal=.8;to.muscles=.25;to.chair=0;to.rightReveal=0;to.clinicalHighlight=.8;}
    if(c===2&&(b===2||b===3)){to.opacities=parts.map(()=>0);to.humanReveal=.85;to.muscles=.85;to.chair=0;to.rightReveal=0;to.clinicalReveal=0;to.clinicalCut=0;}
    if(c===3&&b===0){to.opacities=parts.map(()=>0);to.humanReveal=0;to.rightReveal=0;to.clinicalReveal=0;to.clinicalCut=0;}
    if(c===4&&b===2)to.deform=.25;
    if(c===4&&b===3)to.deform=.88;
    if(c===4&&(b===2||b===3))to.distance*=1.18;
    if(c===4&&b>=5){to.opacities=parts.map(()=>0);to.rightReveal=0;to.humanReveal=0;to.fea=b===5?1:0;to.feaAngle=110;to.section=0;to.stemCut=0;to.target.set(0,0,0);to.distance=.037/(2*Math.tan(THREE.MathUtils.degToRad(16)));to.rotation.set(0,0,0,1);}
    if(c===5&&b===2)to.deform=.12;
    if(c===6&&b===2){to.humanReveal=0;to.rightReveal=0;}
    if(c===4&&b<=1||c===5){to.opacities=parts.map(()=>0);to.nativeComparisonOpacity=0;to.humanReveal=0;to.rightReveal=0;to.clinicalReveal=0;}
    if(c===7){to.gait=0;to.opacities=parts.map(()=>0);to.humanReveal=0;to.rightReveal=0;to.clinicalReveal=0;}
    if(c===2){backgroundState(b,to);backgroundClock=0;if(b===1&&previous&&animate)previous.bgSurgery=0;}
    camera.aspect=host.clientWidth*FIGURE_WIDTH/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();
    Object.assign(host.dataset,{chapter:String(c),build:String(b),page:String(c),storyScene:String(page),storyStep:String(step),continuity:'one-scene-one-renderer',cameraStartsFrom:'current-interpolated-state',sourceModel:'persistent-original-CAD-with-corrected-subtree-ownership-and-recorded-gait'});
    if(previous&&initialized&&animate&&!reduced()){
      transition={from:previous,to,elapsed:0,duration:c===2?(b===1?10.2:b===3||b===4?1.55:1.3):c===4&&b===5?4.8:2.2};last=performance.now();host.dataset.animation='running';host.dataset.transitionProgress='0';applyState(previous,false);raf=requestAnimationFrame(tick);
    }else{applyState(to,false);host.dataset.animation='idle';host.dataset.transitionProgress='1';resize();if((to.gait>.001||c===2&&(b===3||b===0))&&autoplayAllowed())raf=requestAnimationFrame(tick);}
    initialized=true;
    if(c===2&&b===2)myoPrefetchTimer=setTimeout(()=>{if(!disposed&&chapter===2&&build===2)ensureMyoExamples().catch(error=>console.warn('Wearable examples will retry on entry',error));},1400);
  }
  const observer=new ResizeObserver(resize);observer.observe(host);setStory(1,0,false);
  return{ready:true,setStory,setChapter,resize,pause,warmSources:ensureFEA,dispose(){disposed=true;clearTimeout(myoPrefetchTimer);pause();observer.disconnect();overlay.remove();status.remove();renderer.dispose();env.dispose();clinical?.dispose();myo80?.dispose();nativeComparison?.dispose();gait?.dispose();fea?.dispose();myoExamples?.dispose();conceptEdges.forEach(e=>e.dispose());conceptMaterials.forEach(m=>m.dispose());scene.remove(conceptMotor);human?.dispose();for(const p of parts){p.edges?.dispose();p.geometry?.dispose();p.materials.forEach(m=>m.dispose());}for(const p of rightParts){p.edges?.dispose();p.materials.forEach(m=>m.dispose());}sectionLines.geometry.dispose();sectionLines.material.dispose();renderer.domElement.remove();}};
}
