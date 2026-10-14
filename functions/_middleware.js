const cookiePattern=/(?:^|;\s*)course_visitor=([a-f0-9-]{36})(?:;|$)/;
const destinations={
 '/':'/courses/skill-engineering/', '/index':'/courses/skill-engineering/', '/index.html':'/courses/skill-engineering/',
 '/courses':'/', '/courses.html':'/',
 '/deep':'/courses/skill-engineering/deep', '/deep.html':'/courses/skill-engineering/deep',
 '/self-review':'/courses/skill-engineering/self-review', '/self-review.html':'/courses/skill-engineering/self-review',
 '/poster':'/courses/skill-engineering/poster', '/poster.html':'/courses/skill-engineering/poster'
};
export async function onRequest(context){
 const {request,env}=context;const url=new URL(request.url);
 if(!env.PORTAL_ORIGIN)return context.next();
 const origin=new URL(env.PORTAL_ORIGIN).origin;
 if(origin===url.origin)return context.next();
 if(url.pathname.startsWith('/api/')){
  if(request.method!=='GET')return Response.json({error:'课程入口已更新，请刷新页面后继续。',portal:origin},{status:409,headers:{'Cache-Control':'no-store'}});
  return new Response(null,{status:302,headers:{Location:origin+url.pathname+url.search,'Cache-Control':'no-store'}});
 }
 if(!Object.hasOwn(destinations,url.pathname))return context.next();
 const next=destinations[url.pathname]+url.search;
 let target=origin+next;
 const visitor=request.headers.get('Cookie')?.match(cookiePattern)?.[1];
 if(visitor&&env.COURSE_DB){
  try{
   const token=crypto.randomUUID();
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
   await env.COURSE_DB.prepare('INSERT INTO visitor_transfers(token_hash,visitor,expires) VALUES (?,?,?)').bind(hash,visitor,Date.now()+120000).run();
   await env.COURSE_DB.prepare('DELETE FROM visitor_transfers WHERE expires<?').bind(Date.now()).run();
   target=origin+'/__handoff?'+new URLSearchParams({token,next});
  }catch{/* Content remains reachable if identity transfer temporarily fails. */}
 }
 // The browser preserves a source fragment through redirects without a fragment.
 return new Response(null,{status:302,headers:{Location:target,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
}
