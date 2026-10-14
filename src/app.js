document.documentElement.classList.add('js');
const slides=[...document.querySelectorAll('.slide')];
const mobile=matchMedia('(max-width:850px)');
const contents=document.getElementById('contents');
let index=0;
function hashIndex(){const n=slides.findIndex(slide=>'#'+slide.id===location.hash);return n<0?0:n;}
function fitFullscreen(){
 if(!document.fullscreenElement||mobile.matches||!slides.length)return;
 const lesson=slides[index].closest('.lesson'),slide=slides[index],notes=lesson.querySelector('.explanation');
 const gap=parseFloat(getComputedStyle(lesson).columnGap)||24;
 const width=lesson.clientWidth-notes.offsetWidth-gap,height=lesson.clientHeight;
 const scale=Math.min(width/slide.offsetWidth,height/Math.max(slide.offsetHeight,slide.scrollHeight));
 slide.style.setProperty('--slide-scale',scale);
 slide.style.setProperty('--slide-left',`${Math.max(0,(width-slide.offsetWidth*scale)/2)}px`);
 slide.style.setProperty('--slide-top','0px');
 const prose=notes.querySelector('p');
 for(let size=20;size>=14;size-=.5){prose.style.fontSize=`${size}px`;if(notes.scrollHeight<=notes.clientHeight+1)break;}
}
function show(n,scroll=false){
 if(!slides.length)return;
 index=Math.max(0,Math.min(slides.length-1,n));
 slides.forEach((s,i)=>{s.classList.toggle('active',i===index);s.closest('.lesson').classList.toggle('active',i===index);});
 document.getElementById('page-counter').textContent=`${String(index+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
 document.getElementById('prev').disabled=index===0;
 document.getElementById('first').disabled=index===0;
 document.getElementById('next').disabled=index===slides.length-1;
 requestAnimationFrame(fitFullscreen);
 if(scroll){if(mobile.matches)slides[index].scrollIntoView({block:'start'});else window.scrollTo(0,0);}
}
function go(n){const target=Math.max(0,Math.min(slides.length-1,n));history.replaceState(null,'','#'+slides[target].id);show(target,true);}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{const button=document.getElementById('fullscreen');if(button)button.textContent='浏览器未允许全屏';}}
if(slides.length){
 show(hashIndex());
 if(location.hash&&mobile.matches)slides[index].scrollIntoView({block:'start'});
 document.getElementById('prev').addEventListener('click',()=>go(index-1));
 document.getElementById('first').addEventListener('click',()=>go(0));
 document.getElementById('next').addEventListener('click',()=>go(index+1));
 const toggle=document.getElementById('contents-toggle');
 toggle.addEventListener('click',()=>{contents.hidden=!contents.hidden;toggle.setAttribute('aria-expanded',String(!contents.hidden));});
 contents.addEventListener('click',event=>{if(event.target.closest('a')){contents.hidden=true;toggle.setAttribute('aria-expanded','false');}});
 addEventListener('hashchange',()=>{if(location.hash.startsWith('#slide-'))show(hashIndex(),true);});
 document.addEventListener('keydown',event=>{
  if(event.target.closest('input,textarea,[contenteditable="true"]'))return;
  if(event.key==='ArrowRight'){event.preventDefault();go(index+1);}
  if(event.key==='ArrowLeft'){event.preventDefault();go(index-1);}
  if(event.key==='Home'){event.preventDefault();go(0);}
  if(event.key.toLowerCase()==='f'){event.preventDefault();fullscreen();}
  if(event.key==='Escape'){contents.hidden=true;toggle.setAttribute('aria-expanded','false');}
 });
 const fsButton=document.getElementById('fullscreen');if(fsButton)fsButton.addEventListener('click',fullscreen);
 mobile.addEventListener('change',()=>show(index));
 addEventListener('resize',()=>requestAnimationFrame(fitFullscreen));
 document.addEventListener('fullscreenchange',()=>{
  if(!document.fullscreenElement)document.querySelectorAll('.explanation p').forEach(p=>p.style.removeProperty('font-size'));
  requestAnimationFrame(fitFullscreen);
 });
 document.fonts?.ready.then(()=>requestAnimationFrame(fitFullscreen));
 const observer=new IntersectionObserver(entries=>{if(!mobile.matches)return;const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);if(visible.length)show(slides.indexOf(visible[0].target));},{rootMargin:'-5% 0px -55% 0px',threshold:[0,.2,.5]});
 slides.forEach(s=>observer.observe(s));
}
document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
 const value=document.getElementById(button.dataset.copy).textContent;
 const status=button.parentElement.querySelector('.copy-status');
 try{await navigator.clipboard.writeText(value);status.textContent='已复制';}catch{status.textContent='请选中上方文字手动复制';}
}));
