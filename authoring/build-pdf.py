from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
import json
import os
from xml.sax.saxutils import escape

root=Path(__file__).resolve().parent.parent
data=json.loads((root/'src/content.json').read_text())
output_dir=Path(os.environ.get('PDF_OUTPUT_DIR',str(root/'dist/downloads')))
output_dir.mkdir(parents=True,exist_ok=True)
output=output_dir/'skill-engineering.pdf'
c=canvas.Canvas(str(output),pagesize=(960,540))
c.setTitle(f'Skill Engineering 入门自学课件 v{data["version"]}')
c.setAuthor('AI 经营交付效能专项组')
total_pages=len(data['slides'])+1
for i in range(1,total_pages+1):
    # Embed the exact reviewed slide render. No image editing or new drawings.
    c.drawImage(ImageReader(str(root/f'build/slides/slide-{i:02d}.png')),0,0,width=960,height=540)
    item=data['cover'] if i==1 else data['slides'][i-2]
    c.linkURL('https://archer-ai-courses.pages.dev/courses/skill-engineering/'+item['explanation']['link']['href'],(0,0,960,540),relative=0)
    c.showPage()
c.save()
print(f'Wrote {total_pages}-page offline PDF: {output}')

# Embed a portable CJK font; keep all explanation prose in content.json.
font=Path(os.environ.get('PDF_CJK_FONT','/System/Library/Fonts/Supplemental/Arial Unicode.ttf'))
pdfmetrics.registerFont(TTFont('CourseCJK',str(font)))
notes=output_dir/'skill-engineering-notes.pdf'
c=canvas.Canvas(str(notes),pagesize=A4)
c.setTitle(f'Skill Engineering 逐页讲解 v{data["version"]}')
c.setAuthor(data['byline'])
style=ParagraphStyle('explanation',fontName='CourseCJK',fontSize=12,leading=22,
                     textColor='#082F75',wordWrap='CJK')
width,height=A4
c.setFillColorRGB(.03,.18,.46)
c.setFont('CourseCJK',11)
c.drawString(36,height-42,f'Skill Engineering · 学习导览 · v{data["version"]}')
c.setFont('CourseCJK',22)
c.drawString(36,height-90,'Skill Engineering')
poster_width=width-72
poster_height=poster_width*9/16
poster_top=height-130
c.drawImage(ImageReader(str(root/'build/slides/slide-01.png')),36,poster_top-poster_height,
            width=poster_width,height=poster_height)
c.linkURL('https://archer-ai-courses.pages.dev/courses/skill-engineering/poster',
          (36,poster_top-poster_height,width-36,poster_top),relative=0)
intro=Paragraph(escape(data['cover']['explanation']['text']),style)
_,intro_height=intro.wrap(width-72,300)
intro.drawOn(c,36,poster_top-poster_height-30-intro_height)
c.setFont('CourseCJK',16)
c.drawString(36,245,'学习顺序')
route=Paragraph('普通 Chat 完成任务 → 提炼 Skill → 安装 → 新 Chat 验证',style)
_,route_height=route.wrap(width-72,100)
route.drawOn(c,36,223-route_height)
usage=Paragraph('看课件了解目标，到“动手做”完成基础四步。深入阅读讲原理，进阶跟练选做；PPT 备注和本手册提供逐页讲解。',style)
_,usage_height=usage.wrap(width-72,100)
usage.drawOn(c,36,148-usage_height)
c.setFont('CourseCJK',10)
c.drawString(36,45,data['byline']);c.drawRightString(width-36,45,f'01 / {total_pages:02d}')
c.showPage()
for i,s in enumerate(data['slides'],1):
    c.setFillColorRGB(.03,.18,.46)
    c.setFont('CourseCJK',11)
    c.drawString(36,height-42,f'Skill Engineering · 逐页讲解 · v{data["version"]}')
    title=Paragraph(escape(s['title']),ParagraphStyle('title',parent=style,fontSize=22,leading=31))
    _,h=title.wrap(width-72,100)
    title.drawOn(c,36,height-76-h)
    image_width=width-72; image_height=image_width*9/16
    image_top=height-155
    c.drawImage(ImageReader(str(root/f'build/slides/slide-{i+1:02d}.png')),36,image_top-image_height,
                width=image_width,height=image_height)
    y=image_top-image_height-38
    c.setFont('CourseCJK',14);c.drawString(36,y,'本页讲解')
    explanation=Paragraph(escape(s['explanation']['text']),style)
    _,h=explanation.wrap(width-72,250)
    explanation.drawOn(c,36,y-18-h)
    c.setFont('CourseCJK',10)
    c.drawString(36,89,s['explanation']['link']['label'])
    c.linkURL('https://archer-ai-courses.pages.dev/courses/skill-engineering/'+s['explanation']['link']['href'],
              (36,85,width-36,103),relative=0)
    c.setFillColorRGB(.32,.45,.67)
    c.drawString(36,45,data['byline']);c.drawRightString(width-36,45,f'{i+1:02d} / {total_pages:02d}')
    c.showPage()
c.save()
print(f'Wrote {total_pages}-page companion notes PDF: {notes}')
