import {springResponsePoints,responseAtAngle} from './spring-plot-data.js?v=revision-20261029-62';
import {springFEAColor} from './spring-fea-layer.js?v=revision-20261029-62';
import {SPRING_MATH} from './spring-math.js?v=revision-20261029-62';
import {SPRING_COMPARISON,SERIES_LINEAR_ESTIMATE} from './spring-series-data.js?v=revision-20261029-62';
import {sampleSpringExplanationMotion,conceptualContactResponse,seriesRegimeAtLoad} from './spring-explanation-motion.js?v=revision-20261029-62';
// Diagram Design example-architecture / example-process / example-line grammar:
// retain their neutral nodes, single burnt-tangerine focus, thin connectors,
// rounded orthogonal ports and line/area/dot hierarchy. Slide shell is untouched.
const P={ink:'#2d3142',muted:'#4f5d75',accent:'#bf4520',rule:'rgba(45,49,66,.14)',tint:'rgba(191,69,32,.08)'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const t=(x,y,s,z=30,c=P.ink,a='middle')=>`<text x="${x}" y="${y}" fill="${c}" font-size="${z}" text-anchor="${a}">${esc(s)}</text>`;
const line=(d,c=P.muted,w=2,dash=false)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${dash?'stroke-dasharray="7 6"':''}/>`;
const arrow=(d,accent=false)=>`<path d="${d}" fill="none" stroke="${accent?P.accent:P.muted}" stroke-width="2" marker-end="url(#spring-dd-${accent?'focus':'arrow'})"/>`;
function node(x,y,w,h,title,sub='',focus=false){return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#fdfcf8"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${focus?P.tint:'rgba(45,49,66,.025)'}" stroke="${focus?P.accent:'rgba(45,49,66,.25)'}" stroke-width="${focus?2.4:1.6}"/>${t(x+w/2,y+h/2+(sub?-3:10),title,32)}${sub?t(x+w/2,y+h/2+32,sub,24,P.muted):''}</g>`;}
function svg(content,label){return `<svg viewBox="0 0 720 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" data-diagram-design="repository-example-grammar"><defs><marker id="spring-dd-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0 0L8 3L0 6Z" fill="${P.muted}"/></marker><marker id="spring-dd-focus" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0 0L8 3L0 6Z" fill="${P.accent}"/></marker></defs>${content}</svg>`;}
function sea(){return svg(
 t(285,66,'Relative rotation stores energy',32)+
 t(42,152,'Motor-side input',28,P.muted,'start')+
 '<text data-winding-input="true" x="42" y="207" fill="'+P.accent+'" font-size="46">θᵢₙ = 0°</text>'+
 line('M42 239H382',P.rule,1.5)+
 t(42,308,'Output held',28,P.muted,'start')+
 t(42,363,'θₒᵤₜ = 0°',46,P.ink,'start')+
 t(565,90,'Torque',28,P.accent)+
 '<rect x="539" y="125" width="52" height="270" fill="rgba(191,69,32,.08)"/>'+
 '<rect data-winding-bar="true" x="539" y="395" width="52" height="0" fill="'+P.accent+'"/>'+
 line('M529 125H536 M529 395H602',P.muted,1.5)+
 t(614,137,'High',21,P.muted,'start')+t(614,401,'0',21,P.muted,'start')+
 t(350,472,'Wind → store → release',29,P.accent),
 'Illustrative series-elastic winding: a fixed output and moving input store elastic energy; normalized qualitative torque');}
