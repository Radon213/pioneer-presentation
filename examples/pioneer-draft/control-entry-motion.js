// One reversible, presentation-clock envelope for the Spring → Control handoff.
const clamp=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
const smooth=x=>{const u=clamp(x);return u*u*(3-2*u);};
export function sampleControlEntry(progress=1){
 const u=clamp(progress),exit=smooth(u/.34),enter=smooth((u-.24)/.66);
 return {outgoingOpacity:1-exit,outgoingY:-24*exit,incomingOpacity:enter,incomingY:18*(1-enter)};
}
