import {springResponsePoints,responseAtAngle} from './spring-plot-data.js?v=revision-20261029-32';
import {springFEAColor} from './spring-fea-layer.js?v=revision-20261029-32';
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
function sea(){return svg(t(360,70,'Elasticity in the torque path',34)+arrow('M210 230H266',true)+arrow('M454 230H510',true)+node(20,175,190,110,'Motor','input angle')+node(266,175,188,110,'Spring','relative angle',true)+node(510,175,190,110,'Joint','output angle')+line('M360 285V340',P.accent)+t(360,388,'Deflection stores elastic energy',30,P.accent),'Motor, spring and joint in series');}
function axes(ylabel='Torque',xlabel='Deflection'){return t(95,55,ylabel,27,P.muted,'start')+line('M100 85V410H650',P.muted,1.6)+t(650,460,xlabel,27,P.muted,'end');}
function tradeoff(){return svg(axes()+line('M100 410L640 305',P.accent,3)+line('M100 410L260 95',P.ink,3)+line('M100 330H640',P.rule,1.5,true)+t(485,290,'Low stiffness',30,P.accent)+t(310,110,'High stiffness',30)+t(440,220,'More angle for the same torque',25,P.muted)+`<circle cx="545" cy="323" r="5" fill="${P.accent}"/>`,'Conceptual low versus high linear stiffness; no calibrated values');}
function nonlinear(){const pts=Array.from({length:65},(_,i)=>{const x=i/64;return [100+540*x,410-310*(.14*x+.86*x**4)];});return svg(axes()+`<polygon points="100,410 ${pts.map(p=>p.join(',')).join(' ')} 640,410" fill="rgba(191,69,32,.06)"/><polyline data-reveal-curve="true" pathLength="1" points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${P.accent}" stroke-width="3.4"/>`+t(270,270,'Yield easily',31)+t(525,96,'Build torque',31,P.accent)+t(370,493,'Design objective · qualitative',23,P.muted),'Desired increasing tangent stiffness; conceptual curve');}
function serial(){return svg(t(360,65,'Two units, one torque path',34)+arrow('M315 200H405',true)+node(40,145,275,110,'Compliant unit','larger early deflection',true)+node(405,145,275,110,'Stiffer unit','smaller early deflection')+t(360,305,'Both units carry torque from the start',27,P.muted)+line('M80 382H300',P.accent,12)+line('M440 382H520',P.ink,12)+t(180,434,'δ₁',36,P.accent)+t(480,434,'δ₂',36)+t(360,488,'Series connection shares total deflection',25,P.muted),'Same torque through two serial spring units with unequal deflection');}
function turns(){
 const arc=(cx,cy,r)=>{const pts=Array.from({length:70},(_,i)=>{const a=(25+i/69*130)*Math.PI/180;return [cx+r*Math.cos(a),cy-r*Math.sin(a)];});return `<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${P.ink}" stroke-width="12" stroke-linecap="round"/>`;};
 return svg(t(360,50,'Turn-to-turn contact',34)+t(190,110,'Gap open',30)+t(540,110,'Turns engage',30,P.accent)+arc(185,280,80)+arc(185,280,119)+arc(535,280,80)+arc(535,280,94)+arrow('M335 210H385',true)+line('M185 160V190',P.accent,2)+t(220,170,'g',30,P.accent)+`<circle cx="535" cy="193" r="19" fill="none" stroke="${P.accent}" stroke-width="2.5"/>`+t(185,330,'More free flexure',27,P.muted)+t(535,330,'More constrained flexure',27,P.accent)+line('M70 390H300',P.muted,10)+line('M445 390H575',P.accent,10)+t(360,465,'Local turn sections · contact concept',24,P.muted),'Schematic neighboring turn sections: closing gap constrains free flexure');
}
function archive(){let out=t(360,30,'Torque–rotation response',33);for(const [i,s]of ARCHIVED_SPRING_CURVES.series.entries()){
 const y=78+i*220,x=110,w=550,h=140,xmax=i?45:120,ymax=i?1.2:20,color=i?P.ink:P.accent,px=a=>x+a/xmax*w,py=v=>y+h-v/ymax*h,pts=s.data.filter(r=>Number.isFinite(r.angle_deg)&&Number.isFinite(r.torque_Nm));
 out+=t(x,y-20,`b = ${s.geometry.axial_depth_mm} mm`,27,P.ink,'start')+t(660,y-20,'Torque (N·m)',23,P.muted,'end');
 for(let j=0;j<=2;j++){const v=j*ymax/2,yy=py(v);out+=line(`M${x} ${yy}H660`,P.rule,1)+t(x-14,yy+7,String(v),23,P.muted,'end');}
 out+=line(`M${x} ${y}V${y+h}H660`,P.muted,1.4)+`<polyline data-reveal-curve="true" pathLength="1" data-archive-points="${pts.length}" points="${pts.map(r=>`${px(r.angle_deg)},${py(r.torque_Nm)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.8"/>`;
 for(const p of pts)out+=`<circle cx="${px(p.angle_deg)}" cy="${py(p.torque_Nm)}" r="3" fill="${color}"/>`;
 for(let j=0;j<=2;j++)out+=t(px(xmax*j/2),y+h+28,String(xmax*j/2),24,P.muted);
 }
 return svg(out+t(660,495,'Rotation (°)',25,P.muted,'end'),'Original ANSYS prototype curves; all 34 and 14 finite source points retained');
}
function feaLegend(fea){if(!fea)return '';const l=fea.getLegend(),curve=springResponsePoints;
 const ymax=Math.max(...curve.map(p=>p.torqueNm))*1.1,px=x=>110+x/120*520,py=y=>460-y/ymax*130;
 let out=t(360,25,'Deformation and reaction torque',32)+t(660,65,'MPa',23,P.muted);
 for(let i=0;i<32;i++)out+=`<rect x="645" y="${85+i*130/32}" width="16" height="${130/32+1}" fill="${springFEAColor(1-i/31).getStyle()}"/>`;
 out+=t(680,94,Number(l.max).toFixed(0),22,P.muted,'start')+t(680,215,'0',22,P.muted,'start');
 out+=t(110,300,'Torque (N·m)',25,P.muted,'start')+t(630,520,'Rotation (°)',25,P.muted,'end')+line('M110 325V460H630',P.muted,1.5);
 for(let j=0;j<=2;j++){const y=j*ymax/2;out+=line(`M110 ${py(y)}H630`,P.rule,1)+t(95,py(y)+7,y.toFixed(1),22,P.muted,'end')+t(px(60*j),485,String(60*j),22,P.muted);}
 out+=`<polyline data-fea-curve-points="${curve.length}" points="${curve.map(p=>`${px(p.angleDeg)},${py(p.torqueNm)}`).join(' ')}" stroke="${P.accent}" stroke-width="3" fill="none"/><path data-fea-guide="true" stroke="${P.muted}" stroke-width="1.3" fill="none"/><circle data-fea-marker="true" r="7" fill="${P.accent}" stroke="#fdfcf8" stroke-width="2"/><text data-fea-value="true" x="360" y="265" font-size="26" fill="${P.accent}" text-anchor="middle"></text>`;
 return svg(out,'Angle-aligned FEA replay and ANSYS spring design response');}
const SOURCES=[
 'Motor-side angle is referred to the spring input.',
 'Conceptual comparison; no fitted stiffness values.',
 'Increasing tangent stiffness.',
 'Same torque · additive deflection.',
 'Gap closure → contact → reduced free flexure.',
 'Angle-aligned view · P = 2 mm, a = 0.7 mm, b = 10 mm.',
 'P = 2 mm · a = 0.7 mm · two axial-depth designs.'
];
export function createSpringExplanationPanel(host){
 const root=document.createElement('div');root.className='spring-explanation';root.hidden=true;root.setAttribute('aria-label','Nonlinear torsion spring explanation');host.append(root);let current=-1;
 return {update({active,build,settled,fea}){root.hidden=!active;if(!active)return;if(current!==build){current=build;const figures=[sea,tradeoff,nonlinear,serial,turns,()=>feaLegend(fea),archive];root.innerHTML=`<div class="spring-explanation-figure">${figures[build]()}</div><div class="spring-explanation-math">${SPRING_MATH[build]}</div><p class="spring-explanation-source">${SOURCES[build]}</p>`;root.dataset.build=String(build);}
 root.style.opacity=settled?'1':'0';root.dataset.settled=String(settled);
 if(build===5&&fea){const values=fea.getValues(),max=Math.max(...springResponsePoints.map(p=>p.torqueNm))*1.1,angle=values.actualAngleDeg??0,torque=responseAtAngle(angle),x=110+angle/120*520,y=460-torque/max*130;
 const marker=root.querySelector('[data-fea-marker]');if(marker)marker.style.visibility=torque===null?'hidden':'visible';marker?.setAttribute('cx',x);marker?.setAttribute('cy',y);root.querySelector('[data-fea-guide]')?.setAttribute('d',`M${x} 460V${y}H110`);const label=root.querySelector('[data-fea-value]');if(label)label.textContent=`${angle.toFixed(1)}°  ·  ${torque===null?'—':torque.toFixed(2)} N·m`;root.dataset.feaFrame=String(values.frameIndex);}
},dispose(){root.remove();}};
}
