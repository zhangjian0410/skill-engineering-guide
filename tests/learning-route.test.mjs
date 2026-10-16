import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('basic walkthrough is complete, advanced work optional, and theory contains no action prompts',()=>{
 const basic=read('dist/practice.html'),advanced=read('dist/advanced.html'),theory=read('dist/deep.html');
 for(const id of ['start','ticket-practice','qoder','install-skill','new-chat','done'])assert.ok(basic.includes(`id="${id}"`));
 const prompts=JSON.parse(read('src/prompts.json'));
 for(const id of ['deep-chat','deep-create','deep-verify'])assert.ok(basic.includes(prompts[id].replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')));
 assert.ok(!basic.includes('data-copy="verification-files"')&&!basic.includes('data-copy="regression-plan"'));
 for(const id of ['regression-plan','verification-files','verification-run','eval-review'])assert.ok(advanced.includes(`data-copy="${id}"`));
 const theoryMain=theory.match(/<main[\s\S]*?<\/main>/)[0];
 assert.ok(!theoryMain.includes('data-copy=')&&!theoryMain.includes('download>'),'theory should not repeat operational prompts or input downloads');
 assert.ok(basic.includes('advanced.html#start'));
});

test('every published moved deep anchor redirects within the same course, including later hash navigation',()=>{
 const routes=JSON.parse(read('src/legacy-deep-routes.json')),script=read('dist/legacy-deep-routes.js');
 for(const [hash,target] of Object.entries(routes)){
  let actual,listener;const location={href:'https://example.invalid/courses/skill-engineering/deep#'+hash,hash:'#'+hash,replace:x=>actual=x};
  vm.runInNewContext(script,{location,URL,addEventListener:(_,f)=>listener=f});
  assert.equal(actual,'https://example.invalid/courses/skill-engineering/'+target);
  const [page,anchor]=target.split('#');assert.ok(read('dist/'+page).includes(`id="${anchor}"`));
  actual=undefined;location.hash='#qoder';listener();assert.equal(actual,'https://example.invalid/courses/skill-engineering/practice.html#qoder');
 }
 for(const hash of ['skill-basics','toString','__proto__','%E0%A4%A']){
  let called=false;vm.runInNewContext(script,{location:{href:'https://example.invalid/deep',hash:'#'+hash,replace:()=>called=true},URL,addEventListener:()=>{}});assert.equal(called,false);
 }
});
