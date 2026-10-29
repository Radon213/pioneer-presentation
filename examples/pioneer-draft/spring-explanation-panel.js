import {springResponsePoints,responseAtAngle} from './spring-plot-data.js?v=revision-20261029-46';
import {springFEAColor} from './spring-fea-layer.js?v=revision-20261029-46';
import {SPRING_MATH} from './spring-math.js';
import {ARCHIVED_SPRING_CURVES} from './archived-spring-chart.js';
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
 t(42,363,'θₒᵤₜ = 0°',42)+
 t(565,90,'Torque',28,P.accent)+
 '<rect x="539" y="125" width="52" height="270" fill="rgba(191,69,32,.08)"/>'+
 '<rect data-winding-bar="true" x="539" y="395" width="52" height="0" fill="'+P.accent+'"/>'+
 line('M529 125H536 M529 395H602',P.muted,1.5)+
 t(614,137,'High',21,P.muted,'start')+t(614,401,'0',21,P.muted,'start')+
 t(350,472,'Wind → store → release',29,P.accent),
 'Illustrative series-elastic winding: a fixed output and moving input store elastic energy; normalized qualitative torque');}
function axes(ylabel='Torque',xlabel='Deflection'){return t(95,55,ylabel,27,P.muted,'start')+line('M100 85V410H650',P.muted,1.6)+t(650,460,xlabel,27,P.muted,'end');}
const curveLine=(d,c)=>`<path data-reveal-curve="true" pathLength="1" d="${d}" fill="none" stroke="${c}" stroke-width="3"/>`;
function tradeoff(){return svg(axes()+curveLine('M100 410L640 305',P.accent)+curveLine('M100 410L260 95',P.ink)+line('M100 330H640',P.rule,1.5,true)+t(485,290,'Low stiffness',30,P.accent)+t(300,120,'High stiffness',30,P.ink,'start')+t(440,220,'More angle for the same torque',25,P.muted)+`<circle data-reveal-point="true" cx="545" cy="323" r="5" fill="${P.accent}"/>`,'Conceptual low versus high linear stiffness; no calibrated values');}
function nonlinear(){const pts=Array.from({length:65},(_,i)=>{const x=i/64;return [100+540*x,410-310*(.14*x+.86*x**4)];});return svg(axes()+`<polygon data-reveal-area="true" points="100,410 ${pts.map(p=>p.join(',')).join(' ')} 640,410" fill="rgba(191,69,32,.06)"/><polyline data-reveal-curve="true" pathLength="1" points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${P.accent}" stroke-width="3.4"/>`+t(270,270,'Yield easily',31)+t(525,96,'Build torque',31,P.accent)+t(370,493,'Design objective · qualitative',23,P.muted),'Desired increasing tangent stiffness; conceptual curve');}
function serial(){return svg(t(360,65,'Two units, one torque path',34)+arrow('M315 200H405',true)+node(40,145,275,110,'Compliant unit','larger early deflection',true)+node(405,145,275,110,'Stiffer unit','smaller early deflection')+t(360,305,'Both units carry torque from the start',27,P.muted)+line('M80 382H300',P.accent,12)+line('M440 382H520',P.ink,12)+t(180,434,'δ₁',36,P.accent)+t(480,434,'δ₂',36)+t(360,488,'Series connection shares total deflection',25,P.muted),'Same torque through two serial spring units with unequal deflection');}
function turns(){return svg(
 t(180,70,'Before contact',32)+t(540,70,'After contact',32,P.accent)+
 `<path d="M60 245Q180 115 300 245 M80 270Q180 160 280 270" fill="none" stroke="${P.ink}" stroke-width="14" stroke-linecap="round"/>
 <path d="M420 245Q540 115 660 245" fill="none" stroke="${P.ink}" stroke-width="14" stroke-linecap="round"/>
 <path class="coil-closing" d="M440 270Q540 102 640 270" fill="none" stroke="${P.ink}" stroke-width="14" stroke-linecap="round"/>
 <circle class="contact-appears" cx="540" cy="183" r="18" fill="${P.tint}" stroke="${P.accent}" stroke-width="3"/>`+
 line('M180 188V207 M180 198L220 150',P.accent,2)+t(230,145,'Gap',26,P.accent,'start')+
 arrow('M330 225H390',true)+line('M540 163V122H590',P.accent,1.6)+t(600,130,'Contact',25,P.accent,'start')+
 t(180,340,'Coils bend freely',27)+t(540,340,'Contact constrains bending',27)+
 t(360,440,'Less free flexure → higher stiffness',31,P.accent),
 'Neighboring coil sections: the gap closes, contact develops and constrains further bending');}
