import {ARCHIVED_SPRING_CURVES} from './archived-spring-chart.js';

// Presentation-derived quantities. Original solver rows remain in the archive module.
// Weak/strong names follow the user's lower/upper assembly assignment; neither CSV
// contains a hash/version linking it to the current native CAD pair.
const finitePoints=series=>series.data.filter(p=>Number.isFinite(p.angle_deg)&&Number.isFinite(p.torque_Nm)).map(p=>({angleDeg:p.angle_deg,torqueNm:p.torque_Nm,sourceRow:p.source_row}));
export const SOURCE_WEAK=finitePoints(ARCHIVED_SPRING_CURVES.series[0]);
export const SOURCE_STRONG=finitePoints(ARCHIVED_SPRING_CURVES.series[1]);
export const COMPARISON_AXES=Object.freeze({angleMin:0,angleMax:120,angleStep:30,torqueMin:0,torqueMax:20,torqueStep:5});

// The strong-table loading branch is monotone. Its inverse is interpolated only
// inside the recorded torque domain. No synthetic origin or extrapolation.
export function strongAngleAtTorque(torqueNm){
  if(!Number.isFinite(torqueNm)||torqueNm<SOURCE_STRONG[0].torqueNm||torqueNm>SOURCE_STRONG.at(-1).torqueNm)return null;
  for(let i=1;i<SOURCE_STRONG.length;i++){
    const a=SOURCE_STRONG[i-1],b=SOURCE_STRONG[i];
    if(torqueNm<=b.torqueNm){const u=(torqueNm-a.torqueNm)/(b.torqueNm-a.torqueNm);return a.angleDeg+(b.angleDeg-a.angleDeg)*u;}
  }
  return SOURCE_STRONG.at(-1).angleDeg;
}

// Preserve the weak table's source order, including its falling-torque segment.
// Inverting it globally would erase a branch. Instead parameterise by its angle
// and add the other spring's deflection at the same recorded/interpolated torque.
const torqueMin=Math.max(SOURCE_WEAK[0].torqueNm,SOURCE_STRONG[0].torqueNm);
const torqueMax=Math.min(Math.max(...SOURCE_WEAK.map(p=>p.torqueNm)),SOURCE_STRONG.at(-1).torqueNm);
const within=torque=>torque>=torqueMin&&torque<=torqueMax;
const compositionPoints=[];
function addComposedPoint(weakAngleDeg,torqueNm,sourceRow=null){
  const strongAngleDeg=strongAngleAtTorque(torqueNm);
  if(strongAngleDeg===null)return;
  const p={angleDeg:weakAngleDeg+strongAngleDeg,torqueNm,weakAngleDeg,strongAngleDeg,sourceRow};
  const prev=compositionPoints.at(-1);
  if(!prev||Math.abs(prev.weakAngleDeg-weakAngleDeg)>1e-10||Math.abs(prev.torqueNm-torqueNm)>1e-10)compositionPoints.push(p);
}
for(let i=0;i<SOURCE_WEAK.length;i++){
  const a=SOURCE_WEAK[i];
  if(within(a.torqueNm))addComposedPoint(a.angleDeg,a.torqueNm,a.sourceRow);
  const b=SOURCE_WEAK[i+1];if(!b)continue;
  const cuts=[torqueMin,torqueMax].map(t=>({t,u:(t-a.torqueNm)/(b.torqueNm-a.torqueNm)})).filter(p=>p.u>0&&p.u<1).sort((p,q)=>p.u-q.u);
  for(const {t,u} of cuts)addComposedPoint(a.angleDeg+(b.angleDeg-a.angleDeg)*u,t);
}
export const SERIES_COMPOSITION=Object.freeze({
  points:compositionPoints,torqueMin,torqueMax,
  angleMin:Math.min(...compositionPoints.map(p=>p.angleDeg)),angleMax:Math.max(...compositionPoints.map(p=>p.angleDeg)),
  method:'Equal-torque, source-ordered deflection addition; piecewise-linear interpolation within both tables only.',
  scope:'Derived series estimate over the common recorded torque range; not a current-CAD calibration or new finite-element solution.',
});