function axes(ylabel='Torque',xlabel='Deflection'){return t(95,55,ylabel,27,P.muted,'start')+line('M100 85V410H650',P.muted,1.6)+t(650,460,xlabel,27,P.muted,'end');}
const curveLine=(d,c)=>`<path data-reveal-curve="true" pathLength="1" d="${d}" fill="none" stroke="${c}" stroke-width="3"/>`;
const axis=(x,y,w,h,{xmax=1,ymax=1,labels=false}={})=>{
 let out=line(`M${x} ${y}V${y+h}H${x+w}`,P.muted,1.5);
 if(labels){for(let i=0;i<=4;i++){const yy=y+h-h*i/4;out+=line(`M${x} ${yy}H${x+w}`,P.rule,1)+t(x-12,yy+7,String(ymax*i/4),21,P.muted,'end')+t(x+w*i/4,y+h+28,String(xmax*i/4),21,P.muted);}}
 return out;
};
function tradeoff(){return svg(
 t(90,46,'Torque',27,P.muted,'start')+axis(90,76,560,260)+
 curveLine('M90 336L625 166',P.accent)+curveLine('M90 336L275 116',P.ink)+
 `<path data-trade-guide stroke="${P.muted}" stroke-width="1.4" stroke-dasharray="6 5" fill="none"/>
 <circle data-trade-low r="8" fill="${P.accent}" stroke="#fdfcf8" stroke-width="2"/>
 <circle data-trade-high r="8" fill="${P.ink}" stroke="#fdfcf8" stroke-width="2"/>`+
 t(275,103,'High stiffness',29,P.ink,'start')+t(436,280,'Low stiffness',29,P.accent)+
 t(648,377,'Deflection',27,P.muted,'end'),
 'Low stiffness permits compliant interaction but requires more angular travel. High stiffness produces torque with less travel but yields less to motion. Both dots carry the same conceptual torque.').replace('720 500','720 440');}
function nonlinear(){const pts=Array.from({length:65},(_,i)=>{const x=i/64;return [90+550*x,420-320*(.14*x+.86*x**4)];});return svg(
 t(90,53,'Torque',27,P.muted,'start')+axis(90,80,560,340)+
 `<polygon data-reveal-area points="90,420 ${pts.map(p=>p.join(',')).join(' ')} 640,420" fill="rgba(191,69,32,.06)"/>
 <polyline data-reveal-curve pathLength="1" points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${P.accent}" stroke-width="3.5"/>
 <circle data-objective-point r="8" fill="${P.accent}" stroke="#fdfcf8" stroke-width="2"/>
 <path data-objective-tangent fill="none" stroke="${P.ink}" stroke-width="2.6"/>`+
 t(200,345,'Yield to motion',29,P.ink)+line('M202 358L224 401',P.muted,1.3)+
 t(475,105,'Build support torque',29,P.accent)+line('M515 119L586 207',P.accent,1.3)+
 t(650,464,'Deflection',27,P.muted,'end'),
 'Elastic design objective: compliant response at small deflection and rising tangent stiffness at large deflection. Yield means elastic compliance, not material yielding.');}
function serial(){return svg(
 t(100,45,'Which spring sets the stiffness?',31,P.ink,'start')+
 t(100,100,'Torque',25,P.muted,'start')+axis(100,130,550,290)+
 `<path data-reveal-curve pathLength="1" data-series-weak fill="none" stroke="${P.muted}" stroke-width="2" opacity=".55"/>
 <path data-reveal-curve pathLength="1" data-series-strong fill="none" stroke="${P.ink}" stroke-width="2" opacity=".55"/>
 <path data-reveal-curve pathLength="1" data-series-combined fill="none" stroke="${P.accent}" stroke-width="4"/>
 <path data-series-guide fill="none" stroke="${P.muted}" stroke-width="1.3" stroke-dasharray="6 5"/>
 <circle data-series-unit1 r="6" fill="${P.muted}"/>
 <circle data-series-unit2 r="6" fill="${P.ink}"/>
 <circle data-series-marker r="8" fill="${P.accent}" stroke="#fdfcf8" stroke-width="2"/>
 <g data-series-before>${t(95,506,'Before contact',27,P.accent,'start')}${t(95,551,'k₁ ≪ k₂',32,P.ink,'start')}<text x="95" y="590" font-size="31" fill="${P.accent}">k<tspan baseline-shift="sub" font-size="20">eq</tspan> ≈ k₁</text></g>
 <g data-series-after>${t(405,506,'After contact',27,P.accent,'start')}${t(405,551,'k₁ ≫ k₂',32,P.ink,'start')}<text x="405" y="590" font-size="31" fill="${P.accent}">k<tspan baseline-shift="sub" font-size="20">eq</tspan> ≈ k₂</text></g>`+
 t(430,112,'k₁',27,P.muted)+t(270,112,'k₂',27,P.ink)+
 t(650,193,'Series',29,P.accent,'end')+
 t(650,462,'Deflection',25,P.muted,'end'),
 'Conceptual series stiffness: before contact k1 is much less than k2, so equivalent stiffness follows k1. After contact k1 becomes much greater than k2, so equivalent stiffness follows k2. Both units continue to share the same torque.').replace('720 500','720 640');}

