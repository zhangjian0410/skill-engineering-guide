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
 assert.equal(await page.locator('#slide-02 .sample-table tbody tr').count(),expected.length);
 const rows=await page.locator('#slide-02 .sample-table tbody tr').allTextContents();
 expected.forEach((row,i)=>{assert.ok(rows[i].includes(row.ticket_id));assert.ok(rows[i].includes(row.created_date));});
 assert.equal(await page.locator('#slide-02 .sample-task .panel-body p').textContent(),
  data.slides.find(slide=>slide.kind==='case').task);
 assert.ok(await page.locator('#slide-02 .sample-output').textContent().then(text=>text.includes('65 分钟')));
 results.push('case example: complete seven fixture rows and explicit AI task/report visible PASS');
 await page.goto(base);
 assert.equal(await page.locator('.slide.active').getAttribute('id'),data.cover.id);
 await page.waitForFunction(()=>{const img=document.querySelector('.cover-poster');return img.complete&&img.naturalWidth===1122&&img.naturalHeight===1402;});
 assert.equal(await page.locator('#page-counter').textContent(),`01 / ${totalPages}`);
 assert.equal(await page.locator('.cover-resources a[download]').getAttribute('href'),data.cover.image);
 assert.equal(await page.locator('.reactions a').count(),0);
 await page.screenshot({path:path.join(out,'desktop-cover.png'),fullPage:true});
 await page.locator('#next').click();
 for(let i=0;i<data.slides.length;i++){
  if(i)await page.locator('#next').click();
  const lesson=page.locator('.lesson.active');
  assert.equal(await lesson.locator('.explanation p').textContent(),data.slides[i].explanation.text);
  assert.equal(await lesson.locator('.slide h1').textContent(),data.slides[i].title);
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
  for(const slide of data.slides){
   await page.goto(base+'#'+slide.id);
   try{await page.waitForFunction(()=>{const article=document.querySelector('.slide.active'),notes=document.querySelector('.lesson.active .explanation'),a=article.getBoundingClientRect(),n=notes.getBoundingClientRect(),bar=document.querySelector('.deck-controls').getBoundingClientRect();return a.right<=n.left+1&&a.bottom<=bar.top+1&&notes.scrollHeight<=notes.clientHeight+1;});}
   catch(error){console.log('Fullscreen failure',viewport,slide.id,await page.evaluate(()=>{const a=document.querySelector('.slide.active'),n=document.querySelector('.lesson.active .explanation');return {screen:[innerWidth,innerHeight],full:!!document.fullscreenElement,slide:a.getBoundingClientRect().toJSON(),notes:n.getBoundingClientRect().toJSON(),controls:document.querySelector('.deck-controls').getBoundingClientRect().toJSON(),notesOverflow:n.scrollHeight-n.clientHeight,scale:a.style.getPropertyValue('--slide-scale')};}));await page.screenshot({path:path.join(out,'fullscreen-failure.png')});throw error;}
   assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1));
  }
 }
 await page.evaluate(()=>document.exitFullscreen());await page.setViewportSize({width:1440,height:900});await page.locator('#fullscreen').click();await page.waitForFunction(()=>!!document.fullscreenElement);
 await page.goto(base+'#slide-business-fit');
 await page.waitForFunction(()=>{const notes=document.querySelector('.lesson.active .explanation');return notes.scrollHeight<=notes.clientHeight+1;});
 await page.screenshot({path:path.join(out,'fullscreen-business-fit.png')});
 await page.evaluate(()=>document.exitFullscreen());
 await page.setViewportSize({width:1440,height:1050});
 assert.equal(await page.locator('.explanation:visible').count(),1);
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