// Ordinary least squares with a free intercept, on explicit local branches.
// A secant from (0,0) would invent an unrecorded datum and obscure local stiffness.
export function fitLocalStiffness(points,angleMin,angleMax){
  const selected=points.filter(p=>p.angleDeg>=angleMin&&p.angleDeg<=angleMax);
  if(selected.length<2)return null;
  const meanAngle=selected.reduce((s,p)=>s+p.angleDeg,0)/selected.length;
  const meanTorque=selected.reduce((s,p)=>s+p.torqueNm,0)/selected.length;
  const denominator=selected.reduce((s,p)=>s+(p.angleDeg-meanAngle)**2,0);
  if(!denominator)return null;
  const kNmPerDeg=selected.reduce((s,p)=>s+(p.angleDeg-meanAngle)*(p.torqueNm-meanTorque),0)/denominator;
  const interceptNm=meanTorque-kNmPerDeg*meanAngle;
  const totalVariance=selected.reduce((s,p)=>s+(p.torqueNm-meanTorque)**2,0);
  const residualVariance=selected.reduce((s,p)=>s+(p.torqueNm-(kNmPerDeg*p.angleDeg+interceptNm))**2,0);
  return {kNmPerDeg,kNmPerRad:kNmPerDeg*180/Math.PI,interceptNm,
    angleRange:[selected[0].angleDeg,selected.at(-1).angleDeg],torqueRange:[Math.min(...selected.map(p=>p.torqueNm)),Math.max(...selected.map(p=>p.torqueNm))],
    count:selected.length,rSquared:totalVariance?1-residualVariance/totalVariance:1,
    endpoints:[selected[0].angleDeg,selected.at(-1).angleDeg].map(angleDeg=>({angleDeg,torqueNm:kNmPerDeg*angleDeg+interceptNm}))};
}
const seriesLow=compositionPoints.filter(p=>p.weakAngleDeg>=33.826&&p.weakAngleDeg<=59.007);
const seriesHigh=compositionPoints.filter(p=>p.weakAngleDeg>=65.444);
export const SPRING_STIFFNESS=Object.freeze({
  weak:{low:fitLocalStiffness(SOURCE_WEAK,33.826,59.007),high:fitLocalStiffness(SOURCE_WEAK,81.627,120)},
  strong:{low:fitLocalStiffness(SOURCE_STRONG,6.3844,22.616),high:fitLocalStiffness(SOURCE_STRONG,34.149,45)},
  series:{low:fitLocalStiffness(seriesLow,-Infinity,Infinity),high:fitLocalStiffness(seriesHigh,-Infinity,Infinity),
    scope:'Local fits within common torque range only; the full high-torque composite stiffness is unavailable.'},
});
export const SPRING_COMPARISON=Object.freeze({weak:SOURCE_WEAK,strong:SOURCE_STRONG,axes:COMPARISON_AXES,composition:SERIES_COMPOSITION,stiffness:SPRING_STIFFNESS});

// Optional, explicitly model-based completion for the presentation. Extend the
// upper unit using its measured terminal local slope, anchored continuously at
// the last recorded point. This assumption is NOT extra solver output.
const terminalStrong=SOURCE_STRONG.at(-1);
const terminalSlope=SPRING_STIFFNESS.strong.high.kNmPerDeg;
export function upperLinearModelAngleAtTorque(torqueNm){
  if(!Number.isFinite(torqueNm)||torqueNm<SOURCE_STRONG[0].torqueNm)return null;
  return torqueNm<=terminalStrong.torqueNm?strongAngleAtTorque(torqueNm):terminalStrong.angleDeg+(torqueNm-terminalStrong.torqueNm)/terminalSlope;
}
const estimatedSource=SOURCE_WEAK.flatMap((p,i)=>{
  const next=SOURCE_WEAK[i+1],out=[p];
  if(next&&(p.torqueNm-terminalStrong.torqueNm)*(next.torqueNm-terminalStrong.torqueNm)<0){
    const u=(terminalStrong.torqueNm-p.torqueNm)/(next.torqueNm-p.torqueNm);
    out.push({angleDeg:p.angleDeg+(next.angleDeg-p.angleDeg)*u,torqueNm:terminalStrong.torqueNm,sourceRow:null});
  }
  return out;
});
const estimatedPoints=estimatedSource.map(p=>({angleDeg:p.angleDeg+upperLinearModelAngleAtTorque(p.torqueNm),torqueNm:p.torqueNm,weakAngleDeg:p.angleDeg,strongAngleDeg:upperLinearModelAngleAtTorque(p.torqueNm),sourceRow:p.sourceRow,extrapolated:p.torqueNm>terminalStrong.torqueNm}));
const approximateHigh=estimatedPoints.filter(p=>p.weakAngleDeg>=81.627);
export const SERIES_LINEAR_ESTIMATE=Object.freeze({
  points:estimatedPoints,
  measuredPoints:estimatedPoints.filter(p=>!p.extrapolated),
  extrapolatedPoints:estimatedPoints.filter((p,i)=>p.extrapolated||estimatedPoints[i+1]?.extrapolated),
  axes:{angleMin:0,angleMax:120,angleStep:30,torqueMin:0,torqueMax:20,torqueStep:5},
  measuredTorqueMax:terminalStrong.torqueNm,
  approximationStart:estimatedPoints.find(p=>Math.abs(p.torqueNm-terminalStrong.torqueNm)<1e-12),
  upperSlopeNmPerDeg:terminalSlope,
  stiffness:{low:SPRING_STIFFNESS.series.low,high:fitLocalStiffness(approximateHigh,-Infinity,Infinity)},
  label:'Series estimate · linear upper-unit approximation',
  assumption:'Beyond 1.0921 N·m, the upper unit retains its terminal local stiffness, anchored at 45°. Dashed continuation is an analytical assumption, not additional FEA.',
  scope:'The complete curve is an illustrative derived model; its large inferred angles are not verified physical travel or a calibration of the current assembly.',
});
