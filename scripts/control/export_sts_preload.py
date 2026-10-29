"""Export the recorded 6 Nm-target teacher example by read-only kinematics.

The selected student replay stays untouched. This asset is a separate preload
control example; source controller identity is preserved in provenance.
"""
from pathlib import Path
import gzip, hashlib, json, struct
import numpy as np
import mujoco
ROOT=Path('/home/arl/Documents/Pioneer')
REPO=ROOT/'deploy/pioneer-presentation-pages-20261029'
ASSET=REPO/'examples/pioneer-draft/assets'
BASE=ROOT/'work/myoassist22-aakj-sts-teacher-student-2026-10-28'
FOLDER=BASE/'p0_causal_execution_r1/p24_teacher_incumbent_confirmation_r1'
TRACE=FOLDER/'actual_trace.npz'
XML=BASE/'runtime_p30_physics_student_r1/path48_15/chair22.xml'
WORLD=6
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
def torque_law(degrees):
 a=np.abs(degrees)
 return np.sign(degrees)*6*(.23577*a/101.7+.76423*np.expm1(.20960*a)/np.expm1(.20960*101.7))
selected=decode(ASSET/'control-sts.bin')
config=json.loads((FOLDER/'CANDIDATE_POLICY_CONFIG.json').read_text())
audit=json.loads((FOLDER/'independent_dwell_audit.json').read_text())
assert config['model_xml_sha256']==sha(XML)==selected['provenance']['sourceModelSHA256']
assert audit['per_world_success'][WORLD] and audit['per_world_full_duration'][WORLD]
assert audit['all_hardware_gates_passed']
protected=[TRACE,XML,FOLDER/'recording.json',FOLDER/'initial_fixture.npz',FOLDER/'CANDIDATE_POLICY_CONFIG.json',FOLDER/'independent_dwell_audit.json',ASSET/'control-sts.bin',ASSET/'control-sts.bin.gz']
before={str(p):sha(p)for p in protected}
trace=np.load(TRACE);fixture=np.load(FOLDER/'initial_fixture.npz')
m=mujoco.MjModel.from_xml_path(str(XML));reference=mujoco.MjModel.from_xml_path(selected['provenance']['sourceModel']);d=mujoco.MjData(m)
# Refuse every dynamics/policy route. Only rigid positions and tendon wrapping.
for name in ['mj_step','mj_step1','mj_step2','mj_forward','mj_inverse','mj_fwdPosition','mj_fwdVelocity','mj_fwdActuation','mj_fwdAcceleration']:
 setattr(mujoco,name,lambda *args,_name=name,**kwargs:(_ for _ in ()).throw(RuntimeError('Forbidden dynamics: '+_name)))
assert m.nq==trace['qpos'].shape[2]
compat=[];maxdiff=0
for g in selected['geoms']:
 if g.get('nativeRebound'):
  a=m.body(g['sourceBodyName']).id;b=reference.body(g['sourceBodyName']).id
  assert np.array_equal(m.body_pos[a],reference.body_pos[b]) and np.array_equal(m.body_quat[a],reference.body_quat[b])
  assert int(m.body_parentid[a])==int(reference.body_parentid[b])
  compat.append({'name':g['name'],'frame':'native source body','localTransformsEqual':True});continue
 a=m.geom(g['name']).id;b=reference.geom(g['name']).id
 assert int(m.geom_type[a])==int(reference.geom_type[b])
 assert np.array_equal(m.geom_pos[a],reference.geom_pos[b]) and np.array_equal(m.geom_quat[a],reference.geom_quat[b])
 if int(m.geom_type[a])==7:
  x=int(m.geom_dataid[a]);y=int(reference.geom_dataid[b]);xn=int(m.mesh_vertnum[x]);yn=int(reference.mesh_vertnum[y]);assert xn==yn
  xv=m.mesh_vert[int(m.mesh_vertadr[x]):int(m.mesh_vertadr[x])+xn];yv=reference.mesh_vert[int(reference.mesh_vertadr[y]):int(reference.mesh_vertadr[y])+yn]
  err=float(np.max(np.abs(xv-yv)));maxdiff=max(maxdiff,err);assert err<2e-7
  assert np.array_equal(m.mesh_pos[x],reference.mesh_pos[y]) and np.array_equal(m.mesh_quat[x],reference.mesh_quat[y])
  nf=int(m.mesh_facenum[x]);assert nf==int(reference.mesh_facenum[y]);assert np.array_equal(m.mesh_face[int(m.mesh_faceadr[x]):int(m.mesh_faceadr[x])+nf],reference.mesh_face[int(reference.mesh_faceadr[y]):int(reference.mesh_faceadr[y])+nf])
 compat.append({'name':g['name'],'frame':'source geom','localTransformsEqual':True})
