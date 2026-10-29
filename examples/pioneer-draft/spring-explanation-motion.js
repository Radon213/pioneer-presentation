// Presentation-only synchronized phase; not a fitted spring law or a solver replay.
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export function conceptualContactResponse(value){
 const u=clamp(value),v=Math.max(0,(u-.55)/.45);
 return {torque:u<=.55?.18*u/.55:.18+.82*(.45*v+.55*v*v),slope:u<.55?.18/.55:.82/.45*(.45+1.10*v)};
}
/** Dimensionless teaching model: the contact spring changes from much softer
 * than its series partner to much stiffer. Not a fitted native CAD/FEA law. */
export function seriesRegimeAtLoad(value){
 const u=clamp(value),tau=u<=.5?.18*smooth(u*2):.18+.82*smooth((u-.5)*2),contact=u>=.5;
 const weak=tau<=.18?4*tau:.72+.04*(tau-.18),strong=.4*tau;
 return {tau,weak,strong,total:weak+strong,contact,k1:contact?25:.25,k2:2.5};
}
export function sampleSpringExplanationMotion(timeSec=0,build=1){
 const phase=((Number(timeSec)||0)%10+10)%10;
 const load=.5-.5*Math.cos(phase*Math.PI/5);
 const merge=smooth((phase-1.8)/3.6)*(1-smooth((phase-8.4)/1.6));
 const contact=load>=.55;
 if(build===3){const series=seriesRegimeAtLoad(load);return {timeSec:Number(timeSec)||0,phase,load,merge,series,contact:series.contact,lowDeflectionDeg:35*series.weak,highDeflectionDeg:35*series.strong,weakDeflectionDeg:35*series.weak,normalizedTorque:series.tau,classification:'illustrative series stiffness dominance switch at contact'};}
 return {timeSec:Number(timeSec)||0,phase,load,merge,contact,contactFraction:.55,
  // Deliberately amplified only for the gap-closure teaching view. The intact
  // CAD is warped continuously; this is not a predicted contact rotation.
  lowDeflectionDeg:30*load,highDeflectionDeg:8*load,weakDeflectionDeg:(build===4?160:54)*load,
  normalizedTorque:build===4?conceptualContactResponse(load).torque:load,
  classification:build===4?'illustrative amplified winding; contact is not a solved field':'illustrative synchronized elastic response'};
}