function archive(){let out=t(360,30,'Torque–rotation response',33);for(const [i,s]of ARCHIVED_SPRING_CURVES.series.entries()){
 const y=78+i*220,x=110,w=550,h=140,xmax=i?45:120,ymax=i?1.2:20,color=i?P.ink:P.accent,px=a=>x+a/xmax*w,py=v=>y+h-v/ymax*h,pts=s.data.filter(r=>Number.isFinite(r.angle_deg)&&Number.isFinite(r.torque_Nm));
 out+=t(x,y-20,`b = ${s.geometry.axial_depth_mm} mm`,27,P.ink,'start')+t(660,y-20,'Torque (N·m)',23,P.muted,'end');
 for(let j=0;j<=2;j++){const v=j*ymax/2,yy=py(v);out+=line(`M${x} ${yy}H660`,P.rule,1)+t(x-14,yy+7,String(v),23,P.muted,'end');}
 out+=line(`M${x} ${y}V${y+h}H660`,P.muted,1.4)+`<polyline data-reveal-curve="true" pathLength="1" data-archive-points="${pts.length}" points="${pts.map(r=>`${px(r.angle_deg)},${py(r.torque_Nm)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.8"/>`;
 for(const p of pts)out+=`<circle data-reveal-point="true" cx="${px(p.angle_deg)}" cy="${py(p.torque_Nm)}" r="3" fill="${color}"/>`;
 for(let j=0;j<=2;j++)out+=t(px(xmax*j/2),y+h+28,String(xmax*j/2),24,P.muted);
 }
 return svg(out+t(660,495,'Rotation (°)',25,P.muted,'end'),'Original ANSYS prototype curves; all 34 and 14 finite source points retained');
}
function feaLegend(fea){if(!fea)return '';const curve=springResponsePoints,ymax=20,px=x=>680+x/120*450,py=y=>460-y/ymax*260;
 let out=t(600,15,'Deformation and torque response',36)+t(510,125,'Normalized stress',25,P.muted);
 for(let i=0;i<32;i++)out+=`<rect x="490" y="${155+i*190/32}" width="18" height="${190/32+1}" fill="${springFEAColor(1-i/31).getStyle()}"/>`;
 out+=t(525,165,'1',25,P.muted,'start')+t(525,345,'0',25,P.muted,'start');
 out+=t(680,150,'Torque (N·m)',29,P.muted,'start')+t(1130,550,'Rotation (°)',29,P.muted,'end')+line('M680 200V460H1130',P.muted,1.5);
 for(let j=0;j<=2;j++){const y=j*ymax/2;out+=line(`M680 ${py(y)}H1130`,P.rule,1)+t(660,py(y)+9,String(y),27,P.muted,'end')+t(px(60*j),505,String(60*j),27,P.muted);}
 out+=`<polyline data-reveal-curve="true" pathLength="1" data-fea-curve-points="${curve.length}" points="${curve.map(p=>`${px(p.angleDeg)},${py(p.torqueNm)}`).join(' ')}" stroke="${P.accent}" stroke-width="3.2" fill="none"/><path data-fea-guide="true" stroke="${P.muted}" stroke-width="1.3" fill="none"/><circle data-fea-marker="true" r="8" fill="${P.accent}" stroke="#fdfcf8" stroke-width="2"/><text data-fea-value="true" x="905" y="95" font-size="32" fill="${P.accent}" text-anchor="middle"></text>`;
 return svg(out,'Angle-aligned FEA replay and ANSYS spring design response; stress normalized by the unchanged global source maximum').replace('viewBox="0 0 720 500"','viewBox="0 0 1200 600"');}
const SOURCES=[
 'Illustrative winding · motor angle referred to spring input.',
 'Conceptual comparison; no fitted stiffness values.',
 'Increasing tangent stiffness.',
 'Same torque · additive deflection.',
 'Gap closure → contact → reduced free flexure.',
 'Angle-aligned view · P = 2 mm, a = 0.7 mm, b = 10 mm.',
 'P = 2 mm · a = 0.7 mm · two axial-depth designs.'
];
export function createSpringExplanationPanel(host){
 const root=document.createElement('div');root.className='spring-explanation';root.hidden=true;root.setAttribute('aria-label','Nonlinear torsion spring explanation');host.append(root);let current=-1;
 return {update({active,build,settled,fea,winding}){root.hidden=!active;if(!active)return;if(current!==build){current=build;const figures=[sea,tradeoff,nonlinear,serial,turns,()=>feaLegend(fea),archive];root.innerHTML=`<div class="spring-explanation-figure">${figures[build]()}</div><div class="spring-explanation-math">${SPRING_MATH[build]}</div><p class="spring-explanation-source">${SOURCES[build]}</p>`;root.dataset.build=String(build);
 if(build===0){root.style.left='29%';root.style.width='33%';root.style.top='10%';root.style.bottom='10%';root.style.gridTemplateRows='auto auto';root.style.alignContent='center';root.querySelector('.spring-explanation-figure').style.aspectRatio='720 / 500';root.style.gap='0';const source=root.querySelector('.spring-explanation-source');source.hidden=true;root.querySelector('.spring-explanation-math').style.cssText='font-size:27px;min-height:60px;margin-top:0;';}
 else{root.style.removeProperty('left');root.style.removeProperty('width');root.style.removeProperty('top');root.style.removeProperty('bottom');root.style.removeProperty('grid-template-rows');root.style.removeProperty('gap');root.style.removeProperty('align-content');}}

 root.style.opacity=settled?'1':'0';root.dataset.settled=String(settled);
 if(build===0&&winding){
 const fraction=Math.max(0,Math.min(1,winding.torqueFraction||0)),height=270*fraction,bar=root.querySelector('[data-winding-bar]');bar?.setAttribute('height',height.toFixed(3));bar?.setAttribute('y',(395-height).toFixed(3));const input=root.querySelector('[data-winding-input]');if(input)input.textContent=`θᵢₙ = ${winding.inputDeg.toFixed(0)}°`;
 Object.assign(root.dataset,{inputAngleDeg:String(winding.inputDeg),outputAngleDeg:'0',springTorqueNormalized:String(fraction),windingClassification:winding.classification});}
 if(build===5&&fea){const values=fea.getValues(),max=20,angle=values.actualAngleDeg??0,torque=responseAtAngle(angle),x=680+angle/120*450,y=460-torque/max*260;
 const marker=root.querySelector('[data-fea-marker]');if(marker)marker.style.visibility=torque===null?'hidden':'visible';marker?.setAttribute('cx',x);marker?.setAttribute('cy',y);root.querySelector('[data-fea-guide]')?.setAttribute('d',`M${x} 460V${y}H680`);const label=root.querySelector('[data-fea-value]');if(label)label.textContent=`${angle.toFixed(1)}°  ·  ${torque===null?'—':torque.toFixed(2)} N·m`;root.dataset.feaFrame=String(values.frameIndex);}
},dispose(){root.remove();}};
}