function contactCurve(){const pts=Array.from({length:91},(_,i)=>{const u=i/90;const torque=conceptualContactResponse(u).torque;return [100+540*u,420-300*torque];});return svg(
 t(100,50,'Contact changes the slope',31,P.ink,'start')+t(100,100,'Torque',26,P.muted,'start')+axis(100,120,540,300)+
 `<polyline data-reveal-curve pathLength="1" points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${P.accent}" stroke-width="3.5"/>
 <path data-contact-guide d="M397 420V366" fill="none" stroke="${P.muted}" stroke-width="1.4" stroke-dasharray="6 5"/>
 <circle cx="397" cy="366" r="8" fill="#fdfcf8" stroke="${P.accent}" stroke-width="2.5"/>
 <circle data-contact-point r="8" fill="${P.accent}" stroke="#fdfcf8" stroke-width="2"/>
 <path data-contact-tangent fill="none" stroke="${P.ink}" stroke-width="3"/>`+
 t(397,458,'δc · contact begins',26,P.accent)+t(575,503,'Deflection',25,P.muted,'end')+
 t(165,335,'Free bending',27,P.ink,'start')+t(495,144,'Rapid stiffening',27,P.accent)+
 t(360,558,'Contact reduces free flexure',27,P.ink),
 'Illustrative contact mechanism: the weak lower spring bends freely until adjacent turns contact. Beyond the contact point the slope increases rapidly; the threshold is conceptual, not a measured contact angle.').replace('720 500','720 580');}
