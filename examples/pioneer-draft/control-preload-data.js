/** Preserved simulation constitutive law, independently checked against the
 * selected STS and walking saved force channels. This is not an Ansys fit or a
 * validated physical material curve. |delta|>101.7 deg is source extrapolation. */
export const PRELOAD_LAW=Object.freeze({scaleNm:6,linearWeight:.23577,exponentialWeight:.76423,normalizationDeg:101.7,exponentPerDeg:.20960});
export function preloadTorqueNm(deltaDeg){
 const delta=Number(deltaDeg);if(!Number.isFinite(delta))return NaN;
 const x=Math.abs(delta),p=PRELOAD_LAW;
 return Math.sign(delta)*p.scaleNm*(p.linearWeight*x/p.normalizationDeg+p.exponentialWeight*Math.expm1(p.exponentPerDeg*x)/Math.expm1(p.exponentPerDeg*p.normalizationDeg));
}
export function preloadEnergyJ(deltaDeg){
 const x=Math.abs(Number(deltaDeg));if(!Number.isFinite(x))return NaN;
 const p=PRELOAD_LAW,c=p.exponentPerDeg,L=p.normalizationDeg;
 return p.scaleNm*(p.linearWeight*x*x/(2*L)+p.exponentialWeight*(Math.expm1(c*x)/c-x)/Math.expm1(c*L))*Math.PI/180;
}
export const PRELOAD_CURVE=Object.freeze(Array.from({length:301},(_,i)=>{
 const deltaDeg=-40+i*.5;return Object.freeze({deltaDeg,torqueNm:preloadTorqueNm(deltaDeg),extrapolated:Math.abs(deltaDeg)>PRELOAD_LAW.normalizationDeg});
}));
/** Curve point corresponding to the displayed elastic state. savedTorqueNm is
 * retained separately because display interpolation between samples does not
 * commute with this nonlinear law. Use torqueNm for a dot on the exact curve. */
export function preloadOperatingPoint(telemetry={}){
 const deltaDeg=Number(telemetry.springDeflectionDeg??telemetry.deltaDeg);
 return {deltaDeg,torqueNm:preloadTorqueNm(deltaDeg),energyJ:preloadEnergyJ(deltaDeg),savedTorqueNm:Number(telemetry.springTorqueNm??telemetry.torqueNm),extrapolated:Math.abs(deltaDeg)>PRELOAD_LAW.normalizationDeg};
}
export async function loadControlPreloadCurves(){
 const response=await fetch(new URL('./assets/control-preload-curves.json',import.meta.url));if(!response.ok)throw Error(`Preload curves: HTTP ${response.status}`);
 const data=await response.json();if(data.schema!=='pioneer-control-preload-curves-v1')throw Error('Invalid preload curve source data.');return data;
}
