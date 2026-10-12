document.documentElement.classList.add('js');
const slides=[...document.querySelectorAll('.slide')];
const mobile=matchMedia('(max-width:850px)');
const contents=document.getElementById('contents');
let index=0;
function hashIndex(){const n=Number(location.hash.replace('#slide-',''));return Number.isInteger(n)&&n>=1&&n<=slides.length?n-1:0;}
function show(n,scroll=false){
 if(!slides.length)return;
 index=Math.max(0,Math.min(slides.length-1,n));
 slides.forEach((s,i)=>{s.classList.toggle('active',i===index);s.closest('.lesson').classList.toggle('active',i===index);});
 document.getElementById('page-counter').textContent=`${String(index+1).padStart(2,'0')} / 09`;
 document.getElementById('prev').disabled=index===0;
 document.getElementById('next').disabled=index===slides.length-1;
 if(scroll){if(mobile.matches)slides[index].scrollIntoView({block:'start'});else window.scrollTo(0,0);}
}
function go(n){const target=Math.max(0,Math.min(slides.length-1,n));history.replaceState(null,'',`#slide-${String(target+1).padStart(2,'0')}`);show(target,true);}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{const button=document.getElementById('fullscreen');if(button)button.textContent='浏览器未允许全屏';}}
if(slides.length){
 show(hashIndex());
 if(location.hash&&mobile.matches)slides[index].scrollIntoView({block:'start'});
 document.getElementById('prev').addEventListener('click',()=>go(index-1));
 document.getElementById('next').addEventListener('click',()=>go(index+1));
 const toggle=document.getElementById('contents-toggle');
 toggle.addEventListener('click',()=>{contents.hidden=!contents.hidden;toggle.setAttribute('aria-expanded',String(!contents.hidden));});
 contents.addEventListener('click',event=>{if(event.target.closest('a')){contents.hidden=true;toggle.setAttribute('aria-expanded','false');}});
 addEventListener('hashchange',()=>show(hashIndex(),true));
 document.addEventListener('keydown',event=>{
  if(event.target.closest('input,textarea,[contenteditable="true"]'))return;
  if(event.key==='ArrowRight'){event.preventDefault();go(index+1);}
  if(event.key==='ArrowLeft'){event.preventDefault();go(index-1);}
  if(event.key.toLowerCase()==='f'){event.preventDefault();fullscreen();}
  if(event.key==='Escape'){contents.hidden=true;toggle.setAttribute('aria-expanded','false');}
 });
 const fsButton=document.getElementById('fullscreen');if(fsButton)fsButton.addEventListener('click',fullscreen);
 mobile.addEventListener('change',()=>show(index));
 const observer=new IntersectionObserver(entries=>{if(!mobile.matches)return;const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);if(visible.length)show(slides.indexOf(visible[0].target));},{rootMargin:'-5% 0px -55% 0px',threshold:[0,.2,.5]});
 slides.forEach(s=>observer.observe(s));
}
document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
 const value=document.getElementById(button.dataset.copy).textContent;
 const status=button.parentElement.querySelector('.copy-status');
 try{await navigator.clipboard.writeText(value);status.textContent='已复制';}catch{status.textContent='请选中上方文字手动复制';}
}));
