const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
/** Inspect polyethylene first, restore the oblique camera, then insert axially. */
export function sampleSurgerySequence(value){
 const u=clamp(value),rise=(a,b)=>smooth((u-a)/(b-a));
 return {cameraRestore:rise(.32,.48),inspect:rise(0,.08)*(1-rise(.32,.48)),reveal:rise(0,.06),cut:rise(.48,.58),separation:rise(.48,.60)*(1-rise(.88,1)),insertion:rise(.64,.86),femoralInsertion:rise(.64,.75),tibialInsertion:rise(.75,.86),tibialReveal:1};
}
