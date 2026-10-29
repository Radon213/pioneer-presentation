/** Preserve bold spans and natural word wrapping while revealing full sentences.
 * One WAAPI clock participates in navigation speed; no per-character timers. */
export function typeStageCopy(element,{enabled=true,rate=1,delay=100}={}){
 if(!enabled)return null;
 const paragraphs=[...element.querySelectorAll('p')],full=paragraphs.length?paragraphs.map(p=>p.textContent).join(' '):element.textContent,accessible=document.createElement('span');accessible.className='sr-only';accessible.textContent=full;
 const visual=document.createElement('div');visual.className='typed-copy';visual.setAttribute('aria-hidden','true');while(element.firstChild)visual.append(element.firstChild);element.append(accessible,visual);
 const walker=document.createTreeWalker(visual,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 const glyphs=[];let cursor=0;
 for(const node of nodes){
  const fragment=document.createDocumentFragment();
  for(const word of node.textContent.split(/(\s+)/)){
   if(!word)continue;if(/^\s+$/.test(word)){fragment.append(document.createTextNode(word));continue;}
   const group=document.createElement('span');group.className='typed-word';
   for(const letter of Array.from(word)){
    const glyph=document.createElement('span');glyph.textContent=letter;glyph.style.opacity='0';group.append(glyph);glyphs.push({glyph,at:cursor});cursor+=14;if(/[.!?]/.test(letter))cursor+=110;
   }
   fragment.append(group);
  }
  node.replaceWith(fragment);
 }
 const clock=visual.animate([{opacity:1},{opacity:1}],{duration:Math.max(1,cursor+delay),fill:'both'});clock.playbackRate=rate;
 let frame=0,index=0;
 const show=()=>{const elapsed=Number(clock.currentTime)||0;while(index<glyphs.length&&glyphs[index].at+delay<=elapsed)glyphs[index++].glyph.style.opacity='1';if(clock.playState==='running'||clock.playState==='pending')frame=requestAnimationFrame(show);};frame=requestAnimationFrame(show);
 const complete=()=>{cancelAnimationFrame(frame);for(const {glyph}of glyphs)glyph.style.opacity='1';};clock.finished.then(complete,complete);return clock;
}
