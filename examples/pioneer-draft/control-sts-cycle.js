/** Presentation-only scheduler for the recorded nominal stand-up trial.
 *
 * Forward playback uses the saved poses and source telemetry. The reverse leg
 * returns through those same poses only to reset the presentation: it is NOT a
 * measured or validated sit-down controller. Hide quantitative telemetry while
 * `resetting` is true and display `phaseLabel` ("Replay reset") beside the model.
 */
const PI=Math.PI;
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
const finite=(value,fallback)=>Number.isFinite(value)?value:fallback;

export function sampleSitStandCycle(elapsed,options={}){
 const sourceStart=finite(options.sourceStart,0);
 const sourceEnd=finite(options.sourceEnd,8);
 const span=sourceEnd-sourceStart;
 const forwardEase=finite(options.forwardEase,.6);
 const forwardDuration=finite(options.forwardDuration,span+forwardEase);
 const standingHold=finite(options.standingHold,1);
 const returnDuration=finite(options.returnDuration,4);
 const seatedHold=finite(options.seatedHold,1);
 if(sourceStart<0||span<=0||forwardEase<=0||forwardDuration<=0||standingHold<0||returnDuration<=0||seatedHold<0)throw new RangeError('Invalid sit-to-stand replay cycle timing.');
 const edge=Math.min(forwardEase,forwardDuration/2);
 const cycleDuration=forwardDuration+standingHold+returnDuration+seatedHold;
 const time=Math.max(0,finite(elapsed,0));
 const cycleIndex=Math.floor(time/cycleDuration);
 const cycleTime=time-cycleIndex*cycleDuration;
 const base={cycleIndex,cycleTime,cycleDuration};
 if(cycleTime<forwardDuration){
  const peakRate=span/(forwardDuration-edge);
  // Integrated raised-cosine velocity: zero velocity at the endpoints and a
  // constant source rate through the middle (1x with default timing).
  const ramp=x=>peakRate*(x/2-edge/(2*PI)*Math.sin(PI*x/edge));
  let offset,sourceRate;
  if(cycleTime<edge){offset=ramp(cycleTime);sourceRate=peakRate*(1-Math.cos(PI*cycleTime/edge))/2;}
  else if(cycleTime>forwardDuration-edge){const remaining=forwardDuration-cycleTime;offset=span-ramp(remaining);sourceRate=peakRate*(1-Math.cos(PI*remaining/edge))/2;}
  else{offset=peakRate*(cycleTime-edge/2);sourceRate=peakRate;}
  const sourceTime=clamp(sourceStart+offset,sourceStart,sourceEnd);
  return {...base,sourceTime,sourceRate,replayDirection:1,resetting:false,telemetryValid:true,segment:'forward',phaseLabel:sourceTime<.94?'Seated':sourceTime<4.79?'Rising':'Standing'};
 }
 if(cycleTime<forwardDuration+standingHold)return {...base,sourceTime:sourceEnd,sourceRate:0,replayDirection:0,resetting:false,telemetryValid:true,segment:'standing-hold',phaseLabel:'Standing'};
 const returnTime=cycleTime-forwardDuration-standingHold;
 if(returnTime<returnDuration){
  const u=clamp(returnTime/returnDuration,0,1);
  const ease=u*u*u*(10+u*(-15+6*u));
  const derivative=30*u*u*(1-u)*(1-u);
  return {...base,sourceTime:clamp(sourceEnd-span*ease,sourceStart,sourceEnd),sourceRate:-span*derivative/returnDuration,replayDirection:-1,resetting:true,telemetryValid:false,segment:'return',phaseLabel:'Replay reset'};
 }
 return {...base,sourceTime:sourceStart,sourceRate:0,replayDirection:0,resetting:true,telemetryValid:false,segment:'seated-hold',phaseLabel:'Replay reset'};
}
