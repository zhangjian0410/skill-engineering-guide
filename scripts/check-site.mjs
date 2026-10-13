import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const dist=path.resolve(import.meta.dirname,'../dist');
const pages=new Map();
async function htmlPages(directory, prefix=''){
 const names=[];
 for(const entry of await fs.readdir(directory,{withFileTypes:true})){
  const relative=prefix+entry.name;
  if(entry.isDirectory())names.push(...await htmlPages(path.join(directory,entry.name),relative+'/'));
  else if(entry.isFile()&&entry.name.endsWith('.html'))names.push(relative);
 }
 return names.sort();
}
for(const name of await htmlPages(dist)){
 const html=await fs.readFile(path.join(dist,name),'utf8');
 assert.ok(!html.includes('{{'),`${name}: unresolved template`);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
 assert.equal(new Set(ids).size,ids.length,`${name}: duplicate ID`);
 pages.set(name,{html,ids:new Set(ids)});
}
for(const name of ['index.html','deep.html','self-review.html','courses.html','poster.html'])assert.ok(pages.has(name),`${name}: required page missing`);
let checked=0;
// Keep published deep links working when the walkthrough is reorganized.
for(const id of ['practice-route','ticket-practice','qoder','practice','create','regression','regression-plan','repair-demo','migration','validation-scope','maturity','directories','feedback','feedback-prompt']){
 assert.ok(pages.get('deep.html').ids.has(id),`deep.html: published anchor missing #${id}`);
}
for(const [name,{html}] of pages){
 for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
  const url=new URL(match[1].replaceAll('&amp;','&'),'https://course.invalid/'+name);
  if(url.origin!=='https://course.invalid')continue;
  const relative=decodeURIComponent(url.pathname).replace(/^\//,'');
  const file=path.resolve(dist,relative);
  assert.ok(file.startsWith(dist+path.sep),`${name}: link outside dist`);
  assert.ok((await fs.stat(file)).isFile(),`${name}: missing file ${relative}`);
  if(url.hash){
   assert.ok(pages.get(relative)?.ids.has(decodeURIComponent(url.hash.slice(1))),`${name}: missing anchor ${relative}${url.hash}`);
  }
  checked++;
 }
 for(const match of html.matchAll(/\bdata-copy="([^"]+)"/g)){
  assert.ok(pages.get(name).ids.has(match[1]),`${name}: copy target missing`);
 }
}
console.log(`PASS: ${pages.size} generated pages, unique IDs, resolved prompts, and ${checked} local links/downloads.`);
