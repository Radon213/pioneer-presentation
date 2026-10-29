import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const raw=fs.readFileSync(new URL('../../pioneer-interactive/assets/aakj-v3-native-rebound.glb',import.meta.url));
const g=JSON.parse(raw.subarray(20,20+raw.readUInt32LE(12)));
test('exactly one native E-LBBH6L visual is owned by the slider frame, not its old composite',()=>{
 const visual=g.nodes.filter(n=>n.extras?.source_gltf_root==='E-LBBH6L');assert.equal(visual.length,1);
 const parents=new Map();g.nodes.forEach((n,i)=>(n.children||[]).forEach(c=>parents.set(c,i)));
 let i=g.nodes.indexOf(visual[0]);const chain=[];while(parents.has(i)){i=parents.get(i);chain.push(g.nodes[i].name);}
 assert.equal(chain[0],'e_lbbh6l__1_');assert.ok(chain.includes('JOINT::slider_1'));
 assert.ok(!chain.includes('body_c_cfs2_4_5__cut_extrude1'));
});
