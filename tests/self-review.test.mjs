import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const template=fs.readFileSync(path.join(root,'prompts/skill-self-review.txt'),'utf8');
const controller=fs.readFileSync(path.join(root,'src/self-review.js'),'utf8');
function harness(writeText=async()=>{}) {
  const ids=['skill-name','review-mode','self-review-prompt','copy-self-review','self-review-copy-status'];
  const elements=Object.fromEntries(ids.map(id=>[id,{value:'',textContent:'',disabled:false,listeners:{},addEventListener(event,listener){this.listeners[event]=listener;}}]));
  elements['review-mode'].value='basic';
  elements['self-review-prompt'].value=template;
  vm.runInNewContext(controller,{document:{getElementById:id=>elements[id]},navigator:{clipboard:{writeText}}},{timeout:1000});
  return {elements,setName(value){elements['skill-name'].value=value;elements['skill-name'].listeners.input();},setMode(value){elements['review-mode'].value=value;elements['review-mode'].listeners.change();},copy(){return elements['copy-self-review'].listeners.click();}};
}

test('name is the only required field; blank/whitespace names cannot copy',async()=>{
  let calls=0;const h=harness(async()=>{calls++;});
  assert.equal(h.elements['copy-self-review'].disabled,true);
  h.setName('   ');await h.copy();assert.equal(calls,0);
  assert.equal(h.elements['self-review-prompt'].value,template);
});
test('name is inserted literally, including dollar replacement tokens and markup',()=>{
  const h=harness();h.setName('  demo-$&-<b>  ');
  assert.equal(h.elements['self-review-prompt'].value,template.split('【Skill 名称】').join('demo-$&-<b>'));
  assert.equal(h.elements['copy-self-review'].disabled,false);
});
test('deep mode is explicit; returning to basic restores the same source',()=>{
  const h=harness();h.setName('demo');const basic=h.elements['self-review-prompt'].value;
  h.setMode('deep');assert.equal(h.elements['self-review-prompt'].value,'本次明确要求直接进行深度筛查。\n\n'+basic);
  h.setMode('basic');assert.equal(h.elements['self-review-prompt'].value,basic);
});
test('clipboard gets exactly the displayed prompt',async()=>{
  let copied;const h=harness(async value=>{copied=value;});h.setName('demo');h.setMode('deep');await h.copy();
  assert.equal(copied,h.elements['self-review-prompt'].value);
  assert.match(h.elements['self-review-copy-status'].textContent,/^已复制/);
});
test('clipboard rejection gives a manual-copy fallback',async()=>{
  const h=harness(async()=>{throw new Error('not allowed');});h.setName('demo');await h.copy();
  assert.match(h.elements['self-review-copy-status'].textContent,/手动复制/);
  assert.equal(h.elements['copy-self-review'].disabled,false);
});
test('changing fields during a pending copy cannot claim the new text was copied',async()=>{
  let resolve,copied;const h=harness(value=>{copied=value;return new Promise(r=>{resolve=r;});});
  h.setName('old-name');const before=h.elements['self-review-prompt'].value;const pending=h.copy();
  h.setName('new-name');assert.equal(h.elements['copy-self-review'].disabled,true);resolve();await pending;
  assert.equal(copied,before);assert.match(h.elements['self-review-copy-status'].textContent,/重新复制/);
  assert.equal(h.elements['copy-self-review'].disabled,false);
});
test('built preview and download are byte-equivalent to the canonical prompt',()=>{
  const html=fs.readFileSync(path.join(root,'dist/self-review.html'),'utf8');
  const match=html.match(/<textarea id="self-review-prompt"[^>]*>([\s\S]*?)<\/textarea>/);assert.ok(match);
  const decoded=match[1].replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
  assert.equal(decoded,template);
  assert.deepEqual(fs.readFileSync(path.join(root,'dist/downloads/skill-self-review.txt')),fs.readFileSync(path.join(root,'prompts/skill-self-review.txt')));
  assert.deepEqual(fs.readFileSync(path.join(root,'dist/self-review.js')),fs.readFileSync(path.join(root,'src/self-review.js')));
});
test('local routes on all three pages resolve to actual public files',()=>{
  for(const page of ['index.html','deep.html','self-review.html']) {
    const html=fs.readFileSync(path.join(root,'dist',page),'utf8');
    for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if(url.startsWith('#')||/^https?:/.test(url))continue;
      const file=decodeURIComponent(new URL(url,'https://course.invalid/').pathname).slice(1);
      assert.ok(fs.existsSync(path.join(root,'dist',file)),`${page}: ${url}`);
    }
    assert.ok(html.includes('self-review.html')||page==='self-review.html');
  }
});
test('trial metadata and synthetic corpus do not claim unrun model acceptance',()=>{
  const meta=JSON.parse(fs.readFileSync(path.join(root,'prompts/metadata.json'),'utf8'));
  const corpus=JSON.parse(fs.readFileSync(path.join(root,'prompts/evaluation-cases.json'),'utf8'));
  assert.equal(meta.status,'试用版');assert.equal(meta.runtimeAcceptance,'UNKNOWN');assert.equal(corpus.promptVersion,meta.version);
  assert.ok(corpus.cases.length>=10);
  for(const c of corpus.cases){assert.ok(c.request&&Object.keys(c.materials).length&&c.expected.length);assert.equal(c.observed,null);assert.equal(c.verdict,'UNKNOWN');}
});