const sourcePoints=s=>Array.isArray(s)?s:s.points||s.data.filter(p=>Number.isFinite(p.torque_Nm)).map(p=>({angleDeg:p.angle_deg,torqueNm:p.torque_Nm}));
const dataPath=(pts,px,py)=>pts.map((p,i)=>`${i?'L':'M'}${px(p.angleDeg).toFixed(3)} ${py(p.torqueNm).toFixed(3)}`).join('');
function archive(){
 const cmp=SPRING_COMPARISON,weak=sourcePoints(cmp.weak),strong=sourcePoints(cmp.strong),x=76,w=430,h=190,px=a=>x+a/120*w;let out='';
 for(const [i,points,label,color]of [[0,weak,'Lower spring · compliant / contact',P.accent],[1,strong,'Upper spring · stiffer',P.ink]]){
  const y=82+i*285,py=v=>y+h-v/20*h;
  out+=t(x,y-30,label,27,color,'start')+axis(x,y,w,h,{xmax:120,ymax:20,labels:true})+
   `<path data-reveal-curve pathLength="1" data-common-scale="120deg-20Nm" d="${dataPath(points,px,py)}" fill="none" stroke="${color}" stroke-width="3"/>`;
  for(const p of points)out+=`<circle data-reveal-point cx="${px(p.angleDeg)}" cy="${py(p.torqueNm)}" r="3" fill="${color}"/>`;
  out+=t(x+w,y+h+45,'Rotation (°)',23,P.muted,'end');
 }
 out+=t(76,22,'Torque (N·m)',23,P.muted,'start');
 const estimate=SERIES_LINEAR_ESTIMATE,cx=700,cy=145,cw=435,ch=420,ex=a=>cx+a/800*cw,ey=v=>cy+ch-v/20*ch;
 out+=t(cx,38,'Combined series response',32,P.accent,'start')+t(cx,77,'Series estimate',25,P.ink,'start')+t(cx,111,'Torque (N·m)',23,P.muted,'start')+
 axis(cx,cy,cw,ch,{xmax:800,ymax:20,labels:true})+
 `<path data-reveal-curve pathLength="1" d="${dataPath(estimate.measuredPoints,ex,ey)}" fill="none" stroke="${P.accent}" stroke-width="4"/>
 <path data-series-estimate d="${dataPath(estimate.extrapolatedPoints,ex,ey)}" fill="none" stroke="${P.accent}" stroke-width="3.5" stroke-dasharray="9 6"/>
 <circle data-composition-marker r="7" fill="${P.accent}" stroke="#fdfcf8" stroke-width="2"/>`;
 for(const [kind,color]of [['low',P.muted],['high',P.ink]]){
  const fit=estimate.stiffness[kind];if(!fit)continue;
  const fitSegment=kind==='high'?[.15,.45].map(u=>{const angleDeg=fit.angleRange[0]+u*(fit.angleRange[1]-fit.angleRange[0]);return {angleDeg,torqueNm:fit.kNmPerDeg*angleDeg+fit.interceptNm};}):fit.endpoints;
  out+=`<path data-fit-line="${kind}" d="${dataPath(fitSegment,ex,ey)}" stroke="${color}" stroke-width="2" fill="none"/>`;
 }
 out+=line('M535 292H620',P.muted,1.8)+t(575,278,'δ₁ + δ₂',26,P.ink)+
 t(cx+cw,624,'Total rotation (°)',24,P.muted,'end')+
 t(cx,655,`Low: ${estimate.stiffness.low.kNmPerDeg.toFixed(3)} N·m/°`,26,P.muted,'start')+
 t(cx,694,`High: ≈ ${estimate.stiffness.high.kNmPerDeg.toFixed(3)} N·m/°`,26,P.ink,'start')+
 t(76,685,'Raw curves: identical axes',24,P.muted,'start')+
 line('M700 734H748',P.accent,3,true)+t(762,742,'Linear upper-unit approximation',23,P.muted,'start');
 return svg(out,'Original two supplied responses have identical0 to120 degree and0 to20 Nm axes. Series calculation adds deflections at a common torque. Dashed continuation assumes a linear upper-unit response beyond its recorded range.').replace('720 500','1200 770');
}
function feaLegend(fea){if(!fea)return '';const curve=springResponsePoints,ymax=20,px=x=>680+x/120*450,py=y=>460-y/ymax*260;
 let out=t(600,15,'Deformation and torque response',36)+t(510,125,'Normalized stress',25,P.muted);
 for(let i=0;i<32;i++)out+=`<rect x="490" y="${155+i*190/32}" width="18" height="${190/32+1}" fill="${springFEAColor(1-i/31).getStyle()}"/>`;
 out+=t(525,165,'1',25,P.muted,'start')+t(525,345,'0',25,P.muted,'start');
 out+=t(680,150,'Torque (N·m)',29,P.muted,'start')+t(1130,550,'Rotation (°)',29,P.muted,'end')+line('M680 200V460H1130',P.muted,1.5);
 for(let j=0;j<=2;j++){const y=j*ymax/2;out+=line(`M680 ${py(y)}H1130`,P.rule,1)+t(660,py(y)+9,String(y),27,P.muted,'end')+t(px(60*j),505,String(60*j),27,P.muted);}
 out+=`<polyline data-reveal-curve="true" pathLength="1" data-fea-curve-points="${curve.length}" points="${curve.map(p=>`${px(p.angleDeg)},${py(p.torqueNm)}`).join(' ')}" stroke="${P.accent}" stroke-width="3.2" fill="none"/><path data-fea-guide="true" stroke="${P.muted}" stroke-width="1.3" fill="none"/><circle data-fea-marker="true" r="8" fill="${P.accent}" stroke="#fdfcf8" stroke-width="2"/><text data-fea-value="true" x="905" y="95" font-size="32" fill="${P.accent}" text-anchor="middle"></text>`;
 out+=t(600,590,'Separate analyses · aligned by rotation',24,P.muted);
 return svg(out,'Angle-aligned FEA replay and ANSYS spring design response; stress normalized by the unchanged global source maximum').replace('viewBox="0 0 720 500"','viewBox="0 0 1200 600"');}
