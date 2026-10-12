import fs from 'node:fs/promises';
import path from 'node:path';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
import {pathToFileURL} from 'node:url';
const skill=process.env.PRESENTATIONS_SKILL_DIR;
if(!skill)throw new Error('Set PRESENTATIONS_SKILL_DIR to the installed Codex presentations skill directory.');
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const root=path.resolve(import.meta.dirname,'..');
const data=JSON.parse(await fs.readFile(path.join(root,'src/content.json'),'utf8'));

const C={navy:'#082F75',blue:'#1669DB',cyan:'#479DF2',soft:'#EEF7FF',line:'#BCDDFB',muted:'#5274AC'};
const font=process.env.SLIDE_FONT||'Heiti TC';
const p=Presentation.create({slideSize:{width:1280,height:720}});
const bg=await fs.readFile(path.join(root,'dist/assets/theme.png'));
function shape(slide,name,x,y,w,h,fill=C.soft,geometry='roundRect',stroke=C.line){return slide.shapes.add({name,geometry,position:{left:x,top:y,width:w,height:h},fill,line:{fill:stroke,width:stroke==='none'?0:1,style:'solid'},...(geometry==='roundRect'?{borderRadius:'rounded-xl'}:{})});}
function text(slide,name,value,x,y,w,h,size=24,color=C.navy,bold=false,align='left'){
 const t=slide.shapes.add({name,geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0,style:'solid'}});
 t.text=value;t.text.style={typeface:font,fontSize:size,color,bold,alignment:align,verticalAlignment:'top',insets:0,wrap:'square'};return t;
}
function label(slide,name,value,x,y,w,h=43){shape(slide,name+'-band',x,y,w,h,C.blue);text(slide,name,value,x+18,y+8,w-36,h-8,24,'#FFFFFF',true);}
function arrow(slide,x,y,w=34,h=32){shape(slide,'flow-arrow',x,y,w,h,C.cyan,'rightArrow','none');}
function panel(slide,name,title,x,y,w,h){shape(slide,name,x,y,w,h);label(slide,name+'-label',title,x,y,w,46);}
function table(slide,name,values,x,y,width,widths,heights){
 const t=slide.tables.add({rows:values.length,columns:values[0].length,left:x,top:y,width,height:heights.reduce((a,b)=>a+b,0),columnWidths:widths,values});
 t.borders.assign({style:'solid',fill:C.line,width:1});
 heights.forEach((h,r)=>{t.rows[r].height=h;values[r].forEach((v,c)=>{const cell=t.getCell(r,c);cell.fill=r===0?C.blue:c===0?C.soft:'#FFFFFF';cell.text.style={typeface:font,fontSize:r===0?24:23,color:r===0?'#FFFFFF':C.navy,bold:r===0||c===0,verticalAlignment:'middle',insets:16,wrap:'square'};});});
 return t;
}
function footer(slide,s,i){
 shape(slide,'lesson-conclusion',48,603,1184,66,'#F4FAFF');
 text(slide,'takeaway',s.takeaway,66,619,1148,42,23,C.navy,true);
 text(slide,'byline',data.byline,48,685,890,25,15,C.blue);
 text(slide,'page',`${String(i+1).padStart(2,'0')} / 09`,1137,685,96,25,16,C.navy,true,'right');
}
for(const [i,s] of data.slides.entries()){
 const slide=p.slides.add();slide.background.fill='#FFFFFF';
 slide.images.add({blob:bg.buffer.slice(bg.byteOffset,bg.byteOffset+bg.byteLength),contentType:'image/png',alt:'沿原课件的蓝白网格、AI层叠图和波浪页脚',fit:'cover',position:{left:0,top:0,width:1280,height:720}});
 text(slide,'series','Skill Engineering 自学课件',48,31,780,30,17,C.muted);
 text(slide,'title',s.title,48,82,1000,86,51,C.navy,true);
 text(slide,'lead',s.lead,48,175,1075,64,24,C.muted);
 if(s.kind==='before-after'){
  s.panels.forEach((q,j)=>{const x=48+j*622;panel(slide,`panel-${j}`,q.label,x,254,562,312);q.items.forEach(([a,b],k)=>{const y=316+k*60;text(slide,`item-${j}-${k}-title`,a,x+22,y,518,27,23,C.navy,true);text(slide,`item-${j}-${k}-body`,b,x+22,y+28,518,26,18,C.muted);});});arrow(slide,622,389,36,44);
 }
 if(s.kind==='case'){
  text(slide,'input-label',s.input_label,48,250,650,33,23,C.blue,true);
  table(slide,'case-table',s.table,48,301,570,[174,396],[48,60,69,67]);
  s.panels.forEach((q,j)=>{const x=650+j*299;panel(slide,`case-panel-${j}`,q.label,x,254,282,291);q.items.forEach(([a,b],k)=>{const y=320+k*70;text(slide,`case-${j}-${k}-title`,a,x+18,y,248,27,23,C.navy,true);text(slide,`case-${j}-${k}-body`,b,x+18,y+31,248,35,19,C.muted);});});
  text(slide,'case-result',s.result,48,558,1184,33,22,C.blue,true);
 }
 if(s.kind==='progression'){
  shape(slide,'formula-panel',48,246,1184,99,'#F3FAFF');text(slide,'formula',data.formula,64,258,1155,38,24,C.navy,true);
  data.formula_terms.forEach(([en,zh],j)=>text(slide,`formula-zh-${j}`,zh,335+j*174,304,164,30,20,C.muted,false,'center'));
  s.cards.forEach((q,j)=>{const x=48+j*417;shape(slide,`progression-${j}`,x,380,350,186);text(slide,`progression-${j}-title`,q.label,x+12,406,326,37,29,C.navy,true,'center');text(slide,`progression-${j}-sub`,q.sub,x+15,452,320,31,23,C.blue,true,'center');text(slide,`progression-${j}-body`,q.body,x+20,500,310,60,21,C.muted,false,'center');if(j<2)arrow(slide,x+365,454,35,40);});
 }
 if(s.kind==='workflow'){
  label(slide,'workflow-label','Workflow：任务怎样推进',48,245,1184,42);
  s.steps.forEach(([a,b],j)=>{const x=48+j*244;shape(slide,`step-${j}`,x,309,208,150);text(slide,`step-${j}-number`,String(j+1).padStart(2,'0'),x+15,322,170,26,18,C.cyan,true);text(slide,`step-${j}-title`,a,x+15,359,170,34,27,C.navy,true);text(slide,`step-${j}-body`,b,x+15,406,178,44,20,C.muted);if(j<4)arrow(slide,x+214,367,25,30);});
  s.panels.forEach((q,j)=>{const x=48+j*610;shape(slide,`workflow-part-${j}`,x,482,574,97,'#F6FAFF');text(slide,`workflow-part-${j}-label`,q.label,x+18,493,538,27,23,C.blue,true);text(slide,`workflow-part-${j}-body`,q.body,x+18,530,538,44,20,C.navy);});
 }
 if(s.kind==='matrix')table(slide,'responsibility-matrix',s.matrix,48,250,1184,[280,452,452],[52,142,142]);
 if(s.kind==='package'){
  shape(slide,'skill-root',396,243,487,50,'#E3F2FF');text(slide,'skill-root-label',s.root,410,251,459,33,29,C.blue,true,'center');
  shape(slide,'root-stem',638,293,3,23,C.cyan,'rect','none');
  shape(slide,'directory-branch',179,314,922,3,C.cyan,'rect','none');
  for(let j=0;j<4;j++)shape(slide,`directory-stem-${j}`,178+j*307,316,3,34,C.cyan,'rect','none');
  s.cards.forEach((q,j)=>{const x=48+j*307;shape(slide,`directory-${j}`,x,350,263,188);text(slide,`directory-${j}-label`,q.label,x+16,369,231,33,27,C.navy,true);text(slide,`directory-${j}-sub`,q.sub,x+16,413,231,30,20,C.blue,true);text(slide,`directory-${j}-body`,q.body,x+16,455,231,72,19,C.muted);});
  text(slide,'optional-directories',s.optional,48,561,1184,34,22,C.blue,true);
 }
 if(s.kind==='qoder'){
  s.steps.forEach(([a,b],j)=>{const x=48+j*307;shape(slide,`qoder-step-${j}`,x,263,263,239);text(slide,`qoder-step-${j}-number`,String(j+1).padStart(2,'0'),x+20,282,222,34,22,C.cyan,true);text(slide,`qoder-step-${j}-label`,a,x+20,336,222,40,28,C.navy,true);text(slide,`qoder-step-${j}-body`,b,x+20,399,222,82,23,C.muted);if(j<3)arrow(slide,x+271,367,28,34);});
  text(slide,'create-prompt',`给 Qoder 的提示词：${s.prompt}`,48,525,1184,65,22,C.blue);
 }
 if(s.kind==='verification'){
  s.cards.forEach((q,j)=>{const x=48+j*417;shape(slide,`verification-${j}`,x,252,350,213);text(slide,`verification-${j}-label`,q.label,x+20,281,310,36,30,C.navy,true);text(slide,`verification-${j}-sub`,q.sub,x+20,338,310,34,23,C.blue,true);text(slide,`verification-${j}-body`,q.body,x+20,391,310,60,23,C.muted);if(j<2)arrow(slide,x+365,345,35,40);});
  s.cases.forEach(([a,b],j)=>{const x=48+j*417;shape(slide,`case-${j}`,x,491,350,90,'#F8FBFF');text(slide,`case-${j}-name`,a,x+16,503,318,29,23,C.blue,true);text(slide,`case-${j}-expected`,b,x+16,543,318,29,21,C.muted);});
 }
 if(s.kind==='practice'){
  panel(slide,'practice-path','今天就可以开始的一次实践',48,256,606,311);s.steps.forEach(([a,b],j)=>{const y=326+j*76;text(slide,`practice-${j}-number`,String(j+1).padStart(2,'0'),69,y,53,40,29,C.cyan,true);text(slide,`practice-${j}-label`,a,139,y,481,32,25,C.navy,true);text(slide,`practice-${j}-body`,b,139,y+38,481,32,21,C.muted);});
  panel(slide,'feedback-panel','问题反馈',689,256,543,311);text(slide,'feedback-title',s.feedback_title,711,324,499,90,34,C.navy,true);s.feedback_items.forEach((value,j)=>text(slide,`feedback-item-${j}`,value,711,436+j*35,499,31,23,C.blue));
 }
 footer(slide,s,i);
 slide.speakerNotes.text=`本页说明：${s.explanation.text}\n\n继续阅读：deep.html#${s.explanation.deepAnchor}\n\n来源与对应：${s.source}\n本课件依据原分享对话和原图片，用户要求保留知识主线与视觉。参考： https://agentskills.io/specification https://docs.qoder.com/zh/qoder/skills https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices \n\n${s.kind==='package'?'目录中的脚本是职责示例。真实下载练习按三阶段 pipeline.py 执行，未安装或验证目标同事的 Qoder。':''}`;
}
await fs.mkdir(path.join(root,'build/slides'),{recursive:true});
for(const [i,slide] of p.slides.items.entries()){
 const png=await p.export({slide,format:'png',scale:1.5});await fs.writeFile(path.join(root,`build/slides/slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));
}
const candidate=path.join(root,'build/candidate.pptx');await (await PresentationFile.exportPptx(p)).save(candidate);
const exportName=`skill-engineering-${Date.now()}`;
const finalPath=path.resolve(root,process.env.FINAL_PPTX_PATH||`build/final/${exportName}.pptx`);
await fs.mkdir(path.dirname(finalPath),{recursive:true});
const result=await finalizePresentation({workspaceDir:root,candidatePath:candidate,finalPath,explicitTotalSlideCount:9,requiredNativeTableOwnerSlides:[2,5],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'design',families:[font]},pythonExecutable:process.env.PYTHON_EXECUTABLE||'python3',integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit','--require-native-table-slide','2','--require-native-table-slide','5'],verifyArtifactToolImport:true,receiptPath:path.join(root,`build/${exportName}-validation.json`)});
console.log(JSON.stringify({path:result.finalPath,sha256:result.finalSha256,slides:result.packageIntegrity.slide_count,layout:result.presentationLayout.finding_count}));
