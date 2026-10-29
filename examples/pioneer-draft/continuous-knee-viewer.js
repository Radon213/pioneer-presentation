import {sampleSpringExplanationMotion} from './spring-explanation-motion.js?v=revision-20261029-47';
import {applyOppositeSpringFace,createSpringFaceAccents} from './spring-face-accent.js?v=revision-20261029-47';
import {sampleBackgroundSurfaceSequence,BACKGROUND_SURFACE_DURATION,applyBackgroundSurfaceView,backgroundClinicalHighlight} from './background-sequence.js?v=revision-20261029-47';
import {sampleSpringWinding,applySpringWindingPose} from './spring-drive-winding.js?v=revision-20261029-47';
import {createCoverKneeFocus} from './cover-knee-focus.js?v=revision-20261029-47';
import {sampleSitStandCycle} from './control-sts-cycle.js?v=revision-20261029-47';
import {createControlExplanationPanel} from './control-explanation-panel.js?v=revision-20261029-47';
import {createSpringExplanationPanel} from './spring-explanation-panel.js?v=revision-20261029-47';
import {addFemoralReference} from './hardware-reference.js?v=revision-20261029-47';
import {getMotionRate} from './motion-clock.js?v=revision-20261029-47';
import * as THREE from 'three';
import {GLTFLoader} from '../pioneer-interactive/vendor/GLTFLoader.js';
import {DRACOLoader} from '../pioneer-interactive/vendor/DRACOLoader.js';
import {RoomEnvironment} from '../pioneer-interactive/vendor/RoomEnvironment.js';
import {createContinuousHumanLayer} from './continuous-human-layer.js?v=revision-20261029-47';
import {createClinicalKneeLayer} from './clinical-knee-layer.js?v=revision-20261029-47';
import {createShadedEdges} from './shaded-edges.js?v=revision-20261029-47';
import {createNativeKneeComparison} from './native-knee-comparison.js?v=revision-20261029-47';
import {buildVisualExplanation} from './visual-explanations.js?v=revision-20261029-47';
import {buildChapterOverlay} from './chapter-overlays.js?v=revision-20261029-47';
import {createGaitChapterLayer} from './gait-chapter-layer.js?v=revision-20261029-47';
import {createSpringFEALayer} from './spring-fea-layer.js?v=revision-20261029-47';
import {loadJSONWithProgress,loadBinaryWithProgress,reportLoadStage} from './asset-loading.js?v=revision-20261029-47';

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
const HARDWARE_HIGHLIGHTS=new Set(['peek_bushing','pos_5ecbody__pos_5ecbody__1_','pos_5ecball__pos_5ecball__1_','helical_1m_21t']);
const isDriveAncillary=k=>/shcs|washer|^o_ring_|^lmsbm|^sspsr|^jfm_|^jtm_|^jsm_|^mta|^slpt/.test(k)||['fem_4_7','part_49'].includes(k);
// Keep complete source joint assemblies together. J3's shaft is carried by
// Link_3 and paired JFM bushings; the cam follower includes its real housing,
// inserts and JTM washers. LMSBM6 belongs to the motor-side assembly and must
// not appear as an unsupported ring during the linkage explanation.
const MECHANISM_CORE=new Set(['link_1','link_3','linkage_base','tibial_base','joint3_shaft','slpt6_25__1_','pos_5ecbody__pos_5ecbody__1_','pos_5ecball__pos_5ecball__1_','jfm_0507_05_1','jfm_0507_05_2','peek_bushing','body_c_cfs2_4_5__cut_extrude1','e_lbbh6l__1_','bearing_holder','insert_left','insert_right','insert_middle','jtm_0512_010','jtm_0512_010_1','guide1_e_crvs1020__mirror1_2','mta05_13_h_zz_dbs','plate','4mm_m3_shcs','4mm_m3_shcs_1','4mm_m4_shcs','12mm_m5_shcs','12mm_m5_shcs_1']);
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
    (async()=>{const loader=new GLTFLoader().setDRACOLoader(draco);let result;if(typeof DecompressionStream==='function'){const buffer=await loadBinaryWithProgress(new URL('aakj-v3-native-rebound.glb.gz?v=hardware-ownership-46',ASSETS),{key:'cad-model',label:'Original knee CAD',expectedBytes:8657013});reportLoadStage('cad-model','parse',{label:'Original knee CAD',phase:'parse'});result=await loader.parseAsync(buffer,ASSETS.href);cadLoadedBytes=8657013;}else{result=await loader.loadAsync(new URL('aakj-v3-native-rebound.glb?v=hardware-ownership-46',ASSETS).href);cadLoadedBytes=10724728;}reportLoadStage('cad-model','ready',{label:'Original knee CAD',phase:'ready',state:'complete',ratio:1,loadedBytes:cadLoadedBytes,totalBytes:cadLoadedBytes});return result;})(),
    loadJSONWithProgress(new URL('model-meta-native-rebound.json?v=hardware-ownership-46',ASSETS),{key:'cad-metadata',label:'CAD source metadata'}),
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
  const springFaceAccents=createSpringFaceAccents([weak,strong]);
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
  let nativeComparison=null;try{if(human)nativeComparison=await createNativeKneeComparison(scene,{human,clipRadius:.10});}catch(e){console.warn('Native knee comparison unavailable',e);}
  if(nativeComparison)nativeComparison.group.visible=false;
  if(nativeComparison)nativeComparison.group.position.set(...trajectory.frames[0].jointCenters.j3);
  const materials=parts.flatMap(p=>p.materials),mismatches=materials.filter(m=>{const s=sourceMaterials.get(m.name),c=s?.baseColorFactor||[1,1,1,1];return!s||Math.max(...[m.color.r,m.color.g,m.color.b].map((v,i)=>Math.abs(v-c[i])))>1e-6||Math.abs(m.metalness-(s.metallicFactor??1))>1e-6||Math.abs(m.roughness-(s.roughnessFactor??1))>1e-6;});
  Object.assign(host.dataset,{materialSource:'original-cad-native-subtrees-correctly-owned',materialMismatches:String(mismatches.length),meshCount:String(parts.length),restoredJointCount:String(restoredJointNodes.length),rendererCount:'1',modelCount:'2',leftSourceInstance:model.uuid,rightMirrorInstance:rightAssembly.uuid,rightMirror:'source-registration-affine-reflection; no additional mirror',attachmentSource:'assets/bilateral-sts-attachments.json',ready:'true'});host.querySelectorAll('.scene-poster,.scene-status').forEach(el=>el.hidden=true);

  const overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');overlay.setAttribute('viewBox','0 0 1600 540');overlay.setAttribute('preserveAspectRatio','none');overlay.setAttribute('aria-hidden','true');
  overlay.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;font-family:inherit;';host.append(overlay);
  const sectionLines=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:C.accent,transparent:true,opacity:.43,depthTest:false}));sectionLines.renderOrder=15;scene.add(sectionLines);
  let live=null,raf=0,transition=null,last=0,initialized=false,disposed=false,page=1,step=0,cutDimensions=null,chapter=0,build=0,gaitClock=0,controlClock=0,controlCycle=null,springClock=0,hardwareClock=0,hardwareAnnotationClock=.35,hardwareStageClock=0,hardwareWideState=null,suspended=false;
  let gait=null,fea=null,chapterToken=0;status.hidden=false;status.textContent='Loading recorded bilateral gait…';
  try{gait=await createGaitChapterLayer(scene,{human});gait.setOpacity(0);host.dataset.gaitGeometryCount=String(gait.group.userData.geometryCount);host.dataset.gaitRestoredNativeBones=String(gait.group.userData.retainedNativeShaftCount);host.dataset.gaitVisualRecovery='6 original native POS5/SLPT subtrees rebound once to saved body poses';}catch(e){console.warn('Recorded gait unavailable',e);}
  status.hidden=true;let sts=null,stsPromise=null,walkingDiagnostic=null,walkingPromise=null,walking=null,walkingLayerPromise=null;
  const ensureSTS=()=>stsPromise??=import('./control-sts-layer.js?v=revision-20261029-47').then(m=>m.createControlSTSLayer(scene,{gait,human})).then(layer=>{sts=layer;sts.setOpacity(0);return layer;});
  const ensureWalkingDiagnostic=()=>walkingPromise??=loadJSONWithProgress(new URL('assets/control-walking-diagnostic.json?v=revision-20261029-47',import.meta.url),{key:'walking-diagnostic',label:'Recorded actuator-limit diagnostic'}).then(data=>walkingDiagnostic=data);
  const ensureWalking=()=>walkingLayerPromise??=import('./control-walking-layer.js?v=revision-20261029-47').then(m=>m.createControlWalkingLayer(scene,{gait,human})).then(layer=>{walking=layer;walking.setOpacity(0);return layer;});
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
  const ensureMyo80=()=>myo80Promise??=(import('./myoleg80-muscle-layer.js?v=revision-20261029-47').then(m=>m.createMyoLeg80MuscleLayer(scene,{human})).then(layer=>myo80=layer));
  let myoExamples=null,myoPromise=null,myoPrefetchTimer=0;
  const ensureMyoExamples=()=>myoPromise??=import('./myoassist-examples-layer.js?v=revision-20261029-47').then(m=>m.createMyoAssistExamplesLayer(scene)).then(layer=>{myoExamples=layer;layer.setReveal(0);return layer;}).catch(error=>{myoPromise=null;throw error;});
  function backgroundRotation(){const target=new THREE.Vector3(),direction=new THREE.Vector3(1.3,.14,-.4).normalize();return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(direction,target,UP));}
  function backgroundState(st,to){
    human.group.position.set(0,0,0);human.setState({motionProgress:1});
    const a=human.getAttachment('left'),knee=a.kneeAnchor,hip=a.hipAnchor,rotation=backgroundRotation();
    if(st===0){const up=hip.clone().sub(knee).normalize(),forward=new THREE.Vector3(1,0,0).applyQuaternion(a.kneeRotation),direction=a.kneeAxis.clone().negate().addScaledVector(forward,.16).addScaledVector(up,.03).normalize();rotation.setFromRotationMatrix(new THREE.Matrix4().lookAt(knee.clone().add(direction),knee,up));}
    const right=new THREE.Vector3(1,0,0).applyQuaternion(rotation);
    Object.assign(to,{phase:0,stemCut:0,section:0,attach:0,leftInsertion:0,rightInsertion:0,rightReveal:0,nativeCut:0,nativeCutLeft:0,nativeCutRight:0,nativeComparisonOpacity:0,humanReveal:1,muscles:st===2?0:st===1?0:.12,motionProgress:1,chair:0,gait:0,fea:0,clinicalReveal:st>=1?1:0,clinicalCut:st>=1?1:0,clinicalHighlight:st===0?.9:0,clinicalExplode:0,bgExamples:st===3?1:0,bgMotor:st===4?1:0,bgChart:st===2?1:0,bgSurgery:st>=1?1:0,bgSurfaceInspect:0,bgSurfaceLabels:0,bgWiggle:0,bgMuscle80:st===2?1:0,bgFocus:st!==3?1:0,opacities:parts.map(()=>0)});
    to.rotation.copy(rotation);let height;
    if(st===0){human.getJointSurfaceLandmarks();to.target.copy(knee).addScaledVector(right,.035);height=.36;}
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
    for(const k of['femoralReference','femoralAxisZ'])r[k]=a[k].map((v,n)=>v+(b[k][n]-v)*t);
    r.jointCoordinates={};for(const k of Object.keys(a.jointCoordinates))r.jointCoordinates[k]=a.jointCoordinates[k]+(b.jointCoordinates[k]-a.jointCoordinates[k])*t;
    for(const k of['clipTime','inputDeg','h3mm','sliderMm','pivotDeg'])r[k]=a[k]+(b[k]-a[k])*t;return r;
  }
  function hardwareFrame(phase){
    const f=sourceFrame(phase);
    if(chapter!==3||build!==1)return f;
    // Isolate the sagittal four-bar for this step; the coupled axial degree of
    // freedom is introduced on the next step. Source recordings stay intact.
    const pivot=new THREE.Vector3(...f.jointCenters.pivot),undo=new THREE.Quaternion().setFromAxisAngle(UP,-THREE.MathUtils.degToRad(f.pivotDeg));
    const unpivot=p=>new THREE.Vector3(...p).sub(pivot).applyQuaternion(undo).add(pivot).toArray();
    for(const k of ['j1','j2','j3','j4'])f.jointCenters[k]=unpivot(f.jointCenters[k]);
    f.femoralReference=unpivot(f.femoralReference);f.femoralAxisZ=new THREE.Vector3(...f.femoralAxisZ).applyQuaternion(undo).toArray();
    f.jointCoordinates.revolute_1=trajectory.frames[0].jointCoordinates.revolute_1;
    f.jointCoordinates.cylindrical_1_1=trajectory.frames[0].jointCoordinates.cylindrical_1_1;
    f.pivotDeg=0;return f;
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
      if(build>0&&build<=4&&HARDWARE_HIGHLIGHTS.has(key))return 1;
      if(build<=3){
        if(build===1&&['condyle_right','condyle_left','femur_stem','femur_medium','fem_4_7','femur_ots_guide'].includes(key))return 0;
        if(/^guide2_/.test(key))return .5;
        if(/^guide1_/.test(key))return .13;
        if(/^cbstssr/.test(key))return .16;
        const fastener=/shcs|washer|^jfm_|^jtm_|^jsm_|^mta|^lmsbm|^slpt|^pos_5ec|^peek_bushing/.test(key);
        if(fastener)return .11;
        if(['linkage_base','tibial_base','bearing_holder','insert_left','insert_right','insert_middle'].includes(key))return build===2?.075:.17;
        if(MECHANISM_CORE.has(key))return 1;
        if(key==='condyle_right')return .10;
        if(key==='condyle_left'||key==='Slider_Cover')return .035;
        return 0;
      }
      if(build===4){if(key==='part_49')return 1;if(isDriveAncillary(key))return .06;if(DRIVE_ASSEMBLY.has(key))return 1;if(key==='motor_housing'||key==='condyle_right')return .13;if(key==='condyle_left')return .05;if(key==='Slider_Cover')return .24;return 0;}
      return isSpring(p.name)||['motor','motor_cable','motor_shaft','squre_splined_bevel_gear','12mm_m3_shcs','12mm_m3_shcs_1'].includes(key)?1:0;
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
    if(chapter===3)return autoplayAllowed()?(host.dataset.chapter==='3'&&live?live.phase:0):.68;
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
  const femoralReferenceDefinition=addFemoralReference(trajectory.frames);
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
    const f=chapter===3?hardwareFrame(effectivePhase):sourceFrame(effectivePhase);applyRestoredPose(f);
    model.updateMatrixWorld(true);
    for(const p of[weak,strong]){
      const sign=p===weak?1:-1,amount=p===weak?s.explodeWeak:s.explodeStrong;
      const axis=p.axis.clone().transformDirection(p.mesh.matrixWorld).normalize();
      const localAxis=axis.transformDirection(p.mesh.parent.matrixWorld.clone().invert());
      p.mesh.position.copy(p.basePosition).addScaledVector(localAxis,amount*.016*sign);
      if(p===strong&&s.spreadStrong){const sideways=p.normal.clone().transformDirection(p.mesh.matrixWorld).transformDirection(p.mesh.parent.matrixWorld.clone().invert());p.mesh.position.addScaledVector(sideways,s.spreadStrong*.033);}
      if(p===strong){const offset=p.mesh.position.clone().sub(p.basePosition).applyMatrix3(new THREE.Matrix3().setFromMatrix4(p.mesh.parent.matrixWorld));for(const bolt of parts.filter(part=>['12mm_m3_shcs','12mm_m3_shcs_1'].includes(partKey(part.name))))bolt.mesh.position.copy(bolt.basePosition).add(offset.clone().applyMatrix3(new THREE.Matrix3().setFromMatrix4(bolt.mesh.parent.matrixWorld.clone().invert())));}
    }
    if((s.driveExplode||0)>.00001){
      const centre=p=>p.mesh.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(p.mesh.matrixWorld);
      const motor=parts.find(p=>partKey(p.name)==='motor'),shaft=parts.find(p=>partKey(p.name)==='motor_shaft');
      // Withdraw the motor along its actual shaft axis. The springs and output
      // separate along the original R5 axis; no camera/screen-space scattering.
      const motorAxis=centre(motor).sub(centre(shaft)).normalize();
      const springAxis=weak.axis.clone().transformDirection(weak.mesh.matrixWorld).normalize();
      for(const p of parts){const k=partKey(p.name),offset=['motor','motor_cable','motor_shaft'].includes(k)?motorAxis.clone().multiplyScalar(.055):k==='squre_splined_bevel_gear'?springAxis.clone().multiplyScalar(.045):null;if(!offset)continue;
        offset.multiplyScalar(s.driveExplode).applyMatrix3(new THREE.Matrix3().setFromMatrix4(p.mesh.parent.matrixWorld.clone().invert()));p.mesh.position.add(offset);
      }
      host.dataset.explosionAxes='motor: source motor-to-shaft axis; spring/output: original R5 axis';
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
      const visible=parts.filter((p,i)=>s.opacities[i]>.002).map(p=>partKey(p.name));
      Object.assign(host.dataset,{mechanismPoseSource:'all 9 source joint coordinates; original native POS5/SLPT subtrees split from composite owners and correctly rebound',mechanismVisibleParts:visible.join(','),j3AssemblyComplete:String(['joint3_shaft','slpt6_25__1_','pos_5ecbody__pos_5ecbody__1_','pos_5ecball__pos_5ecball__1_','jfm_0507_05_1','jfm_0507_05_2','link_3'].every(name=>visible.includes(name))),motorBearingContext:build===5?'hidden for axial-drive explanation':build<=3?'translucent assembly context':'source motor-side assembly visible',pos5SourceGeometry:'Original native POS5 body/ball reused once from composite source glTF; vendor duplicates removed',pos5RecoveredPresent:String(parts.filter(p=>p.name.startsWith('pos_5ec')).length===2)});
    }
    return f;
  }
  function worldSpringPoint(p){return p.axisPoint.clone().addScaledVector(p.axis,(p.band[0]+p.band[1])*.5).applyMatrix4(p.mesh.matrixWorld);}
  function focusBox(filter){const b=new THREE.Box3();for(const p of parts){if(!filter(p))continue;b.union(p.mesh.geometry.boundingBox.clone().applyMatrix4(p.mesh.matrixWorld));}return b;}
  function endState(pg,st){
    if(gait)gait.group.position.set(0,0,0);
    if(human)human.group.position.set(0,0,0);
    const s={walkingReplay:0,controlReplay:0,springDock:0,flipStrong:0,nativeSpringTwist:0,coverInset:0,bgExamples:0,bgMotor:0,bgFocus:0,bgChart:0,bgSurgery:1,bgSurfaceInspect:0,bgSurfaceLabels:0,bgWiggle:0,bgMuscle80:0,phase:fixedPhase(pg,st),explodeWeak:0,explodeStrong:0,spreadStrong:0,driveExplode:chapter===3&&build===5?1:0,coilInspection:(pg===12&&st>=2)||pg===13||pg===16||pg===17?1:0,deform:0,section:0,transverse:0,stemCut:pg>=6&&pg<=10?1:0,nativeComparisonOpacity:chapter===3?(build===0?1:0):0,humanReveal:0,nativeCut:0,nativeCutLeft:0,nativeCutRight:0,muscles:0,motionProgress:1,chair:0,attach:0,leftInsertion:0,rightInsertion:0,rightReveal:0,clinicalReveal:0,clinicalCut:0,clinicalHighlight:0,clinicalExplode:0,deviceScale:1,devicePosition:new THREE.Vector3(),deviceRotation:new THREE.Quaternion(),opacities:parts.map(p=>opacityFor(p,pg,st)),target:new THREE.Vector3(),rotation:new THREE.Quaternion(),distance:1};
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
    if(chapter===4){
      // Keep the complete native assembly across the chapter. Never swap its
      // index buffer, clip its carrier or invent native deformation for a plot.
      s.springDock=build===5?0:1;s.phase=live&&['3','4'].includes(host.dataset.chapter)?live.phase:.25;
      s.flipStrong=[1,2,3].includes(build)?1:0;s.explodeWeak=[1,2,3].includes(build)?1.2:0;s.explodeStrong=[1,2,3].includes(build)?1.2:0;s.spreadStrong=[1,2].includes(build)?1.02:build===3?1.32:0;s.coilInspection=0;s.deform=0;s.section=0;s.transverse=0;s.stemCut=0;
      s.opacities=parts.map(p=>{
        const k=partKey(p.name);if(build>=5)return 0;
        if(build===4)return p===weak?1:0;
        if([1,2,3].includes(build))return isSpring(p.name)?1:0;
        return isSpring(p.name)||['12mm_m3_shcs','12mm_m3_shcs_1'].includes(k)||build===0&&['motor','motor_cable','motor_shaft','squre_splined_bevel_gear'].includes(k)?1:0;
      });if(build===0){s.phase=0;s.driveExplode=0;s.explodeWeak=0;s.explodeStrong=0;}

    }
    if(chapter===5){
      s.controlReplay=[1,2,3,6].includes(build)?1:0;s.walkingReplay=build>=7?1:0;
      s.springDock=(s.controlReplay||s.walkingReplay)?1:0;
      s.phase=live?.phase??.25;s.opacities=parts.map(()=>0);
      Object.assign(s,{explodeWeak:0,explodeStrong:0,spreadStrong:0,coilInspection:0,deform:0,section:0,transverse:0,stemCut:0,humanReveal:0,attach:0,rightReveal:0,clinicalReveal:0,clinicalCut:0,nativeComparisonOpacity:0,muscles:0,chair:0});
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
    if(chapter===3){
      const f0=sourceFrame(0),centre=new THREE.Vector3(...f0.jointCenters.j3);
      if(build<=3){
        s.target.copy(centre).add(new THREE.Vector3(0,-.010,0));height=build===0?.27:.165;
        direction.set(-1,0,0);up.copy(UP);
        if(build===2)direction.set(-1,.52,.55);
        if(build===3){s.target.copy(new THREE.Vector3(...f0.jointCenters.pivot)).lerp(centre,.45);direction.set(-.05,1,.12);up.set(0,0,-1);height=.115;}
      }else{
        const box=focusBox(p=>build===4?DRIVE_ASSEMBLY.has(partKey(p.name)):isSpring(p.name)||['motor','motor_shaft','squre_splined_bevel_gear'].includes(partKey(p.name)));
        const size=box.getSize(new THREE.Vector3());s.target.copy(box.getCenter(new THREE.Vector3()));height=Math.max(build===5?.25:.20,size.y*1.28,size.z*1.05);direction.set(-.95,.20,.60);up.copy(UP);
      }
      if(build===5){s.explodeWeak=0;s.explodeStrong=0;s.coilInspection=0;const axis=weak.axis.clone().transformDirection(weak.mesh.matrixWorld),normal=weak.normal.clone().transformDirection(weak.mesh.matrixWorld);direction.copy(normal).multiplyScalar(.85).addScaledVector(axis,.35);up.copy(axis).negate();}
    }
    if(chapter===4){
      s.target.copy(worldSpringPoint(weak)).lerp(worldSpringPoint(strong),.5);
      const axis=weak.axis.clone().transformDirection(weak.mesh.matrixWorld),normal=weak.normal.clone().transformDirection(weak.mesh.matrixWorld);
      // Keep the shaft vertical on screen. Each semantic step has its own
      // camera / intact axial exploded assembly, with no geometry clipping.
      const views=[[1,-.35,.067],[.9,-.50,.067],[.55,-.85,.067],[1,-.23,.105],[.65,-.70,.088],[1,-.4,.067],[.85,-.5,.067]];
      const [side,axial,h]=views[build];direction.copy(normal).multiplyScalar(side).addScaledVector(axis,axial);up.copy(axis).negate();height=h;if([1,2,3,4].includes(build)){direction.copy(axis).negate().addScaledVector(normal,.06);up.copy(normal);direction.copy(axis).negate();up.copy(normal);height=build===4?.045:build===3?.110:.095;if(build===4)s.target.copy(worldSpringPoint(weak));}
    }
    if(chapter===4&&build===5){const axis=weak.axis.clone().transformDirection(weak.mesh.matrixWorld),normal=weak.normal.clone().transformDirection(weak.mesh.matrixWorld);direction.copy(axis).negate();up.copy(normal);s.target.copy(worldSpringPoint(weak));s.springDock=1;height=.045;}
    if(chapter===5){
      const replay=build>=7?walking:[1,2,3,6].includes(build)?sts:null;
      if(replay){const box=build===3&&sts.getPoseBounds?sts.getPoseBounds():replay.getBounds();s.target.copy(box.getCenter(new THREE.Vector3()));height=Math.max(1.85,box.getSize(new THREE.Vector3()).y*1.12);direction.set(1.15,.12,1);up.copy(UP);}
      else if(live){s.target.copy(live.target);direction.set(1,.12,1);height=1.9;}
    }
    // Preserve source geometry; the orthographic field follows these framing controls.
    s.distance=height/(2*Math.tan(THREE.MathUtils.degToRad(16)));
    const position=s.target.clone().add(direction.normalize().multiplyScalar(s.distance));
    s.rotation.setFromRotationMatrix(new THREE.Matrix4().lookAt(position,s.target,up));
    if(chapter===3&&build===0){
      const bounds=nativeComparison?.getBounds()?.clone()||new THREE.Box3();
      for(const f of trajectory.frames)bounds.expandByPoint(new THREE.Vector3(...f.femoralReference));
      s.target.copy(bounds.getCenter(new THREE.Vector3()));
      height=Math.max(.27,bounds.getSize(new THREE.Vector3()).length()*.94);s.distance=height/(2*Math.tan(THREE.MathUtils.degToRad(16)));
    }
    if(chapter===3&&build>=4){
      // Fit actual projected source meshes AFTER applying the final explosion
      // direction. A world-Y-only bound clips the tilted motor and low gears.
      const savedPhase=s.phase,inv=s.rotation.clone().invert(),bounds=new THREE.Box3();
      for(const phase of build===4?[0,.43,.86]:[savedPhase]){
        s.phase=phase;pose(s);
        for(let i=0;i<parts.length;i++)if(s.opacities[i]>.05){const p=parts[i],box=p.mesh.geometry.boundingBox;
          for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z])bounds.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(p.mesh.matrixWorld).applyQuaternion(inv));
        }
      }
      s.phase=savedPhase;pose(s);
      s.target.copy(bounds.getCenter(new THREE.Vector3()).applyQuaternion(s.rotation));
      const size=bounds.getSize(new THREE.Vector3()),aspect=host.clientWidth*FIGURE_WIDTH/Math.max(1,host.clientHeight);
      height=Math.max(size.y/.86,size.x/(aspect*.86));s.distance=height/(2*Math.tan(THREE.MathUtils.degToRad(16)));
    }
    if(chapter===3&&build===4){
      hardwareWideState={target:s.target.clone(),rotation:s.rotation.clone(),distance:s.distance};
      const gears=focusBox(p=>['helical_1m_21t','squre_splined_bevel_gear','part_49'].includes(partKey(p.name)));
      s.target.copy(gears.getCenter(new THREE.Vector3()));s.distance=.085/(2*Math.tan(THREE.MathUtils.degToRad(16)));
    }
    if(chapter===4&&build===0){
      const inv=s.rotation.clone().invert(),bounds=new THREE.Box3();
      for(let i=0;i<parts.length;i++)if(s.opacities[i]>.5){const p=parts[i],box=p.mesh.geometry.boundingBox;for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z])bounds.expandByPoint(new THREE.Vector3(x,y,z).applyMatrix4(p.mesh.matrixWorld).applyQuaternion(inv));}
      s.target.copy(bounds.getCenter(new THREE.Vector3()).applyQuaternion(s.rotation));const size=bounds.getSize(new THREE.Vector3()),aspect=host.clientWidth*FIGURE_WIDTH/Math.max(1,host.clientHeight);height=Math.max(size.y/.88,size.x/(aspect*.40));s.distance=height/(2*Math.tan(THREE.MathUtils.degToRad(16)));
    }
    if(chapter===5&&build===3&&sts?.getPoseBounds){
      // Fit the current recorded body inside the model lane. The camera
      // follows later poses instead of reducing the whole fall to a tiny view.
      const inv=s.rotation.clone().invert(),bounds=sts.getPoseBounds().applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(inv)),size=bounds.getSize(new THREE.Vector3()),aspect=host.clientWidth*FIGURE_WIDTH/Math.max(1,host.clientHeight);
      s.target.copy(bounds.getCenter(new THREE.Vector3()).applyQuaternion(s.rotation));
      height=Math.max(1.75,size.y/.88,size.x/(aspect*.40));s.distance=height/(2*Math.tan(THREE.MathUtils.degToRad(16)));
    }
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
    s.bgInspect=inspect;live=s;Object.assign(host.dataset,{attachmentActive:String(s.attach>.95),leftPlacement:s.leftInsertion.toFixed(4),rightPlacement:s.rightInsertion.toFixed(4),rightReveal:s.rightReveal.toFixed(4)});human?.setState({reveal:s.humanReveal,replace:s.nativeCut,replaceLeft:s.nativeCutLeft,replaceRight:s.nativeCutRight,muscles:s.muscles,motionProgress:s.motionProgress,chair:s.chair,focusLeft:s.bgFocus||0,anatomyFlexion:s.bgWiggle||0,anatomySeparation:separation,anatomyInspect:inspect,surfaceInspection:chapter===2?(s.bgSurfaceInspect||0):0,upperOpacity:(1-inspect)*(1-(chapter===2?(s.bgSurfaceInspect||0):0))});const frame=pose(s);
    for(let i=0;i<parts.length;i++){const p=parts[i],opacity=clamp(s.opacities[i]);p.opacity=opacity;p.mesh.visible=opacity>.002;for(const m of p.materials){m.opacity=opacity;m.depthWrite=opacity>.7;}}
    if(chapter===3&&build===4)host.dataset.driveAncillaryOpacities=JSON.stringify(Object.fromEntries(parts.filter(p=>isDriveAncillary(partKey(p.name))).map(p=>[partKey(p.name),p.opacity])));
    if(chapter===3)host.dataset.hardwareHighlightOpacities=JSON.stringify(Object.fromEntries(parts.filter(p=>HARDWARE_HIGHLIGHTS.has(partKey(p.name))).map(p=>[partKey(p.name),p.opacity])));
    const winding=chapter===4&&build===0?sampleSpringWinding(springClock):null;
    const springMotion=sampleSpringExplanationMotion(springClock,build),explaining=chapter===4&&[1,2,4].includes(build);
    const weakDegrees=winding?winding.weakDeg:explaining?(build===4?springMotion.weakDeflectionDeg:springMotion.lowDeflectionDeg):chapter===4&&build===5?(s.nativeSpringTwist||0):12*clamp(s.deform/.65);
    const weakAngle=THREE.MathUtils.degToRad(weakDegrees),strongAngle=THREE.MathUtils.degToRad(winding?winding.strongDeg:explaining&&build!==4?springMotion.highDeflectionDeg:4*(.2*s.deform+.8*clamp((s.deform-.35)/.65)));
    if(explaining)s.nativeSpringTwist=weakDegrees;
    warp(weak,weakAngle);warp(strong,strongAngle);
    if(explaining&&build!==4)applySpringWindingPose({THREE,parts,weak,model,sample:{weakBaseDeg:springMotion.highDeflectionDeg,inputDeg:springMotion.lowDeflectionDeg+springMotion.highDeflectionDeg}});
    if(winding){applySpringWindingPose({THREE,parts,weak,model,sample:winding});Object.assign(host.dataset,{springWindingInputDeg:String(winding.inputDeg),springWindingOutputDeg:'0',springWindingWeakDeg:String(winding.weakDeg),springWindingStrongDeg:String(winding.strongDeg),springWindingTorqueNormalized:String(winding.torqueFraction),springWindingClassification:winding.classification});}

    if(chapter===4&&s.flipStrong>.0001)applyOppositeSpringFace(strong,s.flipStrong);
    springFaceAccents.update({chapter,build,timeSec:springClock,reveal:transition?clamp(transition.elapsed/transition.duration):1,deformationAngle:weakAngle});
    const inspection=s.coilInspection>.5;
    for(const p of[weak,strong])if(p.inspection!==inspection){p.inspection=inspection;p.geometry.setIndex(inspection?p.topIndices:p.fullIndices);p.geometry.computeVertexNormals();}
    clinical?.setState({reveal:clinicalReveal,cut:clinicalCut,highlight:backgroundClinicalHighlight(chapter,build,s.clinicalHighlight,surgery),explode:s.clinicalExplode,separation,insertion,femoralInsertion:chapter===2&&build===1?rise(.30,.38):1,tibialInsertion:chapter===2&&build===1?rise(.38,.46):1,tibialReveal:chapter===2&&build===1?rise(.35,.39):1,upperOpacity:1-inspect});
    myo80?.setReveal(s.bgMuscle80||0);
    host.dataset.backgroundSurfaceInspection=String(s.bgSurfaceInspect||0);host.dataset.backgroundSurfaceLabels=String(s.bgSurfaceLabels||0);host.dataset.strengthChartProgress=String(chapter===2&&build===2?s.bgChart??1:0);host.dataset.surgeryInsertTopView=inspect.toFixed(4);host.dataset.surgeryPhase=String(surgery);host.dataset.surgerySeparation=String(separation);host.dataset.backgroundMuscleModel=(s.bgMuscle80||0)>.99?'myoleg80: 80 source muscles; 40 left paths':'native22';
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
    if(chapter===2&&build===0)viewDistance=applyBackgroundSurfaceView({human,live:s,viewRotation,viewTarget,viewDistance});
    const fieldHeight=2*viewDistance*Math.tan(THREE.MathUtils.degToRad(16));
    if((s.springDock||0)>.0001)viewTarget.addScaledVector(new THREE.Vector3(1,0,0).applyQuaternion(viewRotation),fieldHeight*camera.aspect*.28*s.springDock);
    projectionHeight=2*viewDistance*Math.tan(THREE.MathUtils.degToRad(16));updateOrthographicProjection();
    camera.quaternion.copy(viewRotation);camera.position.copy(viewTarget).add(new THREE.Vector3(0,0,5).applyQuaternion(viewRotation));
    host.dataset.cameraProjection='orthographic';host.dataset.orthographicHeightMeters=projectionHeight.toFixed(6);
    inspectionLight.intensity=1.5*s.coilInspection;inspectionLight.position.copy(camera.position);inspectionLight.target.position.copy(s.target);host.dataset.springDisplay=inspection?'original coil face subset; carrier hidden; no generated caps':'complete original source mesh';host.dataset.rightVisible=String(rightAssembly.visible);
    setPlanes(s);
    for(const p of parts)p.edges.sync();for(const p of rightParts)p.edges.sync();
    if(nativeComparison){
      const source=trajectory.frames[Math.round(s.phase*(trajectory.frames.length-1))],zero=trajectory.frames[0],conversion=new THREE.Matrix4().makeRotationX(-Math.PI/2),fromRows=rows=>new THREE.Matrix4().set(...rows.flat());
      const delta=conversion.clone().multiply(fromRows(source.transformsURDF.condyle_right)).multiply(fromRows(zero.transformsURDF.condyle_right).invert()).multiply(conversion.clone().invert());
      nativeComparison.setPhase(s.phase,{flexionRad:clipFlexion[Math.round(s.phase*(clipFlexion.length-1))],pivotRad:THREE.MathUtils.degToRad(frame.pivotDeg),rollbackM:.006*s.phase,worldRigidDelta:chapter===3&&build===0?delta:null});nativeComparison.setOpacity(s.nativeComparisonOpacity||0);
    }
    const sliderBearing=parts.find(p=>partKey(p.name)==='e_lbbh6l__1_');if(sliderBearing){const carrier=model.getObjectByName(THREE.PropertyBinding.sanitizeNodeName('e_lbbh6l__1_'));host.dataset.sliderBearingRelative=originString(sliderBearing.mesh.getWorldPosition(new THREE.Vector3()).applyMatrix4(carrier.matrixWorld.clone().invert()));host.dataset.sliderBearingOwner=sliderBearing.mesh.parent.name;}
    const cover=parts.find(p=>p.name==='Slider_Cover');Object.assign(host.dataset,{renderStyle:'shaded-with-feature-edges',sliderCoverPresent:String(!!cover),sliderCoverVisible:String(!!cover?.mesh.visible),sliderCoverTriangles:String((cover?.mesh.geometry.index?.count||0)/3),nativeComparison:String((s.nativeComparisonOpacity||0)>.001),nativeComparisonOpacity:String(s.nativeComparisonOpacity||0),viewportContract:'fixed-left-64-percent-full-height'});
    Object.assign(host.dataset,{phase:s.phase.toFixed(5),inputDeg:frame.inputDeg.toFixed(3),pivotDeg:frame.pivotDeg.toFixed(3),cameraPosition:originString(camera.position),cameraTarget:originString(s.target),driveExplode:String(s.driveExplode||0),hardwareClock:hardwareClock.toFixed(4),explodeWeak:s.explodeWeak.toFixed(4),explodeStrong:s.explodeStrong.toFixed(4),deformation:s.deform.toFixed(4),deformationStatus:s.deform>0?'source-CAD-distributed-warp-illustration':'undeformed-original-CAD',humanReveal:s.humanReveal.toFixed(4),nativeKneeCut:s.nativeCut.toFixed(4),nativeCutLeft:s.nativeCutLeft.toFixed(4),nativeCutRight:s.nativeCutRight.toFixed(4),motionProgress:s.motionProgress.toFixed(5),recordedTime:String(human?.sourceFrame),chairReveal:s.chair.toFixed(4),motionSource:'recorded unassisted native STS; illustrative source-CAD graft',implantPosition:originString(s.devicePosition),implantScale:String(s.deviceScale),implantRegistration:'source bone-frame placement; illustrative uncoupled graft',clinicalStep:String(page===2?step:-1),clinicalSource:'aqnazar/TKA-implant-design; Apache-2.0; actual conventional meshes',clinicalReveal:s.clinicalReveal.toFixed(4),clinicalCut:s.clinicalCut.toFixed(4),clinicalRegistration:'illustrative anatomical fit; not a surgical plan'});
    if(sts){sts.setOpacity(s.controlReplay||0);if(chapter===5&&build===1)sts.setProgress(0);}
    walking?.setOpacity(s.walkingReplay||0);
    if(chapter){gait?.setState({opacity:s.gait||0,implantOpacity:1,anatomyOpacity:1,muscleOpacity:chapter===6||chapter===7?.58:.18});if(fea){fea.setOpacity(s.fea||0);if(s.fea>.001)fea.setAngle(s.feaAngle||0);}host.dataset.chapter=String(chapter);host.dataset.build=String(build);host.dataset.recordedGait=String(gait?.group.visible||false);host.dataset.feaVisible=String(fea?.group.visible||false);}
    const inset=s.coverInset||0,right=new THREE.Vector3(1,0,0).applyQuaternion(s.rotation);
    if(gait)gait.group.position.copy(right).multiplyScalar(-.42*inset);
    if(fea){
      if(chapter===4){const sourceMesh=fea.group.children.find(child=>child.isMesh),size=sourceMesh.geometry.boundingBox.getSize(new THREE.Vector3()),scale=.0201/Math.max(size.x,size.y);fea.group.position.copy(worldSpringPoint(weak));fea.group.scale.setScalar(scale);fea.group.quaternion.copy(s.rotation);host.dataset.springFEAHandoff='registered orthographic cross-dissolve; no source geometry equivalence implied';}
      else{fea.group.position.copy(s.target).addScaledVector(right,.68).multiplyScalar(inset);fea.group.scale.setScalar(1+34*inset);fea.group.quaternion.identity().slerp(s.rotation,inset);}
    }
    if(chapter===4)Object.assign(host.dataset,{springPersistent:'complete same native CAD assembly',springDock:String(s.springDock),nativeSpringClipping:'none',nativeSpringDeformation:build===0?'illustrative unequal series winding':'none',springAssemblySeparation:String(s.spreadStrong),springFaceFlip:String(s.flipStrong),springContact:String(springMotion.contact),springExplanationPhase:String(springMotion.phase),springExplanationLoad:String(springMotion.load),springChapterPurpose:'why nonlinear stiffness -> how geometry creates it'});
    if(renderNow)render();
  }
  const FIGURE_WIDTH=.64;
  overlay.style.width=`${FIGURE_WIDTH*100}%`;
  let outgoingOverlay=null;
  const coverFocus=createCoverKneeFocus(host);
  const springExplanation=createSpringExplanationPanel(host);
  const controlExplanation=createControlExplanationPanel(host);
  function project(p){const v=p.clone().project(camera);return[(v.x+1)*.5*1600,(1-v.y)*.5*540];}
  const projectNative=project;
  function partPoint(prefix){
    if(prefix==='clinical')return clinical?.componentCenters;
    if(prefix==='leftKnee'||prefix==='rightKnee')return human?.getAttachment?.(prefix==='leftKnee'?'left':'right').kneeAnchor;
    if(prefix==='leftOutside'||prefix==='rightOutside'){const side=prefix==='leftOutside'?'left':'right';return human.getAttachment(side).kneeAnchor.clone().addScaledVector(outsideOffset(side),1-(side==='left'?live.leftInsertion:live.rightInsertion));}
    if(prefix==='contactBoundary'){
      if(weak.contactVertex===undefined){const target=weak.axisPoint.clone().addScaledVector(weak.axis,weak.band[0]).addScaledVector(weak.normal,.0082),candidate=new THREE.Vector3();let best=Infinity,index=0;for(let i=0;i<weak.geometry.attributes.position.count;i++){candidate.fromArray(weak.positions,i*3);const d=candidate.distanceToSquared(target);if(d<best){best=d;index=i;}}weak.contactVertex=index;}
      return new THREE.Vector3().fromBufferAttribute(weak.geometry.attributes.position,weak.contactVertex).applyMatrix4(weak.mesh.matrixWorld);
    }
    if(prefix==='coilEdge'||prefix==='coilGap'){const pts=cutDimensions?.[prefix==='coilEdge'?'a':'gap'];return pts?pts[0].clone().lerp(pts[1],.5):worldSpringPoint(weak);}
    const p=parts.find(p=>p.name.startsWith(prefix));return p?p.mesh.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(p.mesh.matrixWorld):null;
  }
  function drawOverlay(){
    if(!live)return;
    springExplanation.update({active:chapter===4,build,settled:!transition,fea,winding:chapter===4&&build===0?sampleSpringWinding(springClock):null,springMotion:sampleSpringExplanationMotion(springClock,build)});
    let controlTelemetry=sts?.getValues?.()||{};if(Number.isFinite(controlTelemetry.kneeAngleDeg))controlTelemetry={...controlTelemetry,kneeAngleDeg:Math.abs(controlTelemetry.kneeAngleDeg)};
    if(chapter===5&&[2,6].includes(build)&&controlCycle)controlTelemetry={...controlTelemetry,...controlCycle,timeSec:controlCycle.sourceTime};
    if(chapter===5&&build>=7&&walkingDiagnostic){
      const sourceTime=walking?.getValues?.().timeSec??walking?.getValues?.().sourceTime??walkingDiagnostic.timeSec[0];
      controlTelemetry={...controlTelemetry,...walking?.getValues?.(),series:walkingDiagnostic,timeSec:sourceTime,displayWindowSec:build===8?[walkingDiagnostic.failureTimeSec-5,walkingDiagnostic.failureTimeSec]:[Math.max(walkingDiagnostic.timeSec[0],sourceTime-4),Math.max(walkingDiagnostic.timeSec[0]+4,sourceTime)]};
    }
    controlTelemetry={...controlTelemetry,elapsedSec:controlClock};
    controlExplanation.update({active:chapter===5,build,settled:!transition,progress:build===2?Math.min(1,controlClock/6):0,telemetry:controlTelemetry});
    if(chapter===5)Object.assign(host.dataset,{controlStage:String(build),controlReplayTime:String(controlTelemetry.timeSec??controlTelemetry.sourceTime??0),controlReplayVisible:String((live.controlReplay||0)>.01||(live.walkingReplay||0)>.01),controlClock:controlClock.toFixed(4),controlLoopCycle:String(controlCycle?.cycleIndex??0),controlResetting:String(Boolean(controlCycle?.resetting))});
    if(chapter===3){const joint=restoredJointNodes.find(j=>j.name==='revolute_3'),origin=joint.node.getWorldPosition(new THREE.Vector3()),axis=joint.axis.clone().transformDirection(joint.node.matrixWorld),a=project(origin),b=project(origin.clone().addScaledVector(axis,.04));host.dataset.j3ProjectedAxisSpan=Math.hypot(a[0]-b[0],a[1]-b[1]).toFixed(5);host.dataset.mechanismView=build===1?'orthographic-exact-sagittal':build===2?'coupled-oblique':build===3?'axial':'source-orthographic';host.dataset.femoralReference=JSON.stringify(femoralReferenceDefinition);host.dataset.femoralReferencePosition=originString(new THREE.Vector3(...sourceFrame(live.phase).femoralReference));}
    const diagramOnly=chapter===5||chapter===7;overlay.setAttribute('viewBox',diagramOnly?'0 0 720 500':'0 0 1600 540');overlay.setAttribute('preserveAspectRatio',diagramOnly?'xMidYMid meet':'none');
    const conceptPoints=conceptMotor.visible&&clinical?{joint:clinical.componentCenters.insert,motor:conceptMotor.position.clone()}:null;
    const context={springMotion:sampleSpringExplanationMotion(springClock,build),hardwareZoomProgress:chapter===3&&build===4?smooth(clamp((hardwareStageClock-3.2)/3.4)):1,myoExamples,conceptPoints,page,step,live,compact:!!chapter,frame:chapter===3?hardwareFrame(live.phase):sourceFrame(live.phase),project,point:a=>new THREE.Vector3(...a),partPoint,springPoint:n=>worldSpringPoint(n==='weak'?weak:strong),history:chapter===3?hardwareFrame:sourceFrame,nativeLandmarks:nativeComparison?.getLandmarks(),projectNative};
    overlay.innerHTML=chapter?buildChapterOverlay({...context,chapter,build,fea,gait,human,legacy:()=>buildVisualExplanation(context)}):buildVisualExplanation(context);
    if(chapter===3){overlay.style.opacity=transition?'0':String(smooth(clamp(hardwareAnnotationClock/.35)));host.dataset.hardwareAnnotationOpacity=overlay.style.opacity;}
    // Preserve the academic font proportions while projected geometry fills the host.
    const textAspect=(host.clientHeight/540)/(host.clientWidth*FIGURE_WIDTH/1600);
    for(const dot of diagramOnly?[]:overlay.querySelectorAll('circle')){const y=Number(dot.getAttribute('cy'));dot.setAttribute('transform',`translate(0 ${y}) scale(1 ${1/textAspect}) translate(0 ${-y})`);dot.setAttribute('vector-effect','non-scaling-stroke');}
    for(const t of diagramOnly?[]:overlay.querySelectorAll('text')){const y=Number(t.getAttribute('y'));t.setAttribute('transform',`translate(0 ${y}) scale(1 ${1/textAspect}) translate(0 ${-y})`);}
  }
  function render(){
    if(disposed||host.clientWidth<2||host.clientHeight<2)return;const w=host.clientWidth,H=host.clientHeight;
    renderer.setScissorTest(false);renderer.setViewport(0,0,w,H);renderer.clear();
    renderer.setViewport(0,0,w*FIGURE_WIDTH,H);renderer.setScissor(0,0,w*FIGURE_WIDTH,H);renderer.setScissorTest(true);renderer.render(scene,camera);
    coverFocus.render({active:chapter===1&&(live?.coverInset||0)>.99,renderer,scene,sourceCamera:camera,gait,width:w,height:H});
    renderer.setScissorTest(false);drawOverlay();
  }
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(w<2||h<2)return;renderer.setSize(w,h,false);camera.aspect=w*FIGURE_WIDTH/h;updateOrthographicProjection();if(live)render();}
  function interpolate(a,b,u){const s={...b,target:a.target.clone().lerp(b.target,u),rotation:a.rotation.clone().slerp(b.rotation,u),devicePosition:a.devicePosition.clone().lerp(b.devicePosition,u),deviceRotation:a.deviceRotation.clone().slerp(b.deviceRotation,u),opacities:a.opacities.map((v,i)=>THREE.MathUtils.lerp(v,b.opacities[i],u))};for(const k of['phase','walkingReplay','controlReplay','springDock','flipStrong','nativeSpringTwist','driveExplode','explodeWeak','explodeStrong','spreadStrong','coilInspection','deform','section','transverse','stemCut','distance','nativeComparisonOpacity','humanReveal','nativeCut','nativeCutLeft','nativeCutRight','muscles','motionProgress','chair','attach','leftInsertion','rightInsertion','rightReveal','clinicalReveal','clinicalCut','clinicalHighlight','clinicalExplode','deviceScale','gait','fea','feaAngle','coverInset','bgExamples','bgMotor','bgFocus','bgSurgery','bgWiggle','bgSurfaceInspect','bgSurfaceLabels','bgMuscle80','bgChart'])s[k]=THREE.MathUtils.lerp(a[k]??0,b[k]??0,u);
    if(chapter===4&&build===5){s.rotation.copy(a.rotation).slerp(b.rotation,u);s.nativeSpringTwist=a.nativeSpringTwist||0;}
    if(chapter===4&&build===3){const separate=ease(clamp(u/.45)),rotate=ease(clamp((u-.45)/.55));for(const k of ['explodeWeak','explodeStrong','spreadStrong'])s[k]=THREE.MathUtils.lerp(a[k]||0,b[k]||0,separate);s.rotation.copy(a.rotation).slerp(b.rotation,rotate);}
    if(chapter===2&&build===2)s.bgChart=autoplayAllowed()?(u<.5?Math.cbrt(u/4):1-Math.cbrt((1-u)/4)):1;
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
    if(transition){transition.elapsed+=dt*getMotionRate();const u=clamp(transition.elapsed/transition.duration);sectionLines.visible=false;applyState(interpolate(transition.from,transition.to,ease(u)),false);host.dataset.transitionProgress=u.toFixed(4);overlay.style.opacity=chapter===2||chapter===3?'1':String(ease(clamp((u-.32)/.68)));if(outgoingOverlay)outgoingOverlay.style.opacity=String(1-ease(clamp(u/.25)));if(u>=1){outgoingOverlay?.remove();outgoingOverlay=null;}if(u>=1){transition=null;host.dataset.animation='idle';updateContours();}}
    if(chapter&&gait&&live?.gait>.001&&autoplayAllowed()){gaitClock+=dt;const phase=(gaitClock/(gait.durationSeconds||1.12))%1;gait.setProgress(phase);host.dataset.gaitPhase=phase.toFixed(5);host.dataset.gaitSourceTime=String(gait.group.userData.sourceTime);}
    if(chapter===1&&fea&&live?.coverInset>.001){
      const phase=(gaitClock/(gait?.durationSeconds||1.12))%1,angle=55*(1-Math.cos(2*Math.PI*phase)),springFrame=fea.setAngle(angle);
      Object.assign(host.dataset,{coverSpringPhase:phase.toFixed(5),coverSpringAngleDeg:angle.toFixed(3),coverSpringFrameIndex:String(springFrame.frameIndex),coverSpringActualAngleDeg:String(springFrame.actualAngleDeg??0),coverSpringReplay:'Stored loading frames forward/reverse, timed visually to gait; not computed gait response'});
    }
    if(chapter===2&&build===0&&autoplayAllowed()){
      backgroundClock+=dt*getMotionRate();applyState({...live,...sampleBackgroundSurfaceSequence(backgroundClock)},false);
    }
    if(chapter===3&&build<=4&&autoplayAllowed()){
      hardwareClock+=dt*getMotionRate();if(!transition)hardwareStageClock+=dt*getMotionRate();const phase=.43*(1-Math.cos(2*Math.PI*hardwareClock/7.6));
      let next={...live,phase};
      if(build===0&&!transition){
        const t=hardwareStageClock%16,axial=smooth(clamp((t-5)/2))*(1-smooth(clamp((t-13)/2))),side=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(-1,0,0),new THREE.Vector3(),UP)),top=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(0,1,0),new THREE.Vector3(),new THREE.Vector3(0,0,-1)));
        next.rotation=side.slerp(top,axial);host.dataset.hardwareView=axial>.95?'top':axial<.05?'side':'continuous-orbit';
      }
      if(build===4&&hardwareWideState&&!transition){
        const u=smooth(clamp((hardwareStageClock-3.2)/3.4)),gears=focusBox(p=>['helical_1m_21t','squre_splined_bevel_gear','part_49'].includes(partKey(p.name)));
        next.target=gears.getCenter(new THREE.Vector3()).lerp(hardwareWideState.target,u);next.distance=THREE.MathUtils.lerp(.085/(2*Math.tan(THREE.MathUtils.degToRad(16))),hardwareWideState.distance,u);next.rotation=hardwareWideState.rotation.clone();host.dataset.driveCloseupProgress=u.toFixed(4);
      }
      applyState(next,false);
      host.dataset.hardwareMotion='one source-kinematic cycle: flexion, J3 descent, AP travel and medial rotation';
    }
    if(chapter===4&&build!==5&&!transition&&autoplayAllowed()){springClock+=dt*getMotionRate();applyState({...live},false);}
    if(chapter===4&&build===5&&fea&&!transition&&autoplayAllowed()){
      springClock+=dt*getMotionRate();const angle=55*(1-Math.cos(2*Math.PI*springClock/10));
      const values=fea.setAngle(angle);Object.assign(host.dataset,{feaFrameIndex:String(values.frameIndex),feaActualAngle:String(values.actualAngleDeg??0),feaTorqueNm:String(values.torqueInputNm??0),feaChartSynchronization:'angle-aligned separate FEA and supplied ANSYS curve; not paired reaction values'});
    }
    if(chapter===5&&!transition&&autoplayAllowed()){
      controlClock+=dt*getMotionRate();
      if((build===2||build===6)&&sts){controlCycle=sampleSitStandCycle(controlClock,{sourceEnd:build===2?6:8});sts.setProgress(controlCycle.sourceTime/sts.durationSeconds);}
      if(build===3&&sts){
        sts.setDevelopmentProgress?.(Math.min(1,controlClock/(sts.getDevelopmentDuration?.()||28)));
        // Follow the actual body through its fall instead of shrinking every
        // pose to one wide trajectory box. Only presentation framing changes.
        const bounds=sts.getPoseBounds().applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(live.rotation.clone().invert())),size=bounds.getSize(new THREE.Vector3()),target=bounds.getCenter(new THREE.Vector3()).applyQuaternion(live.rotation),height=Math.max(1.75,size.y/.88,size.x/(camera.aspect*.40)),follow=1-Math.exp(-dt/.18),zoom=1-Math.exp(-dt/.32);
        live.target.lerp(target,follow);projectionHeight=THREE.MathUtils.lerp(projectionHeight,height,zoom);live.distance=projectionHeight/(2*Math.tan(THREE.MathUtils.degToRad(16)));updateOrthographicProjection();
        const aim=live.target.clone().addScaledVector(new THREE.Vector3(1,0,0).applyQuaternion(live.rotation),projectionHeight*camera.aspect*.28*live.springDock);
        camera.quaternion.copy(live.rotation);camera.position.copy(aim).add(new THREE.Vector3(0,0,5).applyQuaternion(live.rotation));
      }
      if(build>=7&&walking){const start=build===8?walking.endTimeSec-5:walking.startTimeSec;const duration=walking.endTimeSec-start;const t=start+(walking.endTimeSec-start)*Math.min(1,controlClock/duration);walking.setTime(t);}
    }
    if(chapter===3&&!transition)hardwareAnnotationClock+=dt*getMotionRate();
    if(chapter===2&&build===3&&myoExamples&&autoplayAllowed())myoExamples.setProgress((now/3500)%1);
    if(!transition)host.dataset.animation=autoplayAllowed()&&(chapter===2&&build===0&&backgroundClock<BACKGROUND_SURFACE_DURATION||chapter===3&&build===4&&hardwareStageClock<6.6||chapter===4&&build===3&&springClock<5.4)?'running':'idle';
    render();
    if(transition||chapter===5&&([0,2,4,5,6].includes(build)||[3,7,8].includes(build)&&controlClock<(build===3?(sts?.getDevelopmentDuration?.()||28):build===7?(walking?.durationSeconds||28):build===8?5:build===2?6:18))&&autoplayAllowed()||chapter===4&&autoplayAllowed()||chapter===3&&hardwareAnnotationClock<.35&&autoplayAllowed()||chapter===3&&build<=4&&autoplayAllowed()||chapter&&live?.gait>.001&&autoplayAllowed()||chapter===2&&(build===3||build===0&&backgroundClock<BACKGROUND_SURFACE_DURATION)&&autoplayAllowed())raf=requestAnimationFrame(tick);else{raf=0;last=0;}
  }
  function setStory(nextPage,nextStep=0,animate=true){
    if(![1,2,3,4,5,6,7,8,9,10,11,12,13,16,17,18,19,28].includes(Number(nextPage))){pause();return;}
    pause();suspended=false;page=Number(nextPage);step=Math.max(0,Number(nextStep)||0);camera.aspect=host.clientWidth*FIGURE_WIDTH/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();
    const from=live?cloneState(live):null,to=endState(page,step);
    Object.assign(host.dataset,{page:String(page),step:String(step),sourceModel:'same-aakj-v3-glb-slider-owner-corrected',continuity:'one-scene-one-renderer',cameraStartsFrom:'current-interpolated-state'});
    if(from&&initialized&&animate&&!reduced()){
      applyState(from,false);sectionLines.visible=false;transition={from,to,elapsed:0,duration:page===19&&step===5?7.2:3.1};last=0;host.dataset.animation='running';host.dataset.transitionProgress='0';render();raf=requestAnimationFrame(tick);
    }else{applyState(to,false);updateContours();resize();host.dataset.transitionProgress='1';}
    initialized=true;
  }
  const mapping={1:[[28,0]],2:[[18,0],[2,4],[18,2],[18,3],[1,0]],3:[[7,0],[7,3],[8,1],[8,4],[9,3],[11,0]],4:[[11,0],[12,1],[13,3],[13,3],[12,2],[12,2],[12,2]],5:[[11,0],[18,0],[18,0],[18,0],[18,0],[18,0],[18,0],[18,0],[18,0]],6:[[28,0],[28,2]]};
  async function setChapter(nextChapter,nextBuild=0,animate=true){
    clearTimeout(myoPrefetchTimer);
    const requestToken=++chapterToken,c=Number(nextChapter),b=Math.max(0,Math.min(mapping[c].length-1,Number(nextBuild)||0));
    if(c===5&&[1,2,3,6].includes(b)){status.hidden=initialized;status.textContent='Preparing recorded sit-to-stand…';await ensureSTS();if(b===3){await sts.ensureDevelopment?.();sts.setDevelopmentProgress(0);}status.hidden=true;if(requestToken!==chapterToken)return;}
    if(c===5&&b>=7){status.hidden=initialized;status.textContent='Preparing recorded walking…';await Promise.all([ensureWalkingDiagnostic(),ensureWalking()]);status.hidden=true;if(requestToken!==chapterToken)return;}
    if(c===1||c===4&&b===5){status.hidden=false;status.textContent='Preparing solved spring fields…';await ensureFEA();status.hidden=true;if(requestToken!==chapterToken)return;}
    if(c===2&&b===2){status.hidden=false;status.textContent='Preparing MyoLeg 80-muscle anatomy…';await ensureMyo80();status.hidden=true;if(requestToken!==chapterToken)return;}
    if(c===2&&b===3){status.hidden=false;status.textContent='Preparing three MyoAssist wearable examples…';await ensureMyoExamples();status.hidden=true;if(requestToken!==chapterToken)return;}
    const enteringHardware=chapter!==3;const previous=live?cloneState(live):null,oldOverlay=initialized&&animate&&!reduced()&&c!==2&&c!==3?overlay.cloneNode(true):null;if(previous&&chapter===2&&build===0&&c===2&&b===1){previous.rotation.copy(camera.quaternion);previous.target.copy(camera.position).addScaledVector(new THREE.Vector3(0,0,1).applyQuaternion(camera.quaternion),-5);previous.distance=projectionHeight/(2*Math.tan(THREE.MathUtils.degToRad(16)));}pause();if(oldOverlay){outgoingOverlay=oldOverlay;oldOverlay.removeAttribute('id');host.append(oldOverlay);} suspended=false;chapter=c;build=b;hardwareStageClock=0;hardwareAnnotationClock=c===3&&animate&&autoplayAllowed()?0:.35;[page,step]=mapping[c][b];const to=endState(page,step);to.gait=0;to.fea=0;to.feaAngle=0;
    if(c===1||c===6){
      to.gait=gait?1:0;to.humanReveal=gait?0:.75;to.muscles=0;to.chair=0;to.opacities=parts.map(()=>gait?0:1);to.rightReveal=0;to.attach=0;to.clinicalReveal=0;to.clinicalCut=0;
      const bounds=gait?.getBounds()||human.getMotionBounds(),center=bounds.getCenter(new THREE.Vector3()),height=Math.max(1.72,bounds.getSize(new THREE.Vector3()).y*1.05);to.target.copy(center);to.distance=height/(2*Math.tan(THREE.MathUtils.degToRad(16)));const direction=new THREE.Vector3(1.3,.16,1).normalize();to.rotation.setFromRotationMatrix(new THREE.Matrix4().lookAt(center.clone().addScaledVector(direction,to.distance),center,UP));
    }
    if(c===1){to.coverInset=1;to.fea=1;to.feaAngle=0;}
    if(c===2&&b===0){to.opacities=parts.map(()=>0);to.humanReveal=.8;to.muscles=.25;to.chair=0;to.rightReveal=0;to.clinicalHighlight=.8;}
    if(c===2&&(b===2||b===3)){to.opacities=parts.map(()=>0);to.humanReveal=.85;to.muscles=.85;to.chair=0;to.rightReveal=0;to.clinicalReveal=0;to.clinicalCut=0;}
    if(c===3){if(enteringHardware)hardwareClock=0;else if(previous)to.phase=previous.phase;}
    if(c===3&&b===0){to.opacities=parts.map(()=>0);to.humanReveal=0;to.rightReveal=0;to.clinicalReveal=0;to.clinicalCut=0;}
    if(c===4){springClock=autoplayAllowed()?0:2.5;to.fea=b===5?1:0;to.feaAngle=b===5&&!autoplayAllowed()?110:0;if(b===5&&previous&&previous.fea<.01&&previous.opacities[parts.indexOf(weak)]>.9&&previous.opacities[parts.indexOf(strong)]<.01){to.rotation.copy(previous.rotation);to.target.copy(previous.target);to.distance=previous.distance;to.springDock=previous.springDock;}}
    if(c===5){
      controlClock=0;controlCycle=[2,6].includes(b)&&autoplayAllowed()?sampleSitStandCycle(0,{sourceEnd:b===2?6:8}):null;
      if(sts){sts.setAttempt?.('student');if(b===3)sts.setDevelopmentProgress?.(autoplayAllowed()?0:1);else if(b!==1)sts.setProgress(autoplayAllowed()?0:1);}
      if(b>=7&&walking){if(b===7)walking.setProgress(autoplayAllowed()?0:1);else walking.setTime(autoplayAllowed()?walking.endTimeSec-5:walking.endTimeSec);}
      if(previous){previous.controlReplay??=0;previous.walkingReplay??=0;}
    }
    if(c===2){backgroundState(b,to);backgroundClock=0;if(b===1&&previous&&animate)previous.bgSurgery=0;if(b===2&&previous)previous.bgChart=0;}
    camera.aspect=host.clientWidth*FIGURE_WIDTH/Math.max(1,host.clientHeight);camera.updateProjectionMatrix();
    Object.assign(host.dataset,{chapter:String(c),build:String(b),page:String(c),storyScene:String(page),storyStep:String(step),continuity:'one-scene-one-renderer',cameraStartsFrom:'current-interpolated-state',sourceModel:'persistent-original-CAD-with-corrected-subtree-ownership-and-recorded-gait'});
    if(previous&&initialized&&animate&&!reduced()){
      transition={from:previous,to,elapsed:0,duration:c===2?(b===1?10.2:b===2?2.2:b===3||b===4?1.55:1.3):c===4&&(b===3||b===5)?4.8:2.2};last=performance.now();host.dataset.animation='running';host.dataset.transitionProgress='0';applyState(previous,false);raf=requestAnimationFrame(tick);
    }else if(c===2&&b===2&&autoplayAllowed()){
      // A directly opened chart also enters gently after the loading screen;
      // its animation shares the navigation clock, including held-key speed.
      const start=cloneState(to);start.bgChart=0;transition={from:start,to,elapsed:0,duration:2.2};last=performance.now();host.dataset.animation='running';host.dataset.transitionProgress='0';applyState(start,false);resize();raf=requestAnimationFrame(tick);
    }else{applyState(to,false);host.dataset.animation='idle';host.dataset.transitionProgress='1';resize();if((to.gait>.001||c===5&&[0,2,3,4,5,6,7,8].includes(b)||c===4||c===3&&(b<=4||hardwareAnnotationClock<.35)||c===2&&(b===3||b===0))&&autoplayAllowed())raf=requestAnimationFrame(tick);}
    initialized=true;
    if(c===5&&b===0)ensureSTS().catch(error=>console.warn('Sit-to-stand prefetch unavailable',error));
    if(c===5&&b===2)sts?.ensureDevelopment?.().catch(error=>console.warn('Development replay prefetch unavailable',error));
    if(c===5&&b===6)Promise.all([ensureWalking(),ensureWalkingDiagnostic()]).catch(error=>console.warn('Walking replay prefetch unavailable',error));
    if(c===2&&b===2)myoPrefetchTimer=setTimeout(()=>{if(!disposed&&chapter===2&&build===2)ensureMyoExamples().catch(error=>console.warn('Wearable examples will retry on entry',error));},1400);
  }
  const observer=new ResizeObserver(resize);observer.observe(host);setStory(1,0,false);
  return{ready:true,setStory,setChapter,resize,pause,warmSources:ensureFEA,dispose(){disposed=true;clearTimeout(myoPrefetchTimer);pause();observer.disconnect();coverFocus.dispose();springFaceAccents.dispose();springExplanation.dispose();controlExplanation.dispose();sts?.dispose();walking?.dispose();overlay.remove();status.remove();renderer.dispose();env.dispose();clinical?.dispose();myo80?.dispose();nativeComparison?.dispose();gait?.dispose();fea?.dispose();myoExamples?.dispose();conceptEdges.forEach(e=>e.dispose());conceptMaterials.forEach(m=>m.dispose());scene.remove(conceptMotor);human?.dispose();for(const p of parts){p.edges?.dispose();p.geometry?.dispose();p.materials.forEach(m=>m.dispose());}for(const p of rightParts){p.edges?.dispose();p.materials.forEach(m=>m.dispose());}sectionLines.geometry.dispose();sectionLines.material.dispose();renderer.domElement.remove();}};
}
