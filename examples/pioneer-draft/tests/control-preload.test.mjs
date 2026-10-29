import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PRELOAD_CURVE,preloadTorqueNm,preloadEnergyJ,preloadOperatingPoint} from '../control-preload-data.js';
const d=JSON.parse(fs.readFileSync(new URL('../assets/control-preload-curves.json',import.meta.url)));
test('preload curve is the signed simulation law without an artificial deflection cap',()=>{
 assert.equal(preloadTorqueNm(0),0);assert.ok(Math.abs(preloadTorqueNm(101.7)-6)<1e-12);
 assert.ok(preloadTorqueNm(103)>6);assert.equal(preloadTorqueNm(-90),-preloadTorqueNm(90));
 assert.equal(PRELOAD_CURVE[0].deltaDeg,-40);assert.equal(PRELOAD_CURVE.at(-1).deltaDeg,110);assert.ok(PRELOAD_CURVE.at(-1).extrapolated);
 assert.equal(d.archivedAnsysCurveUsed,false);assert.equal(d.clinicalOrPhysicalValidation,false);assert.equal(d.allProtectedSourcesUnchanged,true);
});
test('both experiment curves agree with actual saved spring channels within float precision',()=>{
 for(const [name,expected]of [['sts',1801],['walking',2719]]){
  const s=d.datasets[name],p=s.recordedPath;assert.equal(p.timeSec.length,expected);assert.equal(p.deltaDeg.length,expected);assert.equal(p.torqueNm.length,expected);
  const maxError=Math.max(...p.deltaDeg.map((x,i)=>Math.abs(preloadTorqueNm(x)-p.torqueNm[i])));
  assert.ok(maxError<.0001);assert.ok(Math.abs(maxError-s.validation.maxAbsoluteErrorNm)<1e-12);assert.ok(s.validation.signAgreementExcludingTinyValues);
  for(let i=0;i<s.curve.deltaDeg.length;i++)assert.ok(Math.abs(preloadTorqueNm(s.curve.deltaDeg[i])-s.curve.torqueNm[i])<1e-12);
 }
 assert.equal(d.datasets.sts.source.world,4);assert.equal(d.datasets.walking.source.world,1);
 assert.ok(d.datasets.sts.observedRange.deltaDeg[1]<101.7);assert.ok(d.datasets.walking.observedRange.deltaDeg[1]>101.7);
});
test('displayed operating point lies on the law while preserving separately interpolated recorded torque',()=>{
 const p=preloadOperatingPoint({springDeflectionDeg:98,springTorqueNm:3.6});assert.equal(p.deltaDeg,98);assert.equal(p.torqueNm,preloadTorqueNm(98));assert.equal(p.savedTorqueNm,3.6);assert.ok(p.energyJ>0);assert.equal(p.extrapolated,false);
 const h=.0001,x=90,numeric=(preloadEnergyJ(x+h)-preloadEnergyJ(x-h))/(2*h);assert.ok(Math.abs(numeric-preloadTorqueNm(x)*Math.PI/180)<1e-9);assert.equal(preloadEnergyJ(-90),preloadEnergyJ(90));assert.equal(preloadEnergyJ(0),0);
});
