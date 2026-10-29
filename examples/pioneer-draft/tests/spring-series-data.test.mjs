import test from 'node:test';
import assert from 'node:assert/strict';
import {ARCHIVED_SPRING_CURVES} from '../archived-spring-chart.js';
import {SOURCE_WEAK,SOURCE_STRONG,COMPARISON_AXES,SERIES_COMPOSITION,SPRING_STIFFNESS,SERIES_LINEAR_ESTIMATE,strongAngleAtTorque,upperLinearModelAngleAtTorque} from '../spring-series-data.js';
const near=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<tol,`${a} vs ${b}`);

test('source comparison retains every finite original point in order on common physical axes',()=>{
  for(const [points,source] of [[SOURCE_WEAK,ARCHIVED_SPRING_CURVES.series[0]],[SOURCE_STRONG,ARCHIVED_SPRING_CURVES.series[1]]]){
    const original=source.data.filter(p=>Number.isFinite(p.angle_deg)&&Number.isFinite(p.torque_Nm));
    assert.equal(points.length,original.length);
    original.forEach((p,i)=>{assert.equal(points[i].angleDeg,p.angle_deg);assert.equal(points[i].torqueNm,p.torque_Nm);assert.ok(p.angle_deg<=COMPARISON_AXES.angleMax);assert.ok(p.torque_Nm<=COMPARISON_AXES.torqueMax);});
  }
  assert.ok(SOURCE_WEAK.some((p,i)=>i&&p.torqueNm<SOURCE_WEAK[i-1].torqueNm));
});
test('source-only series estimate adds deflections at equal torque and preserves the nonmonotone branch',()=>{
  near(SERIES_COMPOSITION.torqueMax,1.0921);
  for(const p of SERIES_COMPOSITION.points){near(p.angleDeg,p.weakAngleDeg+p.strongAngleDeg);near(p.strongAngleDeg,strongAngleAtTorque(p.torqueNm));assert.ok(p.torqueNm>=SERIES_COMPOSITION.torqueMin&&p.torqueNm<=SERIES_COMPOSITION.torqueMax);}
  assert.ok(SERIES_COMPOSITION.points.some((p,i)=>i&&p.torqueNm<SERIES_COMPOSITION.points[i-1].torqueNm));
  assert.equal(strongAngleAtTorque(0),null);
  assert.equal(strongAngleAtTorque(1.0922),null);
  assert.equal(strongAngleAtTorque(NaN),null);
  for(const p of SOURCE_STRONG)near(strongAngleAtTorque(p.torqueNm),p.angleDeg);
});
test('reported local stiffness has explicit branch ranges and converts Nm/degree to Nm/radian',()=>{
  for(const spring of [SPRING_STIFFNESS.weak,SPRING_STIFFNESS.strong,SPRING_STIFFNESS.series])for(const fit of [spring.low,spring.high]){
    near(fit.kNmPerRad,fit.kNmPerDeg*180/Math.PI);assert.ok(fit.count>=4);assert.ok(fit.angleRange[1]>fit.angleRange[0]);assert.ok(fit.rSquared>.99);
  }
  assert.ok(SPRING_STIFFNESS.weak.high.kNmPerDeg>20*SPRING_STIFFNESS.weak.low.kNmPerDeg);
});
test('optional analytical continuation is continuous, explicitly marked, and separate from source-only data',()=>{
  near(upperLinearModelAngleAtTorque(1.0921),45);
  near(upperLinearModelAngleAtTorque(1.0921+SPRING_STIFFNESS.strong.high.kNmPerDeg),46);
  assert.ok(SERIES_LINEAR_ESTIMATE.points.every(p=>p.extrapolated===(p.torqueNm>1.0921)));
  assert.ok(SERIES_LINEAR_ESTIMATE.points.at(-1).angleDeg>700);
  assert.equal(SERIES_COMPOSITION.points.at(-1).torqueNm,1.0921);
  assert.match(SERIES_LINEAR_ESTIMATE.assumption,/not additional FEA/);
});
