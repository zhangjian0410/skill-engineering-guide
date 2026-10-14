import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';

const root=path.resolve(import.meta.dirname,'..');
const data=JSON.parse(await fs.readFile(path.join(root,'src/content.json'),'utf8'));
const out=process.env.COURSE_TEST_EVIDENCE_DIR||path.resolve(root,`../evidence/course-v${data.version.replace('.', '-')}/browser`);
await fs.mkdir(out,{recursive:true});
const base=process.env.COURSE_TEST_URL||'http://127.0.0.1:8765/';
const browser=await chromium.launch({headless:true});
const totalPages=data.slides.length+1;
const results=[];
try {
 const page=await browser.newPage({viewport:{width:1440,height:1050}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'#slide-02');
 const expected=JSON.parse(await fs.readFile(path.join(root,'practice/ticket-daily-report/tests/fixtures/normal.json'),'utf8'));
 const caseLesson=page.locator('.lesson').filter({has:page.locator('#slide-02')});
 await caseLesson.locator('.slide-text summary').click();
 const initialCanvas=await page.locator('#slide-02').boundingBox();
 assert.equal(await caseLesson.locator('.sample-table tbody tr').count(),expected.length);
 const rows=await caseLesson.locator('.sample-table tbody tr').allTextContents();
 expected.forEach((row,i)=>{assert.ok(rows[i].includes(row.ticket_id));assert.ok(rows[i].includes(row.created_date));});
 assert.equal(await caseLesson.locator('.sample-task .panel-body p').textContent(),
  data.slides.find(slide=>slide.kind==='case').task);
 assert.ok(await caseLesson.locator('.sample-output').textContent().then(text=>text.includes('65 分钟')));
 await caseLesson.locator('.slide-text summary').click();
 const closedCanvas=await page.locator('#slide-02').boundingBox();
 assert.equal(initialCanvas.width,closedCanvas.width);assert.equal(initialCanvas.height,closedCanvas.height);
 results.push('case example: complete seven fixture rows and explicit AI task/report visible PASS');
 await page.goto(base);
 assert.equal(await page.locator('.slide.active').getAttribute('id'),data.cover.id);
 await page.waitForFunction(()=>{const img=document.querySelector('.kind-cover .fullscreen-preview');return img.complete&&img.naturalWidth===1920&&img.naturalHeight===1080;});
 assert.equal(await page.locator('#page-counter').textContent(),`01 / ${totalPages}`);
 assert.deepEqual(await page.locator('.cover-resources a[download]').evaluateAll(links=>links.map(link=>link.getAttribute('href'))),[data.cover.image,data.cover.originalImage]);
 assert.equal(await page.locator('.reactions a').count(),0);
 await page.screenshot({path:path.join(out,'desktop-cover.png'),fullPage:true});
 await page.locator('#next').click();
 for(let i=0;i<data.slides.length;i++){
  if(i)await page.locator('#next').click();
  const lesson=page.locator('.lesson.active');
  assert.equal(await lesson.locator('.explanation p').textContent(),data.slides[i].explanation.text);
  assert.equal(await lesson.locator('h1').textContent(),data.slides[i].title);
  assert.equal(await page.locator('#page-counter').textContent(),`${String(i+2).padStart(2,'0')} / ${totalPages}`);
  assert.equal(await page.locator('.explanation:visible').count(),1);
  const notesBox=await lesson.locator('.explanation').boundingBox();
  const controlsBox=await page.locator('.deck-controls').boundingBox();
  assert.ok(notesBox.y>=controlsBox.y+controlsBox.height);
  await page.screenshot({path:path.join(out,`desktop-${i+1}.png`),fullPage:true});
 }
 assert.equal(await page.locator('#next').isDisabled(),true);
 await page.keyboard.press('ArrowLeft');
 assert.equal(await page.locator('.slide.active').getAttribute('id'),'slide-08');
 await page.locator('#contents-toggle').click();
 await page.locator('#contents a[href="#slide-04"]').click();
 await page.waitForFunction(()=>document.querySelector('.slide.active')?.id==='slide-04');
 assert.equal(await page.locator('#contents').isVisible(),false);
 await page.goto(base+'#slide-07');
 for(const viewport of [{width:1440,height:900},{width:1280,height:720},{width:1024,height:768}]){
  await page.setViewportSize(viewport);let frame;
  for(const slide of [data.cover,...data.slides]){
   await page.goto(base+'#'+slide.id);
   await page.waitForFunction(()=>{const img=document.querySelector('.slide.active .fullscreen-preview');return img.complete&&img.naturalWidth===1920;});
   const box=await page.locator('.slide.active').boundingBox();if(!frame)frame=box;
   assert.ok(Math.abs(box.width-frame.width)<1&&Math.abs(box.height-frame.height)<1,'normal desktop has uniform sizes');
   assert.ok(Math.abs(box.width/box.height-16/9)<.005,'normal desktop has a 16:9 canvas');
   assert.ok(box.x>=0&&box.x+box.width<=viewport.width,'normal canvas fits window');
   assert.equal(await page.locator('.lesson.active .explanation p').textContent(),slide.explanation.text);
   if(slide.id===data.cover.id||slide.id==='slide-business-fit')await page.screenshot({path:path.join(out,`normal-${viewport.width}-${slide.id}.png`)});
  }
 }
 await page.setViewportSize({width:1440,height:1050});await page.goto(base+'#slide-07');
 assert.equal(await page.locator('.slide.active').getAttribute('id'),'slide-07');
 await page.locator('#fullscreen').click();
 await page.waitForFunction(()=>!!document.fullscreenElement);
 assert.equal(await page.evaluate(()=>!!document.fullscreenElement),true);
 assert.equal(await page.locator('.explanation:visible').count(),1);
 assert.equal(await page.locator('.lesson.active .explanation p').textContent(),data.slides.find(s=>s.id==='slide-07').explanation.text);
 await page.waitForFunction(()=>{const lesson=document.querySelector('.lesson.active'),notes=lesson.querySelector('.explanation');return notes.scrollHeight<=notes.clientHeight+1;});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1));
 await page.screenshot({path:path.join(out,'fullscreen.png')});
 await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('.explanation:visible').count(),1);
 assert.equal(await page.locator('.lesson.active .explanation p').textContent(),data.slides.find(s=>s.id==='slide-08').explanation.text);
 await page.waitForFunction(()=>{const notes=document.querySelector('.lesson.active .explanation');return notes.scrollHeight<=notes.clientHeight+1;});
 await page.screenshot({path:path.join(out,'fullscreen-next-page.png')});
 for(const viewport of [{width:1440,height:900},{width:1280,height:720},{width:1024,height:768}]){
  await page.evaluate(()=>document.exitFullscreen());
  await page.setViewportSize(viewport);
  await page.locator('#fullscreen').click();await page.waitForFunction(()=>!!document.fullscreenElement);
  let frame;
  for(const slide of [data.cover,...data.slides]){
   await page.goto(base+'#'+slide.id);
   try{await page.waitForFunction(()=>{const article=document.querySelector('.slide.active'),notes=document.querySelector('.lesson.active .explanation'),a=article.getBoundingClientRect(),n=notes.getBoundingClientRect(),bar=document.querySelector('.deck-controls').getBoundingClientRect(),img=article.querySelector('.fullscreen-preview');return img.complete&&img.naturalWidth===1920&&img.naturalHeight===1080&&Math.min(a.left,n.left)>=0&&Math.max(a.right,n.right)<=innerWidth+1&&(a.right<=n.left+1||a.bottom<=n.top+1)&&Math.max(a.bottom,n.bottom)<=bar.top+1&&notes.scrollHeight<=notes.clientHeight+1&&notes.querySelector('p').scrollWidth<=notes.querySelector('p').clientWidth+1;});}
   catch(error){console.log('Fullscreen failure',viewport,slide.id,await page.evaluate(()=>{const a=document.querySelector('.slide.active'),n=document.querySelector('.lesson.active .explanation');return {screen:[innerWidth,innerHeight],full:!!document.fullscreenElement,slide:a.getBoundingClientRect().toJSON(),notes:n.getBoundingClientRect().toJSON(),controls:document.querySelector('.deck-controls').getBoundingClientRect().toJSON(),notesOverflow:n.scrollHeight-n.clientHeight,scale:a.style.getPropertyValue('--slide-scale')};}));await page.screenshot({path:path.join(out,'fullscreen-failure.png')});throw error;}
   assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1));
   const box=await page.locator('.slide.active').boundingBox();
   if(!frame)frame=box;
   assert.ok(Math.abs(box.width-frame.width)<1&&Math.abs(box.height-frame.height)<1,`every page has the same frame size: ${viewport.width} ${slide.id} ${JSON.stringify({box,frame})}`);
   assert.ok(Math.abs(box.width/box.height-16/9)<.005,'uncropped 16:9 canvas');
   const notesBox=await page.locator('.lesson.active .explanation').boundingBox();
   if(viewport.width>1100)assert.ok(Math.abs(box.y-notesBox.y)<1&&Math.abs(box.height-notesBox.height)<1,'side panels align at both edges');
   else assert.ok(notesBox.y>=box.y+box.height,'compact fullscreen uses notes below');
   assert.equal(await page.locator('.lesson.active .explanation p').textContent(),slide.explanation.text);
   assert.ok(await page.evaluate(()=>[...document.querySelectorAll('.slide-text a,.slide-text button,.slide-text summary')].every(e=>e.tabIndex===-1)),'hidden source controls cannot take focus');
   if(slide.id==='slide-business-fit'||slide.id==='slide-08'||slide.id===data.cover.id)await page.screenshot({path:path.join(out,`uniform-${viewport.width}-${slide.id}.png`)});
  }
 }
 await page.evaluate(()=>document.exitFullscreen());await page.setViewportSize({width:1440,height:900});await page.locator('#fullscreen').click();await page.waitForFunction(()=>!!document.fullscreenElement);
 await page.goto(base+'#slide-business-fit');
 await page.waitForFunction(()=>{const notes=document.querySelector('.lesson.active .explanation');return notes.scrollHeight<=notes.clientHeight+1;});
 await page.screenshot({path:path.join(out,'fullscreen-business-fit.png')});
 await page.evaluate(()=>document.exitFullscreen());
 await page.waitForFunction(()=>[...document.querySelectorAll('.slide-text a')].every(e=>e.tabIndex===0));
 await page.setViewportSize({width:1440,height:1050});
 assert.equal(await page.locator('.explanation:visible').count(),1);
 await page.goto(base+'#slide-09');
 await page.locator('.lesson.active .slide-text>summary').click();
 await page.locator('.lesson.active .prompt>summary').click();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copiedFromCourse=text},configurable:true}));
 await page.locator('[data-copy="feedback"]').click();
 assert.equal(await page.evaluate(()=>window.copiedFromCourse),await page.locator('#feedback').textContent());

 results.push('desktop: cover and all content explanations, controls/order, keyboard, directory, hash, fullscreen PASS');
 await page.setViewportSize({width:390,height:844});
 await page.goto(base);
 assert.equal(await page.locator('.slide:visible').count(),totalPages);
 assert.equal(await page.locator('.explanation:visible').count(),totalPages);
 for(let i=0;i<data.slides.length;i++){
  const lesson=page.locator('.lesson').nth(i+1);
  await lesson.locator('.explanation').scrollIntoViewIfNeeded();
  assert.equal(await lesson.locator('.explanation p').textContent(),data.slides[i].explanation.text);
  const diagram=await lesson.locator('.slide').boundingBox();
  const notes=await lesson.locator('.explanation').boundingBox();
  assert.ok(notes.y>=diagram.y+diagram.height-1);
 }
 await page.goto(base+'#slide-02');
 await page.locator('#slide-02 .sample-table').scrollIntoViewIfNeeded();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('.lesson').nth(2).screenshot({path:path.join(out,'mobile-case.png')});
 await page.goto(base+'#slide-08');
 await page.waitForFunction(()=>document.querySelector('.slide.active')?.id==='slide-08');
 await page.screenshot({path:path.join(out,'mobile-8.png'),fullPage:false});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.goto(base+'deep.html#business-fit');
 const business=data.slides.find(s=>s.kind==='business-fit');
 assert.deepEqual(await page.locator('#business-fit h3').allTextContents(),business.cards.map((q,i)=>`${i+1}. ${q.label}`));
 assert.equal(await page.locator('#access-options').getAttribute('open'),null);
 for(const q of business.cards)for(const text of q.reading)assert.ok((await page.locator('#business-fit').textContent()).includes(text));
 await page.locator('#business-fit').screenshot({path:path.join(out,'mobile-business-reading.png')});
 await page.locator('#access-options summary').click();assert.ok(await page.locator('#access-options li').filter({hasText:'MCP'}).isVisible());
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.goto(base+'deep.html#regression');
 assert.ok(await page.locator('#regression').isVisible());
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:path.join(out,'mobile-deep.png')});
 await page.goto(base+'poster.html');
 await page.waitForFunction(()=>{const img=document.getElementById('landscape-poster-image');return img.complete&&img.naturalWidth===1672&&img.naturalHeight===941;});
 await page.locator('#poster-image').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>{const img=document.getElementById('poster-image');return img.complete&&img.naturalWidth===1122;});
 assert.equal(await page.getByRole('link',{name:'下载横版 PNG',exact:true}).getAttribute('href'),data.cover.image);
 assert.equal(await page.getByRole('link',{name:'下载 PNG',exact:true}).getAttribute('href'),data.cover.originalImage);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);
 results.push('mobile: all cover and all content explanations follow their diagrams; hash and deep reading PASS');
 const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:1440,height:1000}});
 await nojs.goto(base);
 assert.equal(await nojs.locator('.slide:visible').count(),totalPages);
 assert.equal(await nojs.locator('.explanation:visible').count(),totalPages);
 assert.equal(await nojs.locator('.deck-controls').isVisible(),false);
 results.push('without JavaScript: cover and all content diagrams and explanations readable PASS');
 await fs.writeFile(path.join(out,'checks.json'),JSON.stringify({base,results,errors},null,2));
 console.log(results.join('\n'));
} finally {await browser.close();}
