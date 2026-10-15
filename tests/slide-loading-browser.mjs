import assert from 'node:assert/strict';
import fs from 'node:fs/promises';import path from 'node:path';import http from 'node:http';
import {chromium} from 'playwright';
const directory=path.resolve(process.env.SLIDE_TEST_DIST||new URL('../dist',import.meta.url).pathname);
const out=process.env.SLIDE_TEST_EVIDENCE_DIR;assert.ok(out,'Set SLIDE_TEST_EVIDENCE_DIR');await fs.mkdir(out,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.json':'application/json'};
const server=http.createServer(async(req,res)=>{try{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name.endsWith('/'))name+='index.html';const file=path.resolve(directory,'.'+name);if(!file.startsWith(directory+path.sep))throw Error();res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({headless:true});const checks=[],errors=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1050}});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/**',r=>r.abort());
 const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:100,downloadThroughput:500000,uploadThroughput:125000});
 const initial=Date.now();await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>{const i=document.querySelector('.slide.active .fullscreen-preview');return i?.complete&&i.naturalWidth===1920;});const initialReadyMs=Date.now()-initial;
 await page.locator('#fullscreen').click();await page.waitForTimeout(3000);
 const nextReady=await page.locator('#slide-01 .fullscreen-preview').evaluate(i=>i.complete&&i.naturalWidth===1920);
 const start=Date.now();await page.locator('#next').click();await page.waitForFunction(()=>{const i=document.querySelector('#slide-01 .fullscreen-preview');return i?.complete&&i.naturalWidth===1920;});const nextReadyMs=Date.now()-start;
 const resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('/assets/')||r.name.includes('/downloads/')).map(r=>({url:r.name.split('/').pop(),bytes:r.transferSize,durationMs:Math.round(r.duration)})));
 await fs.writeFile(out+'/loading.json',JSON.stringify({base,network:'4Mbps,100ms; fresh cache, 3 seconds reading',initialReadyMs,nextReady,nextReadyMs,resources},null,2)+'\n');
 if(process.env.SLIDE_TEST_BASELINE==='1'){console.log(JSON.stringify({baseline:true,initialReadyMs,nextReady,nextReadyMs}));}
 else{
  assert.ok(nextReady,'next slide should already be decoded after reading current page');assert.ok(nextReadyMs<500,'prefetched page switch should not wait for network');
  assert.equal(resources.some(r=>r.url==='skill-engineering-cover.png'),false,'do not download duplicate full-resolution cover');
  checks.push('cold-cache 4Mbps/100ms: next slide ready before click; switch under 500ms; duplicate PNG removed PASS');
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  const frames=[];
  for(const viewport of [{width:1440,height:1050},{width:1024,height:768},{width:1920,height:1080}]){
   if(await page.evaluate(()=>!!document.fullscreenElement))await page.evaluate(()=>document.exitFullscreen());
   await page.setViewportSize(viewport);await page.locator('#fullscreen').click();await page.waitForTimeout(50);let first;
   for(const id of await page.locator('.slide').evaluateAll(els=>els.map(e=>e.id))){
    await page.evaluate(id=>{location.hash=id;},id);await page.waitForFunction(id=>document.querySelector('.slide.active')?.id===id,id);
    await page.waitForFunction(()=>{const i=document.querySelector('.slide.active .fullscreen-preview');return i.complete&&i.naturalWidth===1920;});
    const geometry=await page.locator('.slide.active').evaluate(el=>{const b=el.getBoundingClientRect();const n=el.closest('.lesson').querySelector('.explanation');return {w:b.width,h:b.height,notesFit:n.scrollHeight<=n.clientHeight+1,overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight};});
    first??=geometry;assert.ok(Math.abs(geometry.w/geometry.h-16/9)<.01);assert.ok(Math.abs(geometry.w-first.w)<1);assert.ok(geometry.notesFit);assert.equal(geometry.overflow,false);frames.push({viewport,id,...geometry});
   }
   await page.screenshot({path:out+`/fullscreen-${viewport.width}.png`});
  }
  await fs.writeFile(out+'/frames.json',JSON.stringify(frames,null,2)+'\n');checks.push('all 11 frames at 3 desktop sizes: equal 16:9, notes fit, no page scroll PASS');
  const phone=await browser.newPage({viewport:{width:390,height:844}});const mobileImages=[];await phone.route('**/api/**',r=>r.abort());phone.on('request',r=>{if(r.url().includes('/assets/slides/'))mobileImages.push(r.url());});await phone.goto(base+'#slide-02');await phone.waitForTimeout(300);
  assert.ok(await phone.locator('#slide-02 .sample-table').isVisible());assert.ok(mobileImages.length<=1,'mobile may load cover only, never the desktop reading window');assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));checks.push('mobile readable HTML with cover only, no extra desktop previews PASS');
  const failure=await browser.newPage({viewport:{width:1440,height:1050}});await failure.route('**/api/**',r=>r.abort());await failure.route('**/assets/slides/**',r=>r.abort());await failure.goto(base+'#slide-06');await failure.locator('.slide.active .preview-status').filter({hasText:'无法加载'}).waitFor();checks.push('failed preview reports error instead of remaining an unexplained blank frame PASS');
  assert.deepEqual(errors,[]);await fs.writeFile(out+'/checks.json',JSON.stringify({base,checks,errors,initialReadyMs,nextReadyMs},null,2)+'\n');console.log(checks.join('\n'));
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
