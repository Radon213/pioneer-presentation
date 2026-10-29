import {buildBackgroundOverlay} from './background-overlay.js?v=revision-20261029-55';
import {buildArchivedSpringChart} from './archived-spring-chart.js?v=revision-20261029-55';
import {buildDiagram} from './chapter-diagram-layer.js?v=revision-20261029-55';
import {springFEAColor} from './spring-fea-layer.js?v=revision-20261029-55';
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
 if(c===1){if(!fea)return '';const p=project(fea.group.position);return text(p[0],p[1]+155,'Double-spiral spring',28);}
 if(c===5)return '';
 if(c===6)return ''; // The main conclusion copy already carries this message.
 if(c===4&&b===0){const a=partPoint('motor_shaft'),o=partPoint('squre_splined_bevel_gear');let labels='';for(const [p,label,dy]of[[a,'θᵢₙ',-55],[o,'θₒᵤₜ = 0°',55]])if(p){const q=project(p),labelY=Math.max(42,Math.min(490,q[1]+dy));labels+=text(Math.max(85,q[0]-150),labelY,label,31,C.accent)+arrow([Math.max(110,q[0]-115),labelY+10],[q[0]-10,q[1]],C.accent);}return labels;}
 if(c===4&&(b===1||b===2||b===3)){const motion=ctx.springMotion;if(!motion)return '';let marks='';for(const [unit,label,value]of[['weak','Low k',motion.lowDeflectionDeg],['strong','High k',motion.highDeflectionDeg]]){const q=project(ctx.springPoint(unit));marks+=text(q[0],Math.min(510,q[1]+(b===3?90:100)),b===3?(unit==='weak'?'Lower spring · k₁':'Upper spring · k₂'):`${label}: ${value.toFixed(0)}°`,30,C.accent);}return marks;}
 if(c===4&&b===4&&ctx.springMotion?.contact){const q=project(partPoint('contactBoundary')),centre=project(ctx.springPoint('weak'));return `<circle cx="${q[0]}" cy="${q[1]}" r="17" fill="none" stroke="${C.accent}" stroke-width="3"/>`+text(centre[0],Math.min(545,centre[1]+225),'Gap closing',32,C.accent);}
 if(c===4)return ''; // The persistent native spring and dedicated figure panel own this chapter.
 const diagram=buildDiagram(c,b,{progress:1,reducedMotion:true});
 if(diagram)return diagram;
 if(c===2)return buildBackgroundOverlay(ctx);
 if(c===3){
  const dot=(p,r=8,color=C.accent)=>`<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${C.paper}" stroke="${color}" stroke-width="3"/>`;
  const path=(pts,color=C.accent,dash=false,width=3)=>`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${dash?'stroke-dasharray="6 6"':''}/>`;
  const at=k=>project(point(frame.jointCenters[k]));
  const leader=(p,x,y,label,color=C.accent)=>{
   // Stop outside the glyph rectangle. A line ending below its baseline can
   // still slash diagonally through the words when the anchor is above it.
   const end=p[1]<y-26?[x,y-26]:p[1]>y+14?[x,y+14]:[x+(p[0]<x?-1:1)*(label.length*32*.32+18),y-8];
   return '<g data-hardware-leader="true">'+path([p,end],color,false,1.5)+text(x,y,label,32,color)+'</g>';
  };
  if(b===0){
   const trace=Array.from({length:75},(_,i)=>project(point(ctx.history(.86*i/74).femoralReference))),reference=project(point(frame.femoralReference));
   return path(trace,C.accent,true,4)+leader(reference,1320,100,'Rotation + translation');
  }

  if(b===1){
   const pts=['j1','j2','j3','j4'].map(at);s+=path([...pts,pts[0]],C.ink,false,4);
   pts.forEach((p,i)=>s+=`<circle cx="${p[0]}" cy="${p[1]}" r="${i===1?8:6}" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.5" ${i===1?'stroke-dasharray="3 3"':''}/>`);
   const trace=Array.from({length:75},(_,i)=>project(point(ctx.history(.86*i/74).femoralReference))),reference=project(point(frame.femoralReference));
   s+=path(trace,C.accent,true,3)+dot(reference,8)+text(350,65,'Femoral trajectory',34,C.ink);
   s+=leader(reference,1260,410,'Link-fixed reference');
   return s;
  }
  if(b===2||b===3){
   const j=at('j3'),slider=at('slider'),p=at('pivot'),p0=ctx.history(0).jointCenters;
   if(b===2){s+=dot(j,10)+arrow(project(point(p0.j3)),j)+leader(j,350,80,'Joint 3 descends');s+=dot(slider,9)+arrow(project(point(p0.slider)),slider)+leader(slider,1190,395,'Slider retracts');}
   const pivot=point(frame.jointCenters.pivot),r=.031,theta=frame.pivotDeg*Math.PI/180;
   const onArc=a=>project(pivot.clone().add(point([r*Math.cos(a),0,-r*Math.sin(a)])));
   s+=dot(p,10,C.ink)+path([onArc(0),p,onArc(theta)],C.ink,false,2);
   s+=path(Array.from({length:25},(_,i)=>onArc(theta*i/24)),C.accent,false,4);
   s+=leader(p,b===3?350:380,b===3?105:365,'Medial pivot',C.ink);
   s+=text(1190,90,`${Math.abs(frame.pivotDeg).toFixed(1)}°`,60,C.accent)+text(1190,130,'Axial rotation',29,C.ink);
   if(b===2)s+=text(800,495,`J3 ↓ ${Math.abs(frame.h3mm).toFixed(1)} mm     ·     Slider ${Math.abs(frame.sliderMm).toFixed(1)} mm`,30,C.muted);
   return s;
  }
  if(b===4){
   const motor=partPoint('motor::'),gear=partPoint('helical_1m_21t'),output=partPoint('link_3');
   const zoom=ctx.hardwareZoomProgress??1;
   if(gear){const p=project(gear);s+=leader(p,Math.min(1330,p[0]+300),Math.max(100,p[1]-110),'Gears',C.ink);}
   if(zoom>.6&&motor){const p=project(motor);s+=leader(p,Math.max(240,p[0]-230),Math.max(75,p[1]-55),'Motor',C.ink);}
   if(zoom>.6&&output){const p=project(output);s+=leader(p,Math.min(1340,p[0]+300),Math.min(465,p[1]+70),'Joint motion');}
   return s;
  }
  if(b===5){
   const motor=partPoint('motor::'),spring=ctx.springPoint('weak').lerp(ctx.springPoint('strong'),.5),output=partPoint('squre_splined_bevel_gear');
   if(motor)s+=leader(project(motor),320,80,'BLDC motor',C.ink);
   if(spring)s+=leader(project(spring),1280,285,'Spring assembly');
   if(output)s+=leader(project(output),320,450,'Output shaft',C.ink);
   return s;
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
