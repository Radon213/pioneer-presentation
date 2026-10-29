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

/** Time-weighted mean of the piecewise-linear saved signal. The prefix integral
 * makes the window depend on elapsed seconds, including nonuniform timestamps. */
function averageInTime(time,values,windowSec,causal){
 if(!values||values.length!==time.length)return values;
 const n=time.length;if(n<2||windowSec<=0)return Array.from(values);
 const prefix=new Float64Array(n);
 for(let i=1;i<n;i++)prefix[i]=prefix[i-1]+(time[i]-time[i-1])*(values[i]+values[i-1])*.5;
 function integral(t){
  if(t<=time[0])return 0;if(t>=time[n-1])return prefix[n-1];
  let lo=0,hi=n-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(time[mid]<=t)lo=mid;else hi=mid;}
  const dt=t-time[lo],slope=(values[hi]-values[lo])/(time[hi]-time[lo]);
  return prefix[lo]+values[lo]*dt+.5*slope*dt*dt;
 }
 return time.map((t,i)=>{
  const a=Math.max(time[0],t-windowSec*(causal?1:.5)),b=Math.min(time[n-1],t+(causal?0:windowSec*.5));
  return b>a?(integral(b)-integral(a))/(b-a):values[i];
 });
}

/** Display-only readability filter; never a replacement for recorded physics.
 * Torque curves use a centred mean; the power bar uses a trailing causal mean.
 * Original samples stay untouched. Raw peak and raw limit events remain separate
 * so smoothing cannot erase the source failure from the displayed conclusion. */
export function createWalkingDisplaySeries(raw,{torqueWindowSec=.16,powerWindowSec=.3}={}){
 const time=raw?.timeSec;if(!Array.isArray(time)||!time.length)throw Error('Walking display smoothing requires saved timestamps.');
 if(!time.every((t,i)=>Number.isFinite(t)&&(!i||t>time[i-1])))throw Error('Walking timestamps must be finite and strictly increasing.');
 const torqueWindow=Math.max(0,Number(torqueWindowSec)||0),powerWindow=Math.max(0,Number(powerWindowSec)||0);
 const display={...raw};for(const [key,value]of Object.entries(raw))if(Array.isArray(value))display[key]=value.slice();
 for(const key of ['requestedTorqueNm','appliedTorqueNm','motorPowerW'])if(raw[key]?.length!==time.length||!raw[key].every(Number.isFinite))throw Error(`Walking display smoothing requires finite ${key} samples.`);
 display.requestedTorqueNm=averageInTime(time,raw.requestedTorqueNm,torqueWindow,false);
 display.appliedTorqueNm=averageInTime(time,raw.appliedTorqueNm,torqueWindow,false);
 display.motorPowerW=averageInTime(time,raw.motorPowerW,powerWindow,true);
 let peakIndex=0;for(let i=1;i<time.length;i++)if(raw.motorPowerW[i]>raw.motorPowerW[peakIndex])peakIndex=i;
 const limit=Number(raw.powerLimitW),events=[];let event=null;
 for(let i=0;i<time.length;i++){
  if(raw.motorPowerW[i]>limit){
   if(!event)event={startIndex:i,endIndex:i,startTimeSec:time[i],endTimeSec:time[i],peakPowerW:raw.motorPowerW[i],peakTimeSec:time[i]};
   event.endIndex=i;event.endTimeSec=time[i];if(raw.motorPowerW[i]>event.peakPowerW){event.peakPowerW=raw.motorPowerW[i];event.peakTimeSec=time[i];}
  }else if(event){events.push(event);event=null;}
 }
 if(event)events.push(event);
 display.rawPeak={motorPowerW:raw.motorPowerW[peakIndex],timeSec:time[peakIndex],sourceIndex:peakIndex,powerLimitW:limit,exceedsLimit:raw.motorPowerW[peakIndex]>limit};
 display.rawPowerLimitEvents=events;
 display.displaySmoothing={classification:'DISPLAY_ONLY_TIME_AVERAGE',torqueWindowSec:torqueWindow,torqueAlignment:'centred',powerWindowSec:powerWindow,powerAlignment:'trailing causal',sourceSamplesModified:false,rawPeakAndLimitEventsPreserved:true};
 return display;
}
