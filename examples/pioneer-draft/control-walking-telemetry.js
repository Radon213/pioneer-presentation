/** Presentation interpolation only. Every knot remains an original recorded value.
 * Linear interpolation cannot overshoot a saved physical limit or hide a peak. */
export function sampleWalkingTelemetry(series,timeSec){
 const ts=series?.timeSec;if(!ts?.length)return {};
 const t=Math.max(ts[0],Math.min(ts.at(-1),Number.isFinite(timeSec)?timeSec:ts[0]));
 let lo=0,hi=ts.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(ts[mid]<=t)lo=mid;else hi=mid;}
 const f=hi===lo?0:(t-ts[lo])/(ts[hi]-ts[lo]);
 const result={timeSec:t,sourceIndices:[lo,hi],sourceMix:f};
 for(const key of ['requestedTorqueNm','appliedTorqueNm','motorPowerW','walkingSpeedMps','springTorqueNm','kneeAngleDeg','contralateralKneeAngleDeg','springDeflectionDeg','motorSpeedRpm']){
  const values=series[key];if(values?.length===ts.length)result[key]=values[lo]+(values[hi]-values[lo])*f;
 }
 return result;
}
