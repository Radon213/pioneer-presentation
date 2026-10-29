// Presentation-only synchronized phase; not a fitted spring law or a solver replay.
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export function conceptualContactResponse(value){
 const u=clamp(value),v=Math.max(0,(u-.55)/.45);
 return {torque:u<=.55?.18*u/.55:.18+.82*(.45*v+.55*v*v),slope:u<.55?.18/.55:.82/.45*(.45+1.10*v)};
}
export function sampleSpringExplanationMotion(timeSec=0,build=1){
 const phase=((Number(timeSec)||0)%10+10)%10;
 const load=.5-.5*Math.cos(phase*Math.PI/5);
 const merge=smooth((phase-1.8)/3.6)*(1-smooth((phase-8.4)/1.6));
 const contact=load>=.55;
 return {timeSec:Number(timeSec)||0,phase,load,merge,contact,contactFraction:.55,
  lowDeflectionDeg:30*load,highDeflectionDeg:8*load,weakDeflectionDeg:54*load,
  normalizedTorque:build===4?conceptualContactResponse(load).torque:load,
  classification:'illustrative synchronized elastic response'};
}
