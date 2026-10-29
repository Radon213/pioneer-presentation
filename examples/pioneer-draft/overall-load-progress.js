// Weighted work completion, not an estimate of remaining seconds. Individual
// byte/decode/build events remain truthful; late assets cannot move it backward.
const clamp=x=>Math.max(0,Math.min(1,Number(x)||0));
export function createOverallLoadProgress(){
 const complete=new Map();let peak=0;
 const weights=new Map([['presentation-fonts',4],['cad-model',25],['cad-metadata',3],['cad-kinematics',3],['simulation-scene.json',8],['bilateral-sts-attachments.json',2],['gait',24],['gait-meshes',12]]);
 return {
  update(row){
   if(row.key==='presentation'){
    if(row.stage==='initial-scene')complete.set('presentation-fonts',1);
    if(row.phase==='ready')peak=100;
   }else{
    let fraction=0;
    if(row.phase==='ready'||row.state==='ready'||row.phase==='setup'&&row.state==='complete')fraction=1;
    else if(row.phase==='download')fraction=.74*clamp(row.ratio);
    else if(row.phase==='decode')fraction=row.state==='complete'?.84:.76;
    else if(row.phase==='parse')fraction=.88;
    else if(row.phase==='setup')fraction=.90+.10*clamp(row.ratio);
    complete.set(row.key,Math.max(complete.get(row.key)||0,fraction));
   }
   const base=[...weights].reduce((sum,[key,weight])=>sum+weight*(complete.get(key)||0),0);
   const extra=[...complete].filter(([key])=>!weights.has(key)).map(([,fraction])=>fraction);
   const optional=extra.length?14*extra.reduce((sum,f)=>sum+f,0)/extra.length:0;
   // 5% is reserved for first-frame composition and GPU preparation.
   peak=Math.max(peak,Math.min(99,Math.floor(base+optional)));
   return peak;
  },
  finish(){peak=100;return peak;},
  get value(){return peak;}
 };
}
