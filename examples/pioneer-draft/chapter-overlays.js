import {buildArchivedSpringChart} from './archived-spring-chart.js?v=revision-20261029-20';
import {buildDiagram} from './chapter-diagram-layer.js?v=revision-20261029-20';
import {springFEAColor} from './spring-fea-layer.js?v=revision-20261029-20';
// Short visual explanations. All quantitative FEA marks use the same archived solver case.
const C={ink:'#1a3a7a',accent:'#a44725',muted:'#585950',line:'#b5b3ab',paper:'#fdfcf8'};
const text=(x,y,s,z=26,c=C.ink,a='middle')=>`<text x="${x}" y="${y}" font-size="${z}" fill="${c}" text-anchor="${a}" stroke="${C.paper}" stroke-width="5" paint-order="stroke">${s}</text>`;
function arrow(a,b,c=C.accent,dash=false){const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,x=dx/d,y=dy/d;return `<path d="M${a.join(' ')}L${b.join(' ')}m${-12*x+6*y} ${-12*y-6*x}l${12*x-6*y} ${12*y+6*x}l${-12*x-6*y} ${-12*y+6*x}" fill="none" stroke="${c}" stroke-width="3" ${dash?'stroke-dasharray="5 5"':''}/>`;}
const box=(x,y,w,h,t,active=false,dashed=false)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.paper}" stroke="${active?C.accent:C.line}" stroke-width="${active?2.5:1.5}" ${dashed?'stroke-dasharray="6 5"':''}/>`+text(x+w/2,y+h/2+9,t,25,active?C.accent:C.ink);
function axes(x,y,w,h,xlabel,ylabel){return `<path d="M${x} ${y-h}V${y}H${x+w}" fill="none" stroke="${C.line}" stroke-width="1.5"/>`+text(x+w,y+35,xlabel,24,C.muted)+text(x-20,y-h-15,ylabel,24,C.muted);}
function conceptCurve(x,y,w,h,d){const pts=Array.from({length:61},(_,i)=>{const a=i/60;return[x+a*w,y-(.18*a+.82*a*a*a*a)*h];});const i=Math.round(Math.max(0,Math.min(1,d))*60),p=pts[i];return axes(x,y,w,h,'δ','τ')+`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${C.accent}" stroke-width="3"/><circle cx="${p[0]}" cy="${p[1]}" r="7" fill="${C.accent}"/>`+text(x+w/2,y-h-45,'Nonlinear response · concept',23,C.muted);}
function feaLegend(fea){const l=fea.getLegend(),x=1290,y=180,h=185,w=18;let out=text(x-8,y-38,'von Mises',25,C.muted)+text(x-8,y-8,'MPa',23,C.muted);for(let i=0;i<40;i++){const color=springFEAColor(1-i/39).getStyle();out+=`<rect x="${x}" y="${y+i*h/40}" width="${w}" height="${h/40+1}" fill="${color}"/>`;}return out+text(x+40,y+10,Number(l.max).toFixed(0),23,C.muted,'start')+text(x+40,y+h,'0',23,C.muted,'start');}
export function buildChapterOverlay(ctx){
 const {chapter:c,build:b,live,project,partPoint,point,frame,fea,human,gait}=ctx;let s='';
 if(c===1){if(!fea)return '';const p=project(fea.group.position);return text(p[0],p[1]+155,'Double-spiral spring',28)+text(p[0],p[1]+190,'FEA replay',23,C.muted);}
 if(c===4&&b===6)return buildArchivedSpringChart();
 const diagram=buildDiagram(c,b,{progress:1,reducedMotion:true});
 if(diagram)return diagram;
 if(c===2){
  // Keep these marks attached to anatomy; the right column carries the argument.
  // Figure coordinates follow the camera, rather than becoming a second caption column.
  const label=(p,name,dx=200,dy=-48,color=C.accent)=>{
   if(!p)return '';
   const x=Math.max(dx<0?340:110,Math.min(1040,p[0]+dx)),y=Math.max(112,Math.min(450,p[1]+dy));
   return arrow([x+(dx<0?16:-16),y+8],[p[0]+14,p[1]],color)+text(x,y,name,40,color,dx<0?'end':'start');
  };
  const knee=human?.getAttachment('left')?.kneeAnchor;
  if(b===0&&knee)s+=label(project(knee),'Joint surfaces');
  if(b===1&&(live.bgInspect||0)>.95){const p=partPoint('clinical')?.insert;if(p){const q=project(p);s+=text(1450,490,'Polyethylene insert',34,C.ink,'end')+arrow([1220,460],[q[0]+180,q[1]+65],C.ink);}}
  if(b===2){
   const a=human?.getAttachment('left');
   if(a?.hipAnchor&&a?.kneeAnchor){
    const thigh=a.hipAnchor.clone().lerp(a.kneeAnchor,.56);
    s+=label(project(thigh),'Thigh muscles',-440,10);
   }
   // Pooled estimate for TKA populations, not a rate for all older adults.
   // The interval is uncertainty across the meta-analysis, not muscle-force loss.
   const x=920,y=310,w=570,max=40,value=20.1,lo=13.6,hi=28.8;
   const q=v=>x+w*v/max;
   s+=text(x+w/2,180,'Sarcopenia in TKA populations',42,C.ink);
   s+=`<path d="M${x} ${y+28}H${x+w}" fill="none" stroke="${C.line}" stroke-width="2"/>`;
   for(const v of[0,10,20,30,40])s+=`<path d="M${q(v)} ${y+24}v8" stroke="${C.line}" stroke-width="2"/>`+text(q(v),y+65,`${v}%`,32,C.muted);
   s+=`<path d="M${q(lo)} ${y}H${q(hi)}M${q(lo)} ${y-9}v18M${q(hi)} ${y-9}v18" fill="none" stroke="${C.accent}" stroke-width="4"/><circle cx="${q(value)}" cy="${y}" r="8" fill="${C.accent}"/>`;
   s+=text(q(value),y-30,'20.1%',62,C.accent)+text(x+w/2,430,'95% CI 13.6–28.8%',35,C.muted)+text(x+w/2,455,'Sumbal et al., 2024',27,C.muted);
  }
  if(b===3){
   if((live.bgExamples||0)<.98)return '';
   // The layer provides one real world-space label anchor per attached model.
   const labels=ctx.myoExamples?.labels||[];
   for(const item of labels){
    const anchor=item.position||item.anchor;
    if(!anchor)continue;
    const p=project(anchor);
    s+=text(p[0],28,item.name,38,C.ink);
   }
  }
  if(b===4&&ctx.conceptPoints){
   if((live.bgMotor||0)<.98)return '';
   const joint=project(ctx.conceptPoints.joint),motor=project(ctx.conceptPoints.motor);
   const y=Math.min(445,Math.max(joint[1],motor[1])+95);
   s+=label(joint,'Joint replacement',-230,80,C.ink)+arrow([1320,motor[1]-12],[motor[0]+25,motor[1]],C.ink)+text(1340,motor[1]-20,'BLDC Motor',36,C.ink,'start');
   s+=text((joint[0]+motor[0])/2,(joint[1]+motor[1])/2+9,'+',66,C.accent);
  }
  return s;
 }
 if(c===3){
  if(b===0)return '';
  const target=b===1?partPoint('link_3'):b===2?partPoint('plate'):b===3?partPoint('link_3'):null;
  if(target){const p=project(target),label=b===1?'Flexion':b===2?'Posterior translation':'Medial-pivot rotation';
   const start=b===1?[350,95]:b===2?[340,390]:[1190,95];
   s+=arrow(start,[p[0],p[1]-14])+text(start[0],start[1]-25,label,32,C.accent);
  }
  return s;
 }
 if(c===4){
  if(b===0){const p=project(ctx.springPoint('weak'));s+=arrow([p[0]-110,p[1]],[p[0]-20,p[1]])+arrow([p[0]+20,p[1]],[p[0]+110,p[1]])+text(1230,130,'Motor → spring → joint',30)+text(1230,185,'Series elastic actuation',25,C.muted);}
  if(b===1){s+=axes(1110,340,300,190,'δ','τ')+`<path d="M1110 340L1410 300M1110 340L1250 150" fill="none" stroke="${C.line}" stroke-width="3"/>`+text(1390,270,'Low stiffness',23,C.muted)+text(1250,115,'High stiffness',23,C.muted)+text(1260,400,'Yielding ↔ torque transmission',24,C.accent);}
  if(b===2||b===3){s+=text(400,50,'More compliant',29)+text(1160,50,'Stiffer',29)+text(800,505,'τ₁ = τ₂     ·     δ = δ₁ + δ₂',31);if(b===3){const p=project(ctx.springPoint('weak'));s+=arrow([240,420],[p[0]-20,p[1]+20])+text(240,465,'Coil contact',28,C.accent);}}
  if(b===4)return ctx.legacy();
  if(b>=5&&fea){
   s+=text(800,45,'110° spring rotation',32,C.accent)+feaLegend(fea);
  }
 }
 if(c===5){s+=conceptCurve(1130,300,280,180,live.deform);const names=['Prepare','Support','Release'];names.forEach((t,i)=>{s+=box(110+i*250,330,210,65,t,i===b);if(i<2)s+=arrow([330+i*250,362],[350+i*250,362],C.ink);});s+=text(450,110,'Motor torque → deflection → joint torque',28);}
 if(c===6){
  if(b===0)s+=text(1200,100,'Muscles + skeleton + device',30)+text(1200,160,'Recorded motor-hold walking',24,C.muted);
  if(b===1)s+=text(1230,90,'Muscle-driven motion',30,C.accent)+text(1230,160,'Ground contact',28)+text(1230,230,'Bilateral hardware',28);
  if(b===2)s+=box(1050,75,400,65,'Motor request',true)+arrow([1250,145],[1250,190],C.ink)+box(1050,200,400,90,'Physical actuator limits')+arrow([1250,300],[1250,345],C.ink)+text(1250,385,'Applied torque',30);
  if(b===3)s+=box(850,70,620,70,'Human + device + ground')+arrow([1160,150],[1160,210],C.ink)+box(850,220,620,90,'Gait / contact / muscle activation')+text(1160,385,'Current benchmark: 1.0 m/s',28,C.muted);
 }
 if(c===7){
  if(b<=1){s+=box(850,70,260,65,'Observation')+arrow([1120,103],[1190,103],C.ink)+box(1200,70,300,65,'Device policy',true)+arrow([1350,145],[1350,205],C.ink)+box(1200,215,300,65,'Motor torque')+arrow([1190,250],[1120,250],C.ink)+box(850,215,260,65,'Simulation');s+=`<path d="M980 210V140" stroke="${C.ink}" stroke-width="3" fill="none"/>`;if(b===1)s+=text(1180,365,'Repeated trials → policy update',29,C.accent);}
  if(b===2){s+=text(1180,80,'Reduce muscle effort',35,C.accent)+box(870,140,610,65,'Muscle activation cost ↓',true)+text(1175,265,'Keep gait and physical limits',28)+box(870,310,610,65,'Speed · posture · actuator feasibility');}
  if(b===3)s+=box(840,85,300,85,'Full-state teacher',true)+arrow([1150,128],[1200,128],C.ink,true)+box(1210,85,300,85,'Limited-sensing policy',false,true)+text(1175,245,'Teacher development → later transfer',27,C.muted)+text(1175,340,'Assistance benefit still requires validation',24,C.muted);
 }
 if(c===8){if(b===0)s+=text(320,90,'Natural motion',32)+text(1280,90,'Nonlinear elasticity',32);else s+=text(320,90,'Timely support',32,C.accent)+text(1280,90,'Control validation',32,C.ink);}
 return s;
}
