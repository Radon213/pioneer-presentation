"""Exact saved walking states -> display transforms. Read-only FK, no integration."""
from pathlib import Path
import json,struct,gzip,hashlib
from collections import Counter
from scipy.spatial import cKDTree
import numpy as np,mujoco
ROOT=Path('/home/arl/Documents/Pioneer');REPO=ROOT/'deploy/pioneer-presentation-pages-20261029';ASSET=REPO/'examples/pioneer-draft/assets';SOURCE=ROOT/'work/aakj-direct-torque-2026-10-27/tracking_teacher_r1/final30';XML=ROOT/'work/aakj-spring-material-2026-10-27/weak_active_blender_rgba.xml'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
protected=[SOURCE/'rollouts.npz',SOURCE/'report.json',XML,ASSET/'gait-chapter-native-rebound.bin'];before={str(p):sha(p)for p in protected}
b=(ASSET/'gait-chapter-native-rebound.bin').read_bytes();ml=struct.unpack_from('<I',b,8)[0];h=json.loads(b[12:12+ml]);base=((12+ml+7)//8)*8
def revive(v):
 if isinstance(v,dict):
  if '$typed'in v:return np.frombuffer(b,dtype={'f':'<f4','d':'<f8','H':'<u2','I':'<u4'}[v['$typed']],count=v['length'],offset=base+v['offset'])
  return {k:revive(x)for k,x in v.items()}
 if isinstance(v,list):return [revive(x)for x in v]
 return v
gait=revive(h['data']);assert sha(XML)==gait['provenance']['sourceModelSHA256'];m=mujoco.MjModel.from_xml_path(str(XML));d=mujoco.MjData(m);raw=np.load(SOURCE/'rollouts.npz');z={'state':raw['state'],'commands':raw['commands'][::2],'metrics':raw['metrics'][::2],'time_s':.01+.02*np.arange(len(raw['state']))};world=6;
assert np.all(z['metrics'][:,world,0]>0);
assert z['state'].shape[-1]==m.nq+m.nv+m.na+4
for name in ['mj_step','mj_step1','mj_step2','mj_forward','mj_inverse','mj_fwdPosition','mj_fwdVelocity','mj_fwdActuation','mj_fwdAcceleration']:
 setattr(mujoco,name,lambda *args,_name=name,**kw:(_ for _ in ()).throw(RuntimeError('Forbidden physics '+_name)))
geoms=[];max_mesh_diff=0;verified=[];own_meshes={};partitions=[]
native_contract=json.loads((ROOT/'work/rebound-pos5-native/native-subtrees.json').read_text())
def rotation(q):
 out=np.empty(9);mujoco.mju_quat2Mat(out,q);return out.reshape(3,3)
for g in gait['geoms']:
 g=dict(g); native=g.get('nativeRebound',False)
 if native:
  bid=m.body(g['sourceBodyName']).id;g['stsSourceBodyId']=bid;g['stsFrameKind']='body'
 else:
  gid=m.geom(g['name']).id;g['stsSourceGeomId']=gid;g['stsFrameKind']='geom';g['rgba']=m.geom_rgba[gid].astype(float).tolist();mat=int(m.geom_matid[gid]);
  if mat>=0 and np.allclose(g['rgba'],[.5,.5,.5,1]):g['rgba']=m.mat_rgba[mat].astype(float).tolist()
  if int(m.geom_type[gid])==7:
   mid=int(m.geom_dataid[gid]);va=int(m.mesh_vertadr[mid]);vn=int(m.mesh_vertnum[mid]);fa=int(m.mesh_faceadr[mid]);fn=int(m.mesh_facenum[mid]);raw=np.asarray(m.mesh_vert[va:va+vn],np.float32).reshape(-1);faces=np.asarray(m.mesh_face[fa:fa+fn],np.uint32).copy();shared=gait['meshes'][str(g['mesh'])]['positions'];err=float(np.max(np.abs(raw-shared))) if raw.shape==shared.shape else None
   link=g['name'].removeprefix('aakj_r_').removeprefix('aakj_').removesuffix('_visual');parts=[x for x in native_contract['subtrees'] if x['sourceCompositeLink']==link]
   if parts:
    verts=np.asarray(m.mesh_vert[va:va+vn],float)@rotation(m.mesh_quat[mid]).T+m.mesh_pos[mid];tree=cKDTree(verts);remove=Counter()
    for part in parts:
     v=np.asarray(part['positions']).reshape(-1,3);f=np.asarray(part['indices']).reshape(-1,3)
     if g['name'].startswith('aakj_r_'):v=v.copy();v[:,0]*=-1;f=f[:,[0,2,1]]
     dist,nearest=tree.query(v);assert dist.max()<1e-7,(g['name'],part['name'],dist.max());remove.update(map(tuple,np.sort(nearest[f],axis=1)))
    kept=[];removed=0
    for face in faces:
     key=tuple(sorted(face))
     if remove[key]:remove[key]-=1;removed+=1
     else:kept.append(face)
    assert not +remove;faces=np.asarray(kept,np.uint32);partitions.append({'geom':g['name'],'removedNativeSourceFaces':removed,'nativeSourceTrianglePartitionVerified':True})
   same_positions=err is not None and err<2e-7;same_faces=np.array_equal(faces.reshape(-1),gait['meshes'][str(g['mesh'])]['indices'])
   if same_positions and same_faces:max_mesh_diff=max(max_mesh_diff,err)
   else:
    key='sts_'+str(mid);g['stsMesh']=key
    own_meshes[key]={'positions':raw.astype('<f4'),'indices':faces.reshape(-1).astype('<u4')}
   verified.append({'geom':g['name'],'maxVertexDifferenceM':err,'sourceGeometryShared':same_positions and same_faces,'sourceVertexCount':vn,'retainedTriangleCount':len(faces)})

 geoms.append(g)
qidx=lambda name:int(m.joint(name).qposadr[0]);leftDrive=qidx('aakj_drive_output_angle');leftOut=qidx('aakj_revolute_5');leftKnee=qidx('knee_angle_l');pelvis=m.body('pelvis').id
window=np.flatnonzero((z['time_s']>=20)&(z['time_s']<=28));ids=window[::2].tolist();
if ids[-1]!=int(window[-1]):ids.append(int(window[-1]))
frames=[]
def quat(mat):
 q=np.empty(4);mujoco.mju_mat2Quat(q,np.asarray(mat));return q[[1,2,3,0]]
for num,i in enumerate(ids):
 d.qpos[:]=z['state'][i,world,:m.nq];mujoco.mj_kinematics(m,d);mujoco.mj_tendon(m,d);offset=np.array([d.xpos[pelvis,0],0,0]);p=[];q=[]
 for g in geoms:
  if g['stsFrameKind']=='body':j=g['stsSourceBodyId'];p.extend(d.xpos[j]-offset);q.extend(quat(d.xmat[j]))
  else:j=g['stsSourceGeomId'];p.extend(d.geom_xpos[j]-offset);q.extend(quat(d.geom_xmat[j]))
 paths=[]
 for j in range(m.ntendon):
  adr=int(d.ten_wrapadr[j]);n=int(d.ten_wrapnum[j]);paths.append((np.asarray(d.wrap_xpos).reshape(-1,3)[adr:adr+n]-offset).astype('<f4').reshape(-1))
 attachments={}
 for side,limb,pre in [('left','l','aakj_'),('right','r','aakj_r_')]:
  joint=m.joint(pre+'revolute_3').id;attachment={'knee':(d.xanchor[joint]-offset).tolist(),'axis':d.xaxis[joint].tolist(),'nativeFlexionRad':float(d.qpos[qidx('knee_angle_'+limb)])}
  for bone in ['femur','tibia']:
   j=m.body(bone+'_'+limb).id;attachment[bone]={'p':(d.xpos[j]-offset).tolist(),'q':quat(d.xmat[j]).tolist()}
  attachments[side]=attachment
 t=float(z['time_s'][i]);values={'timeSec':t,'kneeAngleDeg':float(d.qpos[leftKnee]*180/np.pi),'springDeflectionDeg':float((d.qpos[leftDrive]-d.qpos[leftOut])*180/np.pi),'springTorqueNm':float(z['state'][i,world,-1]),'motorPowerW':float(abs(z['state'][i,world,-3]*z['state'][i,world,m.nq+leftDrive])),'requestedTorqueNm':float(8*z['commands'][i,world,1]),'appliedTorqueNm':float(z['state'][i,world,-3]),'walkingSpeedMps':float(z['metrics'][i,world,1]),'phaseLabel':'Recorded sensor-student walking'}
 frames.append({'t':t,'sourceIndex':i,'p':np.asarray(p,dtype='<f4'),'q':np.asarray(q,dtype='<f4'),'tendons':paths,'attachment':attachments,'values':values})
 if num%100==0:print('poses',num,len(ids),flush=True)
assert all(np.isfinite(f[k]).all()for f in frames for k in ['p','q']);assert max(abs(np.linalg.norm(f['q'].reshape(-1,4),axis=1)-1).max()for f in frames)<2e-7
provenance={'classification':'ACTUAL_RECORDED_WALKING_SENSOR_STUDENT','sourceTrace':str(SOURCE/'rollouts.npz'),'sourceTraceSHA256':sha(SOURCE/'rollouts.npz'),'sourceModel':str(XML),'sourceModelSHA256':sha(XML),'sourceWorld':world,'sourceWindowSeconds':[frames[0]['t'],frames[-1]['t']],'durationSeconds':frames[-1]['t']-frames[0]['t'],'frameCount':len(frames),'displaySampleHz':25,'sourceSampleHz':50,'controller':'Learned six-state observer with fixed tracking teacher control law; not the STS GRU residual actor','nominalCompleteSeconds':30,'matchedSpeedQualified':False,'measuredClinicalData':False,'assistanceBenefit':False,'qualified':False,'physicsSteps':0,'offlineKinematicsCalls':len(frames),'offlineTendonWrapCalls':len(frames),'forwardDynamicsCalls':0,'mujocoVersion':mujoco.__version__,'coordinates':'Source Z-up metres. Subtract actual pelvis X only for an in-place camera frame; preserve every relative pose.','sharedGeometrySource':'gait-chapter-native-rebound.bin','sharedGeometrySHA256':sha(ASSET/'gait-chapter-native-rebound.bin'),'sharedGeometryCompatibilityMaxDifferenceM':max_mesh_diff,'telemetrySide':'left','telemetryAlignment':'Saved 50 Hz post-step state; commands and metrics at matching 100 Hz index.','motorPowerDefinition':'Absolute saved motor-generated torque times saved referred-drive speed; not shaft endpoint power.'}
result={'schema':'pioneer-control-walking-v1','geoms':geoms,'meshes':own_meshes,'tendons':gait['tendons'],'frames':frames,'provenance':provenance};assert len(gait['tendons'])==m.ntendon
for j,t in enumerate(gait['tendons']):assert t['name']==m.tendon(j).name
chunks=[];offset=0
def typed(v):
 global offset
 if isinstance(v,np.ndarray):
  pad=(-offset)%8
  if pad:chunks.append(bytes(pad));offset+=pad
  a=np.ascontiguousarray(v);out={'$typed':'I' if a.dtype.kind=='u' else 'f','offset':offset,'length':a.size};chunks.append(a.tobytes());offset+=a.nbytes;return out
 if isinstance(v,dict):return {k:typed(x)for k,x in v.items()}
 if isinstance(v,list):return [typed(x)for x in v]
 return v
manifest=json.dumps({'schema':'pioneer-control-walking-binary-v1','data':typed(result)},separators=(',',':')).encode();header=b'PCWLK1\0\0'+struct.pack('<I',len(manifest))+manifest;header+=bytes((-len(header))%8);binary=header+b''.join(chunks)
(ASSET/'control-walking-student.bin').write_bytes(binary);(ASSET/'control-walking-student.bin.gz').write_bytes(gzip.compress(binary,compresslevel=9,mtime=0))
assert all(sha(p)==h for p,h in before.items());report={**provenance,'protectedSourceHashes':before,'allProtectedSourcesUnchanged':True,'geometryCompatibility':verified,'newSourceMeshCount':len(own_meshes),'nativeFacePartitions':partitions,'outputBytes':len(binary),'gzipBytes':(ASSET/'control-walking-student.bin.gz').stat().st_size,'binarySHA256':sha(ASSET/'control-walking-student.bin'),'gzipSHA256':sha(ASSET/'control-walking-student.bin.gz')};(REPO/'docs/control-walking-student-provenance.json').write_text(json.dumps(report,indent=2))
print({'frames':len(frames),'gzipBytes':len(gzip.compress(binary,compresslevel=9,mtime=0))})