qidx=lambda name:int(m.joint(name).qposadr[0])
drive=qidx('aakj_drive_output_angle');out=qidx('aakj_revolute_5');knee=qidx('knee_angle_l')
left=1
full_delta=np.degrees(trace['qpos'][:,WORLD,drive]-trace['qpos'][:,WORLD,out])
full_torque=trace['device_spring'][:,WORLD,left]
residual=float(np.max(np.abs(torque_law(full_delta)-full_torque)))
assert residual<1e-4,residual
assert trace['active_before'][:,WORLD].all() and not trace['reason'][:,WORLD].any()
peak_id=int(np.argmax(np.abs(full_torque)))
# Add the exact peak from the 100 Hz record, even when off the 25 Hz grid.
ids=sorted(set([-1]+list(range(3,len(full_torque),4))+[len(full_torque)-1,peak_id]))
def quat(mat):
 q=np.empty(4);mujoco.mju_mat2Quat(q,np.asarray(mat));return q[[1,2,3,0]]
frames=[]
for i in ids:
 initial=i==-1;ti=max(i,0)
 d.qpos[:]=fixture['qpos'][WORLD] if initial else trace['qpos'][i,WORLD]
 mujoco.mj_kinematics(m,d);mujoco.mj_tendon(m,d)
 p=[];q=[]
 for g in selected['geoms']:
  if g.get('nativeRebound'):j=m.body(g['sourceBodyName']).id;p.extend(d.xpos[j]);q.extend(quat(d.xmat[j]))
  else:j=m.geom(g['name']).id;p.extend(d.geom_xpos[j]);q.extend(quat(d.geom_xmat[j]))
 tendons=[]
 for tendon in selected['tendons']:
  j=m.tendon(tendon['name']).id;adr=int(d.ten_wrapadr[j]);n=int(d.ten_wrapnum[j]);tendons.append(np.asarray(d.wrap_xpos).reshape(-1,3)[adr:adr+n].astype('<f4').reshape(-1))
 attachment={}
 for side,limb,pre in [('left','l','aakj_'),('right','r','aakj_r_')]:
  joint=m.joint(pre+'revolute_3').id;a={'knee':d.xanchor[joint].tolist(),'axis':d.xaxis[joint].tolist(),'nativeFlexionRad':float(d.qpos[qidx('knee_angle_'+limb)])}
  for bone in ['femur','tibia']:
   j=m.body(bone+'_'+limb).id;a[bone]={'p':d.xpos[j].tolist(),'q':quat(d.xmat[j]).tolist()}
  attachment[side]=a
 t=0. if initial else float(trace['time'][i]);delta=float(np.degrees(d.qpos[drive]-d.qpos[out]));applied=float(trace['device_applied'][ti,WORLD,left]);velocity=float((fixture['qvel'][WORLD] if initial else trace['qvel'][i,WORLD])[drive])
 values={'timeSec':t,'kneeAngleDeg':float(np.degrees(d.qpos[knee])),'springDeflectionDeg':delta,'springTorqueNm':float(trace['device_spring'][ti,WORLD,left]),'motorPowerW':applied*velocity,'requestedTorqueNm':float(trace['device_request'][ti,WORLD,left]),'appliedTorqueNm':applied,'sourceRecordedPowerPeakW':float(trace['device_stats'][ti,WORLD,left,2]),'phaseLabel':'Seated' if t<.94 else ('Rising' if t<4.79 else 'Standing'),'preloadControlExample':True}
 frames.append({'t':t,'sourceIndex':i,'p':np.asarray(p,dtype='<f4'),'q':np.asarray(q,dtype='<f4'),'tendons':tendons,'attachment':attachment,'values':values})
