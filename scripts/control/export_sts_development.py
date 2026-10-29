"""Export existing failed STS development poses, with no dynamics or policy calls.

The final student asset remains unchanged. Geometry is shared only after checking
its mesh coordinates against each historical source model.
"""
from pathlib import Path
import gzip, hashlib, json, struct
import numpy as np
import mujoco
ROOT=Path('/home/arl/Documents/Pioneer')
REPO=ROOT/'deploy/pioneer-presentation-pages-20261029'
ASSET=REPO/'examples/pioneer-draft/assets'
BASE=ROOT/'work/myoassist22-aakj-sts-teacher-student-2026-10-28'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
def decode(path):
 b=path.read_bytes(); n=struct.unpack_from('<I',b,8)[0]; manifest=json.loads(b[12:12+n]);base=(12+n+7)//8*8
 def revive(v):
  if isinstance(v,dict):
   if '$typed' in v:return np.frombuffer(b,dtype={'f':'<f4','I':'<u4'}[v['$typed']],count=v['length'],offset=base+v['offset'])
   return {k:revive(x)for k,x in v.items()}
  if isinstance(v,list):return [revive(x)for x in v]
  return v
 return revive(manifest['data'])
selected=decode(ASSET/'control-sts.bin')
selected_model=mujoco.MjModel.from_xml_path(selected['provenance']['sourceModel'])
clips=[('early','Early human-policy training','baseline_development/threshold_0.51','runtime',24),('unstable','Stand-up, then loss of balance','p13_momentum_duration_screen_r2_0','runtime_p13_momentum_duration_r1',2)]
# Only geometric frame evaluation and tendon wrapping, never a forward solve.
for name in ['mj_step','mj_step1','mj_step2','mj_forward','mj_inverse','mj_fwdPosition','mj_fwdVelocity','mj_fwdActuation','mj_fwdAcceleration']:
 setattr(mujoco,name,lambda *args,_name=name,**kwargs:(_ for _ in ()).throw(RuntimeError('Forbidden dynamics: '+_name)))
def quat(mat):
 q=np.empty(4);mujoco.mju_mat2Quat(q,np.asarray(mat));return q[[1,2,3,0]]
