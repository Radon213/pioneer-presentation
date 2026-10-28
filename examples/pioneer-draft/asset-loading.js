/** Real body-byte progress only. The caller owns any labelled, weighted overall
 * download/setup progress. Content-Length of an HTTP-gzipped response measures
 * encoded bytes, while fetch.body normally yields decoded bytes: never divide
 * those two. Explicit .gz files are measured before manual decompression.
 */
const states=new Map();
const now=()=>globalThis.performance?.now?.()??Date.now();
function publish(detail,onProgress){
 const row={...detail,timestamp:now()};states.set(row.key,row);onProgress?.({...row});
 if(typeof globalThis.dispatchEvent==='function'&&typeof CustomEvent==='function')globalThis.dispatchEvent(new CustomEvent('pioneer-load-progress',{detail:{...row}}));
 return row;
}
export function reportLoadStage(key,stage,detail={}){
 return publish({key:String(key),label:detail.label??String(key),phase:'setup',stage,state:'running',ratio:null,loadedBytes:null,totalBytes:null,...detail});
}
export function getLoadProgress(){return Array.from(states.values(),s=>({...s}));}
export function clearLoadProgress(key){if(key===undefined)states.clear();else states.delete(String(key));}

export async function loadJSONWithProgress(url,options={}){
 const {label='Research asset',key=String(url),expectedBytes,expectedDecodedBytes,signal,priority='high',onProgress,compression='auto',...fetchOptions}=options;
 const id=String(key),emit=d=>publish({key:id,label,phase:'download',stage:'download',state:'running',ratio:null,...d},onProgress);
 let loaded=0,total=null,lengthSource=null,encoding='',basis='decoded-response-body';
 try{
  emit({loadedBytes:0,totalBytes:null});
  const response=await fetch(url,{...fetchOptions,signal,priority});if(!response.ok)throw Error(`${label}: HTTP ${response.status}`);
  encoding=(response.headers.get('content-encoding')||'').toLowerCase();
  const explicitGzip=compression==='gzip'||(compression==='auto'&&/\.gz(?:[?#]|$)/i.test(String(url)));
  const gzipFile=explicitGzip&&!encoding.includes('gzip');
  basis=gzipFile?'gzip-file-bytes':'decoded-response-body';
  const header=Number(response.headers.get('content-length'));
  if(Number.isFinite(expectedBytes)&&expectedBytes>0){total=expectedBytes;lengthSource='explicit-expected-body-bytes';}
  else if(!encoding&&Number.isFinite(header)&&header>0){total=header;lengthSource='content-length-identity-body';}
  // A successful response without body (older engines) still gives final actual
  // bytes, but cannot claim granular download observations.
  const chunks=[];const reader=response.body?.getReader();
  if(reader){
   while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);loaded+=value.byteLength;
    const mismatch=total!==null&&loaded>total;emit({loadedBytes:loaded,totalBytes:total,ratio:total&&!mismatch?loaded/total:null,lengthSource,transferBasis:basis,contentEncoding:encoding||'identity',lengthMismatch:mismatch});}
  }else{const bytes=new Uint8Array(await response.arrayBuffer());chunks.push(bytes);loaded=bytes.byteLength;}
  const mismatch=total!==null&&loaded!==total;
  emit({loadedBytes:loaded,totalBytes:total??loaded,ratio:1,lengthSource:lengthSource??'observed-complete-body',transferBasis:basis,contentEncoding:encoding||'identity',lengthMismatch:mismatch,state:'complete',downloadComplete:true});
  let bytes=new Uint8Array(loaded),offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  if(gzipFile){
   if(typeof DecompressionStream!=='function')throw Error(`${label}: this browser cannot decompress the gzip asset`);
   emit({phase:'decode',stage:'decompress',state:'running',ratio:null,loadedBytes:loaded,totalBytes:total,transferBasis:basis});
   const decoded=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();bytes=new Uint8Array(decoded);
   emit({phase:'decode',stage:'decompress',state:'complete',ratio:1,loadedBytes:loaded,totalBytes:total,decodedBytes:bytes.byteLength,expectedDecodedBytes:expectedDecodedBytes??null,decodedLengthMismatch:Number.isFinite(expectedDecodedBytes)&&expectedDecodedBytes!==bytes.byteLength,transferBasis:basis});
  }
  emit({phase:'parse',stage:'parse',state:'running',ratio:null,loadedBytes:loaded,totalBytes:total,decodedBytes:bytes.byteLength,transferBasis:basis});
  const result=JSON.parse(new TextDecoder().decode(bytes));
  emit({phase:'ready',stage:'ready',state:'complete',ratio:1,loadedBytes:loaded,totalBytes:total??loaded,decodedBytes:bytes.byteLength,lengthMismatch:mismatch,transferBasis:basis});return result;
 }catch(error){emit({phase:'error',stage:'error',state:'error',ratio:null,loadedBytes:loaded,totalBytes:total,error:String(error?.message||error),transferBasis:basis});throw error;}
}

/** Losslessly compressed binary body with honest encoded-byte progress. */
export async function loadBinaryWithProgress(url,{key='binary',label='Research asset',expectedBytes,compression='gzip',priority='high'}={}){
 let loaded=0;const emit=(phase,detail={})=>reportLoadStage(key,phase,{label,phase,state:'running',loadedBytes:loaded,totalBytes:expectedBytes??null,transferBasis:compression==='gzip'?'gzip-file-bytes':'decoded-response-body',...detail});
 try{emit('download',{ratio:0});const response=await fetch(url,{priority});if(!response.ok)throw Error(`${label}: HTTP ${response.status}`);const chunks=[],reader=response.body?.getReader();if(reader){while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);loaded+=value.byteLength;emit('download',{ratio:expectedBytes?Math.min(1,loaded/expectedBytes):null});}}else{const value=new Uint8Array(await response.arrayBuffer());chunks.push(value);loaded=value.byteLength;}
 emit('download',{ratio:1,state:'complete'});emit('decode',{ratio:null});const blob=new Blob(chunks),buffer=compression==='gzip'&&!response.headers.get('content-encoding')?.includes('gzip')?await new Response(blob.stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():await blob.arrayBuffer();emit('decode',{state:'complete',ratio:1,decodedBytes:buffer.byteLength});return buffer;
 }catch(error){emit('error',{state:'error',error:String(error?.message||error)});throw error;}
}