assert frames[0]['t']==0 and np.isclose(frames[-1]['t'],18)
assert all(np.isfinite(f[k]).all()for f in frames for k in ['p','q'])
assert max(abs(np.linalg.norm(f['q'].reshape(-1,4),axis=1)-1).max()for f in frames)<2e-7
recorded_max=float(np.max(np.abs(full_torque)))
assert max(abs(f['values']['springTorqueNm'])for f in frames)==recorded_max
provenance={
 'classification':'ACTUAL_RECORDED_MODEL_BASED_TEACHER_PRELOAD_EXAMPLE',
 'sourceTrace':str(TRACE),'sourceTraceSHA256':sha(TRACE),'sourceModel':str(XML),'sourceModelSHA256':sha(XML),'sourceWorld':WORLD,
 'controller':'Explicit model-based assistance teacher with 6 Nm spring-torque target; frozen human muscle policy; not the learned limited-sensing student',
 'sourceControllerMode':'teacher/preload target controller','teacherTargetTorqueNm':6,
 'durationSeconds':18,'frameCount':len(frames),'sourceSampleHz':100,'displaySampleHz':25,'exactPeakSourceIndex':peak_id,'exactPeakTimeSec':float(trace['time'][peak_id]),'peakSpringTorqueNm':recorded_max,'secondsAbove5Nm':float(np.sum(np.abs(full_torque)>5)*.01),
 'taskSuccess':True,'completeDuration':True,'finalQuietStandSeconds':audit['final_quiet_stand_s'][WORLD],'allRecordedHardwareGatesPassed':audit['all_hardware_gates_passed'],'qualified':False,'diagnosticOnly':True,'pendingAudits':config['pending_audits'],
 'physicsSteps':0,'forwardDynamicsCalls':0,'offlineKinematicsCalls':len(frames),'offlineTendonWrapCalls':len(frames),'mujocoVersion':mujoco.__version__,'poseRepair':False,
 'sharedGeometrySource':'control-sts.bin','sharedGeometrySHA256':before[str(ASSET/'control-sts.bin')],'sharedMeshMaxDifferenceM':maxdiff,'sharedGeometryNameAndLocalTransformVerified':True,'sharedNativeOwnershipCorrections':'Reuse the exact selected STS native subtree ownership; body poses come from this source trace, not gait or student poses.',
 'telemetrySide':'left','motorPowerDefinition':selected['provenance']['motorPowerDefinition'],'telemetryAlignment':'POST-action qpos/qvel and same saved held control row. Time zero uses the stored initial fixture and repeats the first recorded control; no dynamics step.',
 'simulationSpringLaw':'sign(delta)*6*(0.23577*abs(delta)/101.7+0.76423*expm1(0.20960*abs(delta))/expm1(0.20960*101.7)); delta in degrees',
 'maximumSpringLawResidualNm':residual,'physicalSpringCalibration':False,
 'evidenceLimit':'Nominal successful engineering simulation, not a clinical result, robustness trial, student result, or proof of assistance benefit.',
 'searchSummary':{'selectedStudentPeakNm':3.7188191413879395,'largestAuditedSourcePeakNm':5.494632244110107,'largestSource':'p15_standing_com_screen_r1/world6','selectedSourceReason':'Explicit teacher incumbent confirmation; 0.0063 Nm below prior screen maximum. No audited successful stored source at or above 6 Nm was found.'}
}
result={'schema':'pioneer-control-sts-preload-v1','frames':frames,'provenance':provenance}
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
(ASSET/'control-sts-preload.bin').write_bytes(binary);(ASSET/'control-sts-preload.bin.gz').write_bytes(gzip.compress(binary,compresslevel=9,mtime=0))
assert all(sha(p)==v for p,v in before.items())
report={**provenance,'protectedSourceHashes':before,'allProtectedSourcesUnchanged':True,'geometryCompatibility':compat,'bytes':len(binary),'gzipBytes':(ASSET/'control-sts-preload.bin.gz').stat().st_size,'binarySHA256':sha(ASSET/'control-sts-preload.bin'),'gzipSHA256':sha(ASSET/'control-sts-preload.bin.gz')}
(REPO/'docs/control-sts-preload-provenance.json').write_text(json.dumps(report,indent=2)+'\n')
print({k:report[k]for k in ['frameCount','bytes','gzipBytes','peakSpringTorqueNm','secondsAbove5Nm','maximumSpringLawResidualNm','sharedMeshMaxDifferenceM','allProtectedSourcesUnchanged']})
