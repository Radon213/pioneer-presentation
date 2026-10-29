import {loadBinaryWithProgress,reportLoadStage} from './asset-loading.js?v=revision-20261029-53';
export function decodeSourceBones(buffer){
 const view=new DataView(buffer),bytes=new Uint8Array(buffer);
 if(new TextDecoder().decode(bytes.subarray(0,8))!=='PCDB1LE\0')throw Error('Invalid source CAD bone signature');
 const length=view.getUint32(8,true);if(length>buffer.byteLength-12)throw Error('Truncated source CAD bone manifest');
 const meta=JSON.parse(new TextDecoder().decode(bytes.subarray(12,12+length))),base=Math.ceil((12+length)/4)*4;
 if(meta.schema!=='pioneer-source-cad-bones-v1')throw Error('Invalid source CAD bone schema');
 for(const mesh of Object.values(meta.meshes))for(const [key,Type]of [['positions',Float32Array],['indices',Uint32Array]]){
  const d=mesh[key];if(!Number.isInteger(d.offset)||!Number.isInteger(d.length)||d.offset<0||d.length<0||base+d.offset+d.length*4>buffer.byteLength)throw Error('Invalid source CAD bone buffer');mesh[key]=new Type(buffer,base+d.offset,d.length);
 }
 return meta;
}
export async function loadSourceBones(){
 const gzip=typeof DecompressionStream==='function';
 const buffer=await loadBinaryWithProgress(new URL(`./assets/gait-source-cad-bones.bin${gzip?'.gz':''}`,import.meta.url),{key:'gait-source-bones',label:'Original simulation CAD bones',expectedBytes:gzip?7918897:15496512,compression:gzip?'gzip':'none'});
 const result=decodeSourceBones(buffer);reportLoadStage('gait-source-bones','Original CAD bones decoded',{phase:'ready',state:'complete',ratio:1});return result;
}
