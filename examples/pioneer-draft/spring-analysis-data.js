import {loadJSONWithProgress,reportLoadStage} from './asset-loading.js?v=revision-20261029-44';
// Quantitative scalars stay in JSON at source precision. Large display fields
// are typed binary views; no millions-of-number JSON.parse or boxed row arrays.
let pending=null;
async function loadDisplayBinary(url,expected,priority){
 const key='spring-analysis',label='Double-spiral FEA frames';let loaded=0;
 const emit=detail=>reportLoadStage(key,detail.stage??'download',{label,...detail});
 emit({phase:'download',loadedBytes:0,totalBytes:expected,ratio:0});
 const response=await fetch(url,{priority});if(!response.ok)throw Error(`${label}: HTTP ${response.status}`);
 const chunks=[],reader=response.body?.getReader(),encoded=!(response.headers.get('content-encoding')||'').includes('gzip');
 if(reader){while(true){const{done,value}=await reader.read();if(done)break;chunks.push(value);loaded+=value.byteLength;emit({phase:'download',loadedBytes:loaded,totalBytes:encoded?expected:null,ratio:encoded&&loaded<=expected?loaded/expected:null,transferBasis:encoded?'gzip-file-bytes':'decoded-response-body'});}}
 else{const bytes=new Uint8Array(await response.arrayBuffer());chunks.push(bytes);loaded=bytes.byteLength;}
 emit({phase:'decode',stage:'decompress',loadedBytes:loaded,totalBytes:loaded,ratio:null});
 const blob=new Blob(chunks);const buffer=encoded?await new Response(blob.stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():await blob.arrayBuffer();
 emit({phase:'parse',stage:'typed-array-views',loadedBytes:loaded,totalBytes:loaded,decodedBytes:buffer.byteLength,ratio:null});
 return{buffer,loaded,emit};
}
export function loadSpringAnalysis(priority='high'){
 if(!pending)pending=(async()=>{
  const started=performance.now();
  const [data,binary]=await Promise.all([
   loadJSONWithProgress(new URL('assets/motion/spring-analysis-110.display.json',import.meta.url),{key:'spring-analysis-meta',label:'Spring quantitative metadata',priority,expectedDecodedBytes:616784}),
   loadDisplayBinary(new URL('assets/motion/spring-analysis-110.display.bin.gz',import.meta.url),4853112,priority)
  ]);
  if(binary.buffer.byteLength!==data._binary.byteLength)throw Error('Spring display binary byte count mismatch');
  if(new Uint8Array(new Uint16Array([1]).buffer)[0]!==1)throw Error('Spring display binary requires a little-endian browser');
  const constructors={Float32:Float32Array,Float64:Float64Array,Uint16:Uint16Array};
  for(const field of data._binary.descriptors){
   const T=constructors[field.type];if(!T)throw Error('Unknown spring typed field');
   const flat=new T(binary.buffer,field.offset,field.count);let value=flat;
   if(field.shape.length===2){
    const width=field.shape[1],rows=field.shape[0];
    // Array-compatible row views are created only when a legacy viewer asks
    // for a row. Do not allocate 365,000 tiny displacement objects at loading.
    const target=new Array(rows);Object.defineProperties(target,{flatView:{value:flat},rowWidth:{value:width},flat:{value:()=>Array.from(flat)}});
    value=new Proxy(target,{
     get(array,key,receiver){if(typeof key==='string'&&/^(0|[1-9]\d*)$/.test(key)){const i=Number(key);return i<rows?flat.subarray(i*width,(i+1)*width):undefined;}return Reflect.get(array,key,receiver);},
     has(array,key){return typeof key==='string'&&/^(0|[1-9]\d*)$/.test(key)?Number(key)<rows:Reflect.has(array,key);}
    });
   }
   let parent=data;for(const part of field.path.slice(0,-1))parent=parent[part];parent[field.path.at(-1)]=value;
  }
  Object.defineProperty(data,'displayLoadMetrics',{value:{totalReadyMs:performance.now()-started,decodedBinaryBytes:binary.buffer.byteLength,metadataBytes:616784,binaryTransferBodyBytes:binary.loaded}});
  binary.emit({phase:'ready',stage:'ready',state:'complete',ratio:1,loadedBytes:binary.loaded,totalBytes:binary.loaded,decodedBytes:binary.buffer.byteLength});
  return data;
 })().catch(error=>{pending=null;reportLoadStage('spring-analysis','error',{state:'error',phase:'error',error:String(error.message||error)});throw error;});
 return pending;
}
