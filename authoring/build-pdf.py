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
output=root/'dist/downloads/skill-engineering.pdf'
c=canvas.Canvas(str(output),pagesize=(960,540))
c.setTitle(f'Skill Engineering 入门自学课件 v{data["version"]}')
c.setAuthor('AI 经营交付效能专项组')
total_pages=len(data['slides'])+1
for i in range(1,total_pages+1):
    # Embed the exact reviewed slide render. No image editing or new drawings.
    c.drawImage(ImageReader(str(root/f'build/slides/slide-{i:02d}.png')),0,0,width=960,height=540)
    c.showPage()
c.save()
print(f'Wrote {total_pages}-page offline PDF: {output}')

# Embed a portable CJK font; keep all explanation prose in content.json.
font=Path(os.environ.get('PDF_CJK_FONT','/System/Library/Fonts/Supplemental/Arial Unicode.ttf'))
pdfmetrics.registerFont(TTFont('CourseCJK',str(font)))
notes=root/'dist/downloads/skill-engineering-notes.pdf'
c=canvas.Canvas(str(notes),pagesize=A4)
c.setTitle(f'Skill Engineering 逐页讲解 v{data["version"]}')
c.setAuthor(data['byline'])
style=ParagraphStyle('explanation',fontName='CourseCJK',fontSize=12,leading=22,
                     textColor='#082F75',wordWrap='CJK')
width,height=A4
c.setFillColorRGB(.03,.18,.46)
c.setFont('CourseCJK',11)
c.drawString(36,height-42,f'Skill Engineering · 海报封面 · v{data["version"]}')
poster_width=width-72
poster_height=poster_width*1402/1122
c.drawImage(ImageReader(str(root/'dist'/data['cover']['image'])),36,height-80-poster_height,
            width=poster_width,height=poster_height)
c.linkURL('https://skill-engineering-guide.pages.dev/poster',
          (36,height-80-poster_height,width-36,height-80),relative=0)
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
    c.drawString(36,89,'继续阅读与实践：点击打开在线深入阅读')
    c.linkURL('https://skill-engineering-guide.pages.dev/deep.html#'+s['explanation']['deepAnchor'],
              (36,85,width-36,103),relative=0)
    c.setFillColorRGB(.32,.45,.67)
    c.drawString(36,45,data['byline']);c.drawRightString(width-36,45,f'{i+1:02d} / {total_pages:02d}')
    c.showPage()
c.save()
print(f'Wrote {total_pages}-page companion notes PDF: {notes}')
