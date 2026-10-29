"""Read-only export of saved teaching curves. Never calls a simulator or policy."""
from pathlib import Path
import hashlib,json,numpy as np
R=Path('/home/arl/Documents/Pioneer');P=R/'deploy/pioneer-presentation-pages-20261029';A=P/'examples/pioneer-draft/assets';S=R/'work/myoassist22-aakj-sts-teacher-student-2026-10-28';W=R/'work/aakj-direct-torque-2026-10-27'
paths=[S/'p32_student_PPO_physics_pilot_r1/selected_best_checkpoint_audit/actual_trace.npz',S/'p0_causal_execution_r1/p24_teacher_incumbent_confirmation_r1/actual_trace.npz',S/'p0_causal_execution_r1/p22_teacher_timing_search_r1/actual_trace.npz',S/'p0_causal_execution_r1/p22_teacher_timing_search_r1/COMPARISON.json',S/'p30_physics_student_distillation_r1/progress.jsonl',W/'tracking_teacher_r1/final30_moments/moments.npz',W/'tracking_teacher_r1/final30/rollouts.npz',W/'fixed_gait_torque_oracle_r1/optimal_profile_left.csv',W/'fixed_gait_torque_oracle_r1/real480_r4.json']
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest();before={str(p):sha(p)for p in paths};rows=lambda a:np.asarray(a).round(7).tolist()
student=np.load(paths[0]);teacher=np.load(paths[1]);screen=np.load(paths[2]);comp=json.loads(paths[3].read_text());time=student['time'];idx=np.flatnonzero(time<=8)[::2]
# Both traces use nominal starts, identical model hashes and four-Nm targets;
# distinct free executions are not called a same-state controller-error test.
sts={'timeSec':rows(time[idx]),'teacherTorqueNm':rows(teacher['device_spring'][idx,4,1]),'studentTorqueNm':rows(student['device_spring'][idx,4,1]),'coordinate':'Left spring shaft torque; NOT anatomical knee torque','teacherWorld':4,'studentWorld':4,'independentNominalRuns':True,'targetTorqueNm':4,'sourceTeacher':str(paths[1]),'sourceStudent':str(paths[0])}
stsPreload6={'timeSec':rows(time[idx]),'torqueNm':rows(teacher['device_spring'][idx,6,1]),'coordinate':'Left spring shaft torque; NOT anatomical knee torque','targetTorqueNm':6,'peakTorqueNm':float(np.max(teacher['device_spring'][:,6,1])),'controller':'full-state teacher','teacherWorld':6,'source':str(paths[1])}
candidates=[]
for r in comp['rows'][2:]:
 w=r['worlds'][0];candidates.append({'label':r['label'],'targetNm':r['T'],'startSec':r['start'],'timeSec':rows(time[idx]),'torqueNm':rows(screen['device_spring'][idx,w,1]),'nominalSuccess':r['successes']==2,'activationCost':r['mean_raw']})
loss=[]
for line in paths[4].read_text().splitlines():
 d=json.loads(line);loss.append(d)
m=np.load(paths[5]);raw=np.load(paths[6]);t=m['time_s'];mask=(t>=20)&(t<=28);ti=t[mask]
walk={'timeSec':rows(ti),'teacherKneeTorqueNm':rows(m['sea'][mask,4,1]),'studentKneeTorqueNm':rows(m['sea'][mask,6,1]),'studentMuscleTorqueNm':rows(m['active'][mask,6,1]),'coordinate':'Left knee-equivalent moment, source full-loop constrained virtual-work projection','teacherWorld':4,'studentWorld':6,'sourceSampleHz':50,'sourceMoments':str(paths[5]),'independentFreeRuns':True,'noTimeShiftOrAmplitudeGain':True,'nominalDurationSeconds':30,'matchedSpeedQualified':False,'sourceStudentPoseWindowSeconds':[20.01,27.99]}
# Retain a phase-aligned mean only with its explicit physical contact alignment.
phase=np.linspace(0,1,201);means={}
for name,w in [('teacher',4),('student',6)]:
 grf=m['vertical_grf'][:,w,1];onsets=np.flatnonzero((grf[:-1]<=20)&(grf[1:]>20))+1;curves=[]
 for lo,hi in zip(onsets[:-1],onsets[1:]):
  if t[lo]>=20 and .7<t[hi]-t[lo]<1.5 and np.all(m['alive'][lo:hi,w]):curves.append(np.interp(t[lo]+phase*(t[hi]-t[lo]),t,m['sea'][:,w,1]))
 means[name]=rows(np.mean(curves,axis=0));means[name+'Cycles']=len(curves)
walk['contactAligned']={'phasePercent':rows(phase*100),**means,'alignment':'20 N vertical GRF upward crossing; no optimized phase shift'}
opt=np.genfromtxt(paths[7],delimiter=',',names=True);oi=np.arange(0,len(opt),max(1,len(opt)//300));oref={'timeSec':rows(opt['time_s'][oi]),'kneeAssistNm':rows(opt['knee_assist_Nm'][oi]),'targetMuscleNm':rows(opt['target_active_net_knee_Nm'][oi]),'motorAngleDeg':rows(opt['motor_angle_deg'][oi]),'motorTorqueNm':rows(opt['motor_generated_equivalent_Nm'][oi]),'coordinate':'Fixed-gait offline left knee moment, not a live human response','powerLimitW':20,'driveTorqueLimitNm':8,'speedLimitRpm':45.3066587654,'voltageV':24,'nodes':480,'collocationPointsPerInterval':16,'solver':'IPOPT direct collocation','variables':'periodic C2 motor angle trajectory','objective':'integral (knee-equivalent SEA moment - fixed active net knee moment)^2 dt','globalOptimality':False}
# Preserve training statistics as their original keys rather than relabeling loss.
result={'schema':'pioneer-control-teaching-v1','sts':sts,'stsPreload6':stsPreload6,'stsSearch':{'candidates':candidates,'method':'Finite torque-amplitude and charge-start search; nominal task/hardware gates before activation-cost ranking','globalOptimality':False},'distillationProgress':loss,'walking':walk,'offlineReference':oref,'sourceHashes':before,'sourcesUnchanged':all(sha(p)==v for p,v in before.items()),'newPhysicsSteps':0}
assert result['sourcesUnchanged'];(A/'control-teaching.json').write_text(json.dumps(result,separators=(',',':')))
(P/'docs/control-teaching-provenance.json').write_text(json.dumps({k:v for k,v in result.items()if k not in ['sts','stsPreload6','walking','offlineReference','distillationProgress','stsSearch']},indent=2)+'\n')
print({'bytes':(A/'control-teaching.json').stat().st_size,'trainingKeys':list(loss[0]) if loss else [],'walkingSamples':len(ti),'searchCandidates':len(candidates)})
