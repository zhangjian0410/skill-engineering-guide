from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

root=Path(__file__).resolve().parent.parent
output=root/'dist/downloads/skill-engineering.pdf'
c=canvas.Canvas(str(output),pagesize=(960,540))
c.setTitle('Skill Engineering 入门自学课件')
c.setAuthor('AI 经营交付效能专项组')
for i in range(1,10):
    # Embed the exact reviewed slide render. No image editing or new drawings.
    c.drawImage(ImageReader(str(root/f'build/slides/slide-{i:02d}.png')),0,0,width=960,height=540)
    c.showPage()
c.save()
print(f'Wrote 9-page offline PDF: {output}')