attempts=[];reports=[]
for ident,label,source,runtime,world in clips:
 bare=ident=='early'
 folder=(ROOT/'work/myoassist22-single-ppo-path-cooptimization-2026-10-28'/source) if bare else BASE/'p0_causal_execution_r1'/source
 trace_path=folder/('trace.npz' if bare else 'actual_trace.npz');xml=(ROOT/'work/myoassist22-single-ppo-path-cooptimization-2026-10-28'/runtime/'path48_15/chair22.xml') if bare else BASE/runtime/'path48_15/chair22.xml'
 protected={str(p):sha(p)for p in ([trace_path,xml,folder/'RESULT.json']if bare else[trace_path,xml,folder/'recording.json',folder/'independent_dwell_audit.json'])}
 trace=np.load(trace_path);m=mujoco.MjModel.from_xml_path(str(xml));d=mujoco.MjData(m)
 assert m.nq==trace['qpos'].shape[2]
 # The actual geometry contract: compare raw mesh vertices/faces and geom local
 # transforms, rather than assuming that matching names prove compatibility.
 maxdiff=0
 for g in selected['geoms']:
  if g['role']=='chair' or (bare and g['role']=='implant'):continue
  if g.get('nativeRebound'):
   assert m.body(g['sourceBodyName']).id>=0
   continue
  a=m.geom(g['name']).id;b=selected_model.geom(g['name']).id
  assert int(m.geom_type[a])==int(selected_model.geom_type[b])
  assert np.allclose(m.geom_pos[a],selected_model.geom_pos[b],atol=2e-7)
  assert np.allclose(m.geom_quat[a],selected_model.geom_quat[b],atol=2e-7)
  if int(m.geom_type[a])==7:
   x=int(m.geom_dataid[a]);y=int(selected_model.geom_dataid[b]);xn=int(m.mesh_vertnum[x]);yn=int(selected_model.mesh_vertnum[y]);assert xn==yn
   xv=m.mesh_vert[int(m.mesh_vertadr[x]):int(m.mesh_vertadr[x])+xn];yv=selected_model.mesh_vert[int(selected_model.mesh_vertadr[y]):int(selected_model.mesh_vertadr[y])+yn]
   maxdiff=max(maxdiff,float(np.max(np.abs(xv-yv))));assert maxdiff<2e-7
   assert np.allclose(m.mesh_pos[x],selected_model.mesh_pos[y],atol=2e-7)
   assert np.allclose(m.mesh_quat[x],selected_model.mesh_quat[y],atol=2e-7)
 last=190 if bare else int(np.where(trace['active_before'][:,world])[0][-1]);ids=list(range(0,last+1,1 if bare else 4))
 if ids[-1]!=last:ids.append(last)
 qidx=lambda name:int(m.joint(name).qposadr[0]);left_drive=0 if bare else qidx('aakj_drive_output_angle');left_out=0 if bare else qidx('aakj_revolute_5');left_knee=qidx('knee_angle_l')
 frames=[]
 for i in ids:
  d.qpos[:]=trace['qpos'][i,world];mujoco.mj_kinematics(m,d);mujoco.mj_tendon(m,d)
  p=[];q=[]
  for gi,g in enumerate(selected['geoms']):
   if bare and g['role']=='implant':p.extend(selected['frames'][0]['p'][gi*3:gi*3+3]);q.extend(selected['frames'][0]['q'][gi*4:gi*4+4]);continue
   if g.get('nativeRebound'):j=m.body(g['sourceBodyName']).id;p.extend(d.xpos[j]);q.extend(quat(d.xmat[j]))
   else:j=m.geom(g['name']).id;p.extend(d.geom_xpos[j]);q.extend(quat(d.geom_xmat[j]))
  tendons=[]
  source_tendon_names={m.tendon(j).name:j for j in range(m.ntendon)}
  for tendon in selected['tendons']:
   if tendon['name'] not in source_tendon_names:tendons.append(np.asarray([],dtype='<f4'));continue
   j=source_tendon_names[tendon['name']];adr=int(d.ten_wrapadr[j]);n=int(d.ten_wrapnum[j]);tendons.append(np.asarray(d.wrap_xpos).reshape(-1,3)[adr:adr+n].astype('<f4').reshape(-1))
  attachment={}
  for side,limb,pre in [('left','l','aakj_'),('right','r','aakj_r_')]:
   joint=m.joint('knee_angle_'+limb if bare else pre+'revolute_3').id;a={'knee':d.xanchor[joint].tolist(),'axis':d.xaxis[joint].tolist(),'nativeFlexionRad':float(d.qpos[qidx('knee_angle_'+limb)])}
   for bone in ['femur','tibia']:
    j=m.body(bone+'_'+limb).id;a[bone]={'p':d.xpos[j].tolist(),'q':quat(d.xmat[j]).tolist()}
   attachment[side]=a
  t=float(trace['time'][i]) if bare else (i+1)*.01
  values={'timeSec':t,'kneeAngleDeg':float(d.qpos[left_knee]*180/np.pi),'springDeflectionDeg':float((d.qpos[left_drive]-d.qpos[left_out])*180/np.pi),'phaseLabel':label,'attemptId':ident,'pelvisHeightM':float(trace['qpos'][i,world,1]),'bareHuman':bare}
  if 'device_applied' in trace.files:
   applied=float(trace['device_applied'][i,world,1]);torque=float(trace['device_spring'][i,world,1]);velocity=float(trace['qvel'][i,world,left_drive])
   values.update({'springTorqueNm':torque,'motorPowerW':applied*velocity,'requestedTorqueNm':float(trace['device_request'][i,world,1]),'appliedTorqueNm':applied})
  frames.append({'t':t,'sourceIndex':i,'p':np.asarray(p,dtype='<f4'),'q':np.asarray(q,dtype='<f4'),'tendons':tendons,'attachment':attachment,'values':values})
 audit=json.loads((folder/('RESULT.json'if bare else'independent_dwell_audit.json')).read_text())
 report={'id':ident,'label':label,'sourceTrace':str(trace_path),'sourceTraceSHA256':sha(trace_path),'sourceModel':str(xml),'sourceModelSHA256':sha(xml),'sourceWorld':world,'sourceIndexRange':[0,last],'durationSeconds':frames[-1]['t']-frames[0]['t'],'sourceSampleHz':20 if bare else 100,'displaySampleHz':20 if bare else 25,'frameCount':len(frames),'terminalFailureReason':int(trace['reason'][last,world]),'taskSuccess':bool(audit['strict_success_mask'if bare else'per_world_success'][world]),'bareHuman':bare,'continuedAfterValidityFailure':bare,'fullGroundFallSourceRecorded':bare,'sourceTendonCount':m.ntendon,'displayTendonSlots':len(selected['tendons']),'validityFailureSourceIndex':int(np.where(~trace['valid'][:,world])[0][0]) if bare else None,'playbackRate':.75,'terminalHoldSeconds':1.5,'qualified':False,'physicsSteps':0,'offlineKinematicsCalls':len(frames),'sharedMeshMaxDifferenceM':maxdiff,'allProtectedSourcesUnchanged':all(sha(p)==v for p,v in protected.items()),'protectedSourceHashes':protected}
 assert all(np.isfinite(f[k]).all()for f in frames for k in ['p','q']);assert report['allProtectedSourcesUnchanged']
 attempts.append({'id':ident,'label':label,'frames':frames,'provenance':report});reports.append(report)
 print(ident,len(frames),last,flush=True)
result={'schema':'pioneer-control-sts-development-v1','attempts':attempts,'provenance':{'classification':'ACTUAL_RECORDED_CONTROLLER_DEVELOPMENT_SNAPSHOTS','notLearningCurve':True,'notSameCheckpointComparison':True,'poseRepair':False,'dynamicsCalls':0,'chairVisualCorrection':{'geoms':['chair_leg_3','chair_leg_4'],'translationSourceM':[.1,0,0],'scope':'Visual only; original physical rollout and source files preserved.'}}}
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
manifest=json.dumps({'schema':'pioneer-control-sts-binary-v1','data':typed(result)},separators=(',',':')).encode();header=b'PCSTS1\0\0'+struct.pack('<I',len(manifest))+manifest;header+=bytes((-len(header))%8);binary=header+b''.join(chunks)
(ASSET/'control-sts-development.bin').write_bytes(binary);(ASSET/'control-sts-development.bin.gz').write_bytes(gzip.compress(binary,compresslevel=9,mtime=0))
report={**result['provenance'],'attempts':reports,'bytes':len(binary),'gzipBytes':(ASSET/'control-sts-development.bin.gz').stat().st_size,'binarySHA256':sha(ASSET/'control-sts-development.bin'),'gzipSHA256':sha(ASSET/'control-sts-development.bin.gz')}
(REPO/'docs/control-sts-development-provenance.json').write_text(json.dumps(report,indent=2)+'\n');print({k:report[k]for k in ['bytes','gzipBytes']})
