import {reportLoadStage} from './asset-loading.js?v=revision-20261029-61';

/** Decode a small manifest and create zero-copy views over one aligned buffer.
 * Mesh positions retain the exact Float32 values previously sent to the GPU;
 * motion arrays retain source Float64 values. No research source is changed.
 */
export function decodeGaitBinary(buffer){
 const view=new DataView(buffer),bytes=new Uint8Array(buffer);
 if(new TextDecoder().decode(bytes.subarray(0,8))!=='PGT1LE\0\0')throw Error('Invalid saved gait binary signature.');
 const length=view.getUint32(8,true),manifestEnd=12+length;
 if(manifestEnd>buffer.byteLength)throw Error('Truncated gait manifest.');
 const manifest=JSON.parse(new TextDecoder().decode(bytes.subarray(12,manifestEnd)));
 if(manifest.schema!=='pioneer-gait-binary-v1')throw Error('Unsupported gait binary schema.');
 const base=Math.ceil(manifestEnd/8)*8,types={f:Float32Array,d:Float64Array,H:Uint16Array,I:Uint32Array};
 function revive(value){
  if(!value||typeof value!=='object')return value;
  if(value.$typed){
   const Type=types[value.$typed];if(!Type||!Number.isInteger(value.offset)||!Number.isInteger(value.length)||value.offset<0||value.length<0)throw Error('Invalid gait typed descriptor.');
   const start=base+value.offset;if(start+value.length*Type.BYTES_PER_ELEMENT>buffer.byteLength)throw Error('Truncated gait typed buffer.');
   return new Type(buffer,start,value.length);
  }
  for(const key of Object.keys(value))value[key]=revive(value[key]);return value;
 }
 const data=revive(manifest.data);data.binarySourceSHA256=manifest.sourceSHA256;return data;
}

export async function loadGaitBinary(){
 const gzip=typeof DecompressionStream==='function';
 const expected=gzip?9174013:14892712,url=new URL(`./assets/gait-chapter-native-rebound.bin${gzip?'.gz':''}`,import.meta.url);
 const started=performance.now();let loaded=0;
 const emit=(phase,detail={})=>reportLoadStage('gait',phase,{label:'Bilateral walking',phase,state:'running',loadedBytes:loaded,totalBytes:expected,transferBasis:gzip?'gzip-file-bytes':'decoded-response-body',...detail});
 try{
  emit('download',{ratio:0});const response=await fetch(url,{priority:'high'});if(!response.ok)throw Error(`Bilateral walking: HTTP ${response.status}`);
  const chunks=[],reader=response.body?.getReader();
  if(reader){while(true){const {value,done}=await reader.read();if(done)break;chunks.push(value);loaded+=value.byteLength;emit('download',{ratio:Math.min(1,loaded/expected)});}}
  else{const value=new Uint8Array(await response.arrayBuffer());chunks.push(value);loaded=value.byteLength;}
  let buffer;
  // Blob accepts the streamed chunks directly: avoid a second compressed-body copy.
  const body=new Blob(chunks);emit('decode',{ratio:null,downloadComplete:true});
  if(gzip&&!response.headers.get('content-encoding')?.includes('gzip'))buffer=await new Response(body.stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  else buffer=await body.arrayBuffer();
  const downloaded=performance.now();emit('parse',{ratio:null,decodedBytes:buffer.byteLength});
  const data=decodeGaitBinary(buffer),parsed=performance.now();
  data.loadingMetrics={format:'typed-binary-v1',observedBodyBytes:loaded,decodedBytes:buffer.byteLength,downloadAndDecodeMs:downloaded-started,manifestAndViewsMs:parsed-downloaded,totalLoadMs:parsed-started};
  emit('ready',{state:'complete',ratio:1,decodedBytes:buffer.byteLength,metrics:data.loadingMetrics});return data;
 }catch(error){emit('error',{state:'error',ratio:null,error:String(error?.message||error)});throw error;}
}