const SOURCES=[
 'Illustrative winding · motor angle referred to spring input.',
 'Same torque · different angular travel.',
 'Elastic design objective · qualitative.',
 'Illustrative stiffness dominance switches at contact.',
 'Illustrative contact threshold · not a fitted angle.',
 'Angle-aligned view · P = 2 mm, a = 0.7 mm, b = 10 mm.',
 'P = 2 mm · a = 0.7 mm · two axial-depth designs.'
];
function updatePanelMotion(root,build,motion){
 const m=motion?.load===undefined?sampleSpringExplanationMotion(motion?.timeSec||0,build):motion;
 const attr=(sel,key,value)=>root.querySelector(sel)?.setAttribute(key,value);
 const point=(sel,x,y)=>{attr(sel,'cx',x);attr(sel,'cy',y);};
 const u=m.load;
 root.dataset.motionPhase=String(m.phase);root.dataset.motionClass='illustrative';
 if(build===1){const y=336-170*u;point('[data-trade-low]',90+535*u,y);point('[data-trade-high]',90+142.955*u,y);attr('[data-trade-guide]','d',`M90 ${y}H${90+535*u}`);}
 if(build===2){const x=90+550*u,y=420-320*(.14*u+.86*u**4),slope=-320*(.14+3.44*u**3)/550;
  point('[data-objective-point]',x,y);attr('[data-objective-tangent]','d',`M${x-45} ${y-slope*45}L${x+45} ${y+slope*45}`);}
 if(build===3){
  const px=d=>100+d/1.3*550,py=t=>420-t*290,arr=Array.from({length:101},(_,i)=>{const tau=i/100,weak=tau<=.18?4*tau:.72+.04*(tau-.18),strong=.4*tau;return {tau,weak,strong};});
  for(const [selector,value]of [['weak',p=>p.weak],['strong',p=>p.strong],['combined',p=>p.weak+p.strong]])attr(`[data-series-${selector}]`,'d',arr.map((p,i)=>`${i?'L':'M'}${px(value(p))} ${py(p.tau)}`).join(''));
  const q=m.series||seriesRegimeAtLoad(u),y=py(q.tau);
  point('[data-series-marker]',px(q.total),y);point('[data-series-unit1]',px(q.weak),y);point('[data-series-unit2]',px(q.strong),y);
  attr('[data-series-guide]','d',`M100 ${y}H${px(q.total)}`);
  for(const [selector,active]of [['[data-series-before]',!q.contact],['[data-series-after]',q.contact]]){const group=root.querySelector(selector);group?.setAttribute('font-weight',active?'600':'400');group?.querySelectorAll('text').forEach(node=>node.setAttribute('fill',active?P.accent:P.muted));}
  root.dataset.seriesRegime=q.contact?'k1 >> k2; keq follows k2':'k1 << k2; keq follows k1';
 }

 if(build===4){const q=conceptualContactResponse(u).torque,x=100+540*u,y=420-300*q;
  const slope=-300*conceptualContactResponse(u).slope/540;
  point('[data-contact-point]',x,y);attr('[data-contact-tangent]','d',`M${x-32} ${y-slope*32}L${x+32} ${y+slope*32}`);
  attr('[data-contact-guide]','stroke',m.contact?P.accent:P.muted);root.dataset.contact=String(m.contact);
 }
 if(build===6)updateQuantitativeComposition(root,m);
}
function updateQuantitativeComposition(root,m){
 // The source estimate is rendered below when its two source branches overlap.
 const marker=root.querySelector('[data-composition-marker]');if(!marker)return;
 const data=SERIES_LINEAR_ESTIMATE.points;
 const index=Math.min(data.length-1,m.load*(data.length-1)),i=Math.floor(index),u=index-i,a=data[i],b=data[Math.min(data.length-1,i+1)];if(!a)return;const p={angleDeg:a.angleDeg+(b.angleDeg-a.angleDeg)*u,torqueNm:a.torqueNm+(b.torqueNm-a.torqueNm)*u};
 const x=700+p.angleDeg/800*435,y=565-p.torqueNm/20*420;
 marker.setAttribute('cx',x);marker.setAttribute('cy',y);
}
export function createSpringExplanationPanel(host){
 const root=document.createElement('div');root.className='spring-explanation';root.hidden=true;root.setAttribute('aria-label','Nonlinear torsion spring explanation');host.append(root);let current=-1;
 return {update({active,build,settled,fea,winding,springMotion,timeSec}){root.hidden=!active;if(!active)return;if(current!==build){current=build;const figures=[sea,tradeoff,nonlinear,serial,contactCurve,()=>feaLegend(fea),archive];root.innerHTML=`<div class="spring-explanation-figure">${figures[build]()}</div><div class="spring-explanation-math">${SPRING_MATH[build]}</div><p class="spring-explanation-source">${SOURCES[build]}</p>`;root.dataset.build=String(build);
 root.querySelector('.spring-explanation-source').hidden=true;
 if(build===0){root.style.left='29%';root.style.width='33%';root.style.top='10%';root.style.bottom='10%';root.style.alignContent='center';root.querySelector('.spring-explanation-figure').style.aspectRatio='720 / 500';root.style.gap='0';const source=root.querySelector('.spring-explanation-source');source.hidden=true;root.querySelector('.spring-explanation-math').style.cssText='order:-1;font-size:35px;min-height:76px;margin:0 0 12px;';}
 else{root.style.removeProperty('left');root.style.removeProperty('width');root.style.removeProperty('top');root.style.removeProperty('bottom');root.style.removeProperty('grid-template-rows');root.style.removeProperty('gap');root.style.removeProperty('align-content');root.style.removeProperty('display');root.style.removeProperty('flex-direction');root.style.removeProperty('justify-content');}}

 root.style.opacity=settled?'1':'0';root.dataset.settled=String(settled);
 updatePanelMotion(root,build,springMotion||sampleSpringExplanationMotion(timeSec||0,build));
 if(build===0&&winding){
 const fraction=Math.max(0,Math.min(1,winding.torqueFraction||0)),height=270*fraction,bar=root.querySelector('[data-winding-bar]');bar?.setAttribute('height',height.toFixed(3));bar?.setAttribute('y',(395-height).toFixed(3));const input=root.querySelector('[data-winding-input]');if(input)input.textContent=`θᵢₙ = ${winding.inputDeg.toFixed(0)}°`;
 Object.assign(root.dataset,{inputAngleDeg:String(winding.inputDeg),outputAngleDeg:'0',springTorqueNormalized:String(fraction),windingClassification:winding.classification});}
 if(build===5&&fea){const values=fea.getValues(),max=20,angle=values.actualAngleDeg??0,torque=responseAtAngle(angle),x=680+angle/120*450,y=460-torque/max*260;
 const marker=root.querySelector('[data-fea-marker]');if(marker)marker.style.visibility=torque===null?'hidden':'visible';marker?.setAttribute('cx',x);marker?.setAttribute('cy',y);root.querySelector('[data-fea-guide]')?.setAttribute('d',`M${x} 460V${y}H680`);const label=root.querySelector('[data-fea-value]');if(label)label.textContent=`${angle.toFixed(1)}°  ·  ${torque===null?'—':torque.toFixed(2)} N·m`;root.dataset.feaFrame=String(values.frameIndex);}
},dispose(){root.remove();}};
}
