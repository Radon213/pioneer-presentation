// Anatomy labels follow real surfaces. The argument belongs in the slide copy;
// no second prose column is painted beside the model.
const C={ink:'#2d3142',accent:'#bf4520',muted:'#4f5d75',paper:'#fdfcf8'};
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const text=(x,y,s,z=26,c=C.ink,a='middle')=>`<text x="${x}" y="${y}" font-size="${z}" fill="${c}" text-anchor="${a}" stroke="${C.paper}" stroke-width="5" paint-order="stroke">${s}</text>`;
function arrow(a,b,c=C.accent){const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,x=dx/d,y=dy/d;return `<path d="M${a.join(' ')}L${b.join(' ')}m${-12*x+6*y} ${-12*y-6*x}l${12*x-6*y} ${12*y+6*x}l${-12*x-6*y} ${-12*y+6*x}" fill="none" stroke="${c}" stroke-width="2.5"/>`;}
export function buildBackgroundOverlay(ctx){
 const {build:b,live,project,partPoint,human}=ctx;let s='';
 if(b===0){
  const p=clamp(live.bgSurfaceLabels||0),surfaces=human?.getJointSurfaceLandmarks?.();if(!surfaces||p<=0)return '';
  const targets=[project(surfaces.medial),project(surfaces.lateral)],mid=project(surfaces.center),x=clamp(mid[0]+320,950,1290),y=clamp(mid[1]-100,110,390);
  return `<g opacity="${p.toFixed(4)}">`+text(x,y,'Joint surfaces',38,C.accent)+targets.map(q=>arrow([x-55,y+18],q)).join('')+'</g>';
 }
 if(b===1&&(live.bgInspect||0)>.95){const p=partPoint('clinical')?.insert;if(p){const q=project(p);s+=text(1330,470,'Polyethylene insert',32,C.ink)+arrow([1230,443],[q[0]+120,q[1]+50],C.ink);}return s;}
 if(b===2){
  const p=clamp(live.bgChart??1),smooth=t=>t*t*(3-2*t),phase=(a,b)=>clamp((p-a)/(b-a));
  const fade=(a,b,content)=>`<g opacity="${smooth(phase(a,b)).toFixed(4)}">${content}</g>`,grow=(a,b)=>1-Math.pow(1-phase(a,b),3);
  const a=human?.getAttachment('left');
  if(a?.hipAnchor&&a?.kneeAnchor){const thigh=project(a.hipAnchor.clone().lerp(a.kneeAnchor,.56));s+=fade(.06,.28,text(thigh[0]-230,thigh[1]+10,'Thigh muscles',34,C.accent)+arrow([thigh[0]-115,thigh[1]+25],thigh));}
  const x=970,w=480,pre=grow(.24,.65),post=grow(.46,.88);
  s+=fade(.06,.28,text(1220,135,'Quadriceps strength',42)+text(1220,178,'Preoperative level = 100',28,C.muted));
  s+=fade(.16,.35,text(x,218,'Before knee replacement',31,C.ink,'start'));
  s+=`<g data-strength-bar="pre" data-progress="${pre.toFixed(4)}" transform="translate(${x} 235) scale(${pre.toFixed(5)} 1)"><rect width="${w}" height="34" fill="${C.ink}"/></g>`;
  s+=fade(.62,.76,text(x+w+20,263,'100',36,C.ink,'start'));
  s+=fade(.36,.53,text(x,318,'One month after surgery',31,C.ink,'start'));
  s+=`<g data-strength-bar="post" data-progress="${post.toFixed(4)}" transform="translate(${x} 335) scale(${post.toFixed(5)} 1)"><rect width="${w*.38}" height="34" fill="${C.accent}"/></g>`;
  s+=fade(.85,.96,text(x+w*.38+20,363,'38',36,C.accent,'start'))+fade(.86,1,text(1370,375,'−62%',64,C.accent));
  return s+fade(.10,.30,text(1220,438,'n = 20 · mean 27 days after surgery',26,C.muted)+text(1220,475,'Mizner et al., JBJS, 2005',26,C.muted));
 }
 if(b===3){if((live.bgExamples||0)<.98)return '';for(const item of ctx.myoExamples?.labels||[]){const anchor=item.position||item.anchor;if(anchor){const p=project(anchor);s+=text(p[0],28,item.name,38);}}return s;}
 if(b===4&&ctx.conceptPoints){
  if((live.bgMotor||0)<.98)return '';
  const joint=project(ctx.conceptPoints.joint),motor=project(ctx.conceptPoints.motor),y=clamp(Math.max(joint[1]+155,motor[1]+155),395,480);
  // Equal baselines tie names to the two objects; no leader crosses the bone,
  // motor, or their intended plus-sign relationship.
  return text(joint[0],y,'Knee implant',34)+text(motor[0],y,'BLDC Motor',34)+text((joint[0]+motor[0])/2,(joint[1]+motor[1])/2+9,'+',66,C.accent);
 }
 return s;
}
