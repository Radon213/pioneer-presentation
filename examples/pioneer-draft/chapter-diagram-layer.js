/** Figure-only Diagram Design architecture / line / process grammar.
 * Derived from the installed template.html, example-architecture.html and type
 * references. No slide shell styles or title are injected. Source diagrams are
 * complete static figures; the deck's one Next clock can reveal one focal pair.
 */
const P={paper:'#fdfcf8',ink:'#1a3a7a',muted:'#585950',soft:'#585950',rule:'#b5b3ab',accent:'#a44725',tint:'rgba(164,71,37,.055)'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const txt=(x,y,s,size=24,color=P.ink,anchor='middle',family='Playfair Display',weight=400)=>`<text x="${x}" y="${y}" font-family="'${family}',${family==='Playfair Display'?'Georgia,serif':'Georgia,serif'}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text>`;
const technical=(x,y,s,size=21,c=P.muted,a='middle')=>txt(x,y,s,size,c,a,'Playfair Display');
const callout=()=>'';
const rule=y=>`<line x1="24" y1="${y}" x2="696" y2="${y}" stroke="rgba(45,49,66,.16)" stroke-width="1"/>`;
function node(x,y,w,h,name,sub='',focal=false,dashed=false){return `<g data-node="${esc(name)}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${P.paper}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${focal?P.tint:'rgba(45,49,66,.025)'}" stroke="${focal?P.accent:P.muted}" stroke-width="${focal?2:1.3}" ${dashed?'stroke-dasharray="6 5"':''}/>${txt(x+w/2,y+h/2+(sub?-2:8),name,24,P.ink,'middle','Playfair Display',600)}${sub?technical(x+w/2,y+h/2+27,sub,21):''}</g>`;}
function arrow(d,id,accent=false,dashed=false){return `<path d="${d}" fill="none" stroke="${accent?P.accent:P.muted}" stroke-width="${accent?2.2:1.6}" ${dashed?'stroke-dasharray="5 4"':''} marker-end="url(#${id}-${accent?'accent':'arrow'})"/>`;}
function label(x,y,s,w=88){return `<rect x="${x-w/2}" y="${y-20}" width="${w}" height="26" rx="2" fill="${P.paper}"/>${technical(x,y,s,20)}`;}
function definitions(id){return `<defs><marker id="${id}-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="${P.muted}"/></marker><marker id="${id}-accent" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="${P.accent}"/></marker><marker id="${id}-link" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0,8 3,0 6" fill="#2e5aa8"/></marker></defs>`;}
function reveal(body,options){const p=options.reducedMotion?1:Math.max(0,Math.min(1,options.progress??1));return `<g data-motion-item="" data-step="1" opacity="${p}" transform="translate(0 ${4*(1-p)})">${body}</g>`;}
function sea(id,o){
 const edges=arrow('M184 188H264',id)+arrow('M448 188H524',id,true)+label(224,174,'TORQUE',76);
 return edges+node(24,144,160,88,'Motor','θm')+node(524,144,172,88,'Joint','θout')+reveal(node(264,132,184,112,'Spring','elastic state',true),o)+technical(360,320,'δ = θm − θout',25,P.ink)+callout(360,426,'A compliant link in the torque path');
}
function stiffness(id,o){
 return `<path d="M104 92V368H636" fill="none" stroke="${P.muted}" stroke-width="1.5"/><line x1="104" y1="276" x2="636" y2="276" stroke="rgba(45,49,66,.10)"/><line x1="104" y1="184" x2="636" y2="184" stroke="rgba(45,49,66,.10)"/><polyline points="104,368 636,300" fill="none" stroke="${P.muted}" stroke-width="2.3"/>`+reveal(`<polyline points="104,368 264,104" fill="none" stroke="${P.accent}" stroke-width="3"/>${txt(336,112,'High stiffness',24,P.accent,'start','Playfair Display',600)}`,o)+txt(456,280,'Low stiffness',24,P.muted,'start','Playfair Display',600)+technical(76,86,'τ',24,P.ink)+technical(656,392,'δ',24,P.ink)+technical(488,72,'τ = kδ',25,P.ink)+rule(424)+txt(360,466,'Conceptual slopes · no measured values',18,P.muted);
}
function controlState(id,o){
 return arrow('M196 204H264',id)+arrow('M456 204H524',id,true)+node(24,160,172,88,'Motor request','τrequest')+node(524,160,172,88,'Joint torque','τ = f(δ)')+reveal(node(264,144,192,120,'Elastic state','δ',true),o)+technical(360,332,'δ = θm − θout',25,P.ink)+callout(360,432,'How much deformation should we prepare?');
}
function timing(id,o){
 return `<path d="M48 248H680" stroke="${P.muted}" stroke-width="1.5" fill="none" marker-end="url(#${id}-arrow)"/><path d="M120 248V144M344 248V328M592 248V144" stroke="${P.rule}" stroke-width="1.3" fill="none"/><circle cx="120" cy="248" r="6" fill="${P.accent}"/><circle cx="344" cy="248" r="4" fill="${P.ink}"/><circle cx="592" cy="248" r="4" fill="${P.ink}"/>`+txt(120,116,'Prepare',26,P.accent,'middle','Playfair Display',600)+txt(344,366,'Support',24,P.ink,'middle','Playfair Display',600)+txt(592,116,'Release',24,P.ink,'middle','Playfair Display',600)+technical(660,286,'time',18)+reveal(`<path d="M128 208H328" fill="none" stroke="${P.accent}" stroke-width="2" marker-end="url(#${id}-accent)"/>${technical(228,180,'Ahead of demand',20,P.accent)}`,o)+rule(424)+txt(360,466,'Conceptual order · timing to be evaluated',18,P.muted);
}
function coupled(id,o){
 const a=arrow('M244 136H472',id)+arrow('M576 180V300',id,true)+arrow('M472 344H244',id)+arrow('M140 300V180',id,false,true);
 return a+node(32,92,212,88,'Movement','joint state')+node(472,92,216,88,'Controller','motor request',true)+node(472,300,216,88,'Motor + spring','physical limits')+reveal(node(32,300,212,88,'Human + joint','coupled response'),o)+callout(360,448,'Evaluate the person and device together');
}
function teacher(id,o,update=false){
 const flow=arrow('M252 140H468',id)+arrow('M580 196V304',id,true)+arrow('M468 348H252',id)+arrow('M140 304V184',id,false,true);
 return flow+node(24,96,228,88,'Observation','training state')+node(468,84,228,112,'Teacher policy','full state',true)+node(468,304,228,88,'Motor request','limits apply')+reveal(node(24,304,228,88,'Simulation','human + device'),o)+callout(360,466,update?'Repeated trials inform the policy update':'Training access is not a runtime sensor set');
}
function objective(id,o){return technical(24,80,'OBJECTIVE',20,P.muted,'start')+txt(24,136,'Lower muscle effort',30,P.accent,'start','Playfair Display',600)+`<line x1="24" y1="176" x2="696" y2="176" stroke="${P.rule}"/>`+technical(24,240,'SUBJECT TO',20,P.muted,'start')+reveal(txt(24,296,'Gait and physical feasibility',27,P.ink,'start','Playfair Display',600)+txt(24,340,'Speed · posture · actuator limits',22,P.muted,'start'),o)+rule(412)+txt(360,458,'Training objective · not a demonstrated benefit',18,P.muted);}
function student(id,o){return arrow('M268 180H448',id,false,true)+label(358,166,'PLANNED',100)+node(24,124,244,112,'Full-state teacher','simulator state',true)+reveal(node(448,124,248,112,'Student policy','runtime sensing',false,true),o)+callout(360,336,'Transfer after teacher qualification')+rule(388)+txt(360,436,'Assistance benefit still requires validation',18,P.muted);}
const SPECS={
 '4/0':{slug:'sea-path',title:'Series elastic torque path',desc:'The motor drives the joint through a spring, whose relative angle defines elastic deformation.',draw:sea,type:'architecture'},
 '4/1':{slug:'stiffness-tradeoff',title:'Linear stiffness trade-off',desc:'Conceptual low and high linear stiffness slopes explain the trade-off between yielding and torque transmission.',draw:stiffness,type:'line'},
 '5/0':{slug:'preload-state',title:'Preparing an elastic state',desc:'A motor request prepares spring deformation that maps to elastic torque at the joint.',draw:controlState,type:'architecture'},
 '5/1':{slug:'preload-timing',title:'Preload timing',desc:'Preparation precedes support demand and release in a conceptual sequence whose timing remains to be evaluated.',draw:timing,type:'timeline'},
 '5/2':{slug:'coupled-control',title:'Coupled control evaluation',desc:'Movement, a controller, motor limits and the human joint form a coupled evaluation loop.',draw:coupled,type:'architecture'},
 '7/0':{slug:'teacher-loop',title:'Full-state teacher loop',desc:'Simulation observations feed a full-state teacher whose limited motor request acts back on the human-device simulation.',draw:teacher,type:'architecture'},
 '7/1':{slug:'teacher-update',title:'Teacher policy development',desc:'Repeated simulation trials inform policy development without establishing assistance efficacy.',draw:(id,o)=>teacher(id,o,true),type:'architecture'},
 '7/2':{slug:'learning-objective',title:'Effort objective and constraints',desc:'The planned learning objective seeks lower muscle effort subject to gait and actuator feasibility, rather than reporting a measured benefit.',draw:objective,type:'process'},
 '7/3':{slug:'planned-student',title:'Planned limited-sensing student',desc:'A limited-sensing student is a planned transfer after teacher qualification, with assistance efficacy still to be validated.',draw:student,type:'architecture'}
};
export const CHAPTER_DIAGRAMS=Object.entries(SPECS).map(([key,s])=>({key,slug:s.slug,title:s.title,type:s.type}));
export function buildDiagram(chapter,build,options={}){
 const s=SPECS[`${chapter}/${build}`];if(!s)return '';const id=`dd-${s.slug}`;
 return `<g data-diagram-design="${s.type}" data-diagram-slug="${s.slug}" data-motion-mode="step" data-motion-state="${options.reducedMotion?'reduced':'settled'}" data-frame="end" font-family="Playfair Display,Georgia,serif">${definitions(id)}${s.draw(id,options)}</g>`;
}
export function diagramSVG(chapter,build){const s=SPECS[`${chapter}/${build}`];if(!s)return '';return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 500" role="img" aria-labelledby="${s.slug}-title ${s.slug}-desc"><title id="${s.slug}-title">${s.title}</title><desc id="${s.slug}-desc">${s.desc}</desc>${buildDiagram(chapter,build,{progress:1,reducedMotion:true}).replace('data-motion-mode="step"','data-motion-mode="none"')}</svg>`;}
