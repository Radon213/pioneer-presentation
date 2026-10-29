import {ARCHIVED_SPRING_CURVES} from './archived-spring-chart.js';
// Retain the supplied ANSYS loading points without fitting or smoothing.
export const springResponsePoints=ARCHIVED_SPRING_CURVES.series[0].data.filter(p=>Number.isFinite(p.angle_deg)&&Number.isFinite(p.torque_Nm)).map(p=>({angleDeg:p.angle_deg,torqueNm:p.torque_Nm}));
export function responseAtAngle(angle){
 const first=springResponsePoints[0],last=springResponsePoints.at(-1);
 if(!Number.isFinite(angle)||angle<first.angleDeg||angle>last.angleDeg)return null;
 for(let i=1;i<springResponsePoints.length;i++){const a=springResponsePoints[i-1],b=springResponsePoints[i];if(angle<=b.angleDeg){const u=(angle-a.angleDeg)/(b.angleDeg-a.angleDeg);return a.torqueNm+(b.torqueNm-a.torqueNm)*u;}}
 return last.torqueNm;
}
