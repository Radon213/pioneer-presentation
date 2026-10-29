import {PRELOAD_CURVE,preloadOperatingPoint,preloadTorqueNm} from './control-preload-data.js?v=revision-20261029-46';
const C={ink:'#2d3142',muted:'#4f5d75',accent:'#bf4520',paper:'#fdfcf8',rule:'rgba(45,49,66,.15)'};
const x=d=>66+(d+40)/145*394,y=t=>340-(t+1)/12*210;
const text=(a,b,s,size=23,anchor='middle',color=C.muted,extra='')=>`<text x="${a}" y="${b}" font-size="${size}" text-anchor="${anchor}" fill="${color}" ${extra}>${s}</text>`;
const curve=rows=>rows.map((p,i)=>`${i?'L':'M'}${x(p.deltaDeg).toFixed(3)} ${y(p.torqueNm).toFixed(3)}`).join(' ');
export function preloadPlotMarkup({footer=true}={}){
 const normal=PRELOAD_CURVE.filter(p=>p.deltaDeg<=101.7),extension=PRELOAD_CURVE.filter(p=>p.deltaDeg>=101.5&&p.deltaDeg<=105);
 return text(250,91,'Prepare the spring',27,'middle',C.accent,'data-preload-phase')+
 text(66,118,footer?'Spring torque τs (N·m)':'Simulated spring torque (N·m)',23,'start')+
 [0,3,6,9].map(t=>`<path d="M66 ${y(t)}H460" stroke="${C.rule}"/>`+text(54,y(t)+7,t,21,'end')).join('')+
 `<path d="M66 130V340H460" fill="none" stroke="${C.muted}" stroke-width="1.4"/><path d="M${x(0)} 130V340" stroke="${C.rule}"/>`+
 `<path data-preload-area fill="${C.accent}" opacity=".12"/><path d="${curve(normal)}" fill="none" stroke="${C.ink}" stroke-width="2.5"/><path d="${curve(extension)}" fill="none" stroke="${C.muted}" stroke-width="2" stroke-dasharray="5 4"/>`+
 `<path data-preload-trail fill="none" stroke="${C.accent}" stroke-width="4" opacity=".48"/><path data-preload-guide fill="none" stroke="${C.muted}" stroke-width="1" stroke-dasharray="3 4"/><circle data-preload-halo cx="${x(0)}" cy="${y(0)}" r="15" fill="${C.accent}" opacity=".13"/><circle data-preload-dot cx="${x(0)}" cy="${y(0)}" r="7" fill="${C.accent}" stroke="${C.paper}" stroke-width="2"/>`+
 [-40,0,50,100].map(d=>text(x(d),370,d,21)).join('')+text(263,401,'Spring deflection δ (deg)',24)+
 text(66,443,'δ —',29,'start',C.ink,'data-preload-value="delta"')+text(460,443,'τs —',29,'end',C.accent,'data-preload-value="torque"')+
 text(250,478,'Shaded area: stored elastic energy',21)+(footer?text(250,676,'Simulation spring law',20):'');
}
export function createPreloadPlotController(root){
 const refs={};for(const key of ['phase','area','trail','guide','halo','dot'])refs[key]=root.querySelector(`[data-preload-${key}]`);
 for(const el of root.querySelectorAll('[data-preload-value]'))refs[el.dataset.preloadValue]=el;
 if(!refs.dot)return {update(){}};
 let trail=[],bucket=-1,previous=null,heldPhase='Prepare the spring';
 const set=(el,v)=>{if(el&&el.textContent!==v)el.textContent=v;};
 return {update(telemetry={},kind='sts'){
  const point=preloadOperatingPoint(telemetry);if(!Number.isFinite(point.deltaDeg))return;
  const elapsed=telemetry.elapsedSec??telemetry.timeSec??0,reset=Boolean(telemetry.resetting),px=x(point.deltaDeg),py=y(point.torqueNm),color=reset?C.muted:C.accent;
  let phase=telemetry.preloadPhase;
  if(reset)phase='Return to start';
  else if(kind==='sts'){const t=telemetry.timeSec??0;phase=t<.65?'Seated':t<2?'Build preload':t<3.6?'Support rising':t<5?'Release preload':'Standing';}
  else {if(phase)heldPhase=phase;phase=heldPhase;}
  refs.phase.setAttribute('fill',color);
  refs.dot.setAttribute('cx',px);refs.dot.setAttribute('cy',py);refs.dot.setAttribute('fill',color);refs.dot.setAttribute('opacity',reset?'.45':'1');
  refs.halo.setAttribute('cx',px);refs.halo.setAttribute('cy',py);refs.halo.setAttribute('fill',color);
  refs.guide.setAttribute('d',`M66 ${py}H${px}V${y(0)}`);
  const n=Math.max(2,Math.ceil(Math.abs(point.deltaDeg)/1.5)),area=Array.from({length:n+1},(_,i)=>{const d=point.deltaDeg*i/n;return {deltaDeg:d,torqueNm:preloadTorqueNm(d)};});
  refs.area.setAttribute('d',`M${x(0)} ${y(0)} ${curve(area).replace(/^M/,'L')}L${px} ${y(0)}Z`);refs.area.setAttribute('fill',color);
  if(previous&&elapsed<previous.elapsed)trail=[];
  trail.push({elapsed,deltaDeg:point.deltaDeg,torqueNm:point.torqueNm});trail=trail.filter(p=>elapsed-p.elapsed<=.35).slice(-60);refs.trail.setAttribute('d',curve(trail));refs.trail.setAttribute('stroke',color);
  const nextBucket=Math.floor((elapsed+1e-7)*5);if(nextBucket!==bucket){bucket=nextBucket;set(refs.phase,phase||heldPhase);set(refs.delta,reset?'δ —':`δ ${point.deltaDeg.toFixed(1)}°`);set(refs.torque,reset?'τs —':`τs ${point.torqueNm.toFixed(2)} N·m`);}
  root.dataset.preloadDeflection=point.deltaDeg.toFixed(5);root.dataset.preloadTorque=point.torqueNm.toFixed(5);root.dataset.preloadEnergy=point.energyJ.toFixed(5);root.dataset.preloadReset=String(reset);
  previous={elapsed,delta:point.deltaDeg};
 }};
}
