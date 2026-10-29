import test from 'node:test';
import assert from 'node:assert/strict';
import slides from '../deck-data.js';

const control=slides.find(s=>s.title==='Control');
const audience=s=>[s.caption,s.subtitle,s.body,s.question].filter(Boolean).join(' ').replace(/<[^>]+>/g,' ');

test('the complete talk retains its twelve-minute, under-thirty-state contract',()=>{
 assert.equal(slides.length,6);
 assert.deepEqual(slides.map(s=>s.id),[1,2,3,4,5,6]);
 assert.equal(slides.reduce((sum,s)=>sum+s.stages.length,0),30);
 assert.equal(slides.reduce((sum,s)=>sum+s.duration,0),720);
 assert.equal(slides.at(-1).title,'Conclusion');
});

test('Control advances from spring-state preparation to a nominal result and walking challenge',()=>{
 assert.equal(control.stages.length,10);
 assert.equal(control.duration,275);
 assert.equal(control.stages.reduce((sum,s)=>sum+s.duration,0),control.duration);
 assert.match(audience(control.stages[0]),/spring.*state|elastic state/i);
 assert.match(audience(control.stages[1]),/inside the body/i);
 assert.match(audience(control.stages[1]),/sensors.*output motion.*spring deformation.*hard to place/is);
 assert.match(audience(control.stages[1]),/motor.side signals/i);
 assert.match(audience(control.stages[2]),/prepare.*assist.*release/is);
 assert.match(audience(control.stages[3]),/teacher/i);
 assert.match(audience(control.stages[4]),/device.side|sensing/i);
 assert.match(audience(control.stages[5]),/student|imitation/i);
 assert.match(audience(control.stages[6]),/preliminary.*sit.to.stand/is);
 assert.match(audience(control.stages[7]),/walking/i);
});

test('the implemented student adjusts spring targets through the physical execution path',()=>{
 const student=control.stages[5];
 assert.match(audience(student),/imitation/i);
 assert.match(audience(student),/spring.torque targets/i);
 assert.doesNotMatch(audience(student),/planned|not yet|future student/i);
 assert.match(student.notes,/two.*desired.spring.torque residuals/i);
 assert.match(student.notes,/10 Hz/);
 assert.match(student.notes,/100 Hz/);
 assert.match(student.notes,/fixed servo/i);
 assert.match(student.notes,/best_iteration=0/);
});

test('the sensing contract declares cue and proxy assumptions rather than hidden human-state access',()=>{
 const sensing=control.stages[4];
 assert.match(audience(sensing),/local cue/i);
 assert.match(sensing.notes,/18 features.*three.*frames/is);
 assert.match(sensing.notes,/previous motor requests/i);
 assert.match(sensing.notes,/ideal current.to.torque proxy/i);
 assert.match(sensing.notes,/No true output angle, muscle activation or hidden human state/i);
});

test('preliminary results do not become an effort, robustness or PPO-benefit headline',()=>{
 const publicText=control.stages.map(audience).join(' ');
 assert.doesNotMatch(publicText,/\d+(?:\.\d+)?\s*%/);
 assert.doesNotMatch(publicText,/\b32\s*\/\s*32\b|\b96\s*\/\s*96\b/);
 assert.doesNotMatch(publicText,/PPO (?:gain|improvement|benefit)|robust success|clinically validated/i);
 const result=control.stages[6];
 assert.match(audience(result),/nominal/i);
 assert.match(audience(result),/audits remain/i);
 assert.match(result.notes,/diagnostic_only=true/);
 assert.match(result.notes,/qualified=false/);
 assert.match(result.notes,/noise=0/);
 assert.match(result.notes,/zero.neural.residual/i);
 assert.match(control.stages[7].notes,/different walking controller and experiment/i);
 assert.match(control.stages[9].notes,/26.9548206 W/);
});
