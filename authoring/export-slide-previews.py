"""Publish high-quality WebP previews of reviewed PPT renders; keep native downloads intact."""
from pathlib import Path
import hashlib
import json
from PIL import Image

root = Path(__file__).resolve().parent.parent
content = root / 'src/content.json'
data = json.loads(content.read_text())
ids = [data['cover']['id'], *(slide['id'] for slide in data['slides'])]
target = root / 'dist/assets/slides'
target.mkdir(parents=True, exist_ok=True)
digest = lambda file: hashlib.sha256(file.read_bytes()).hexdigest()
inputs = sorted(set([
    'src/content.json', 'authoring/build-deck.mjs', 'authoring/update-cover.mjs', 'dist/assets/theme.png',
    'dist/' + data['cover']['image'],
    *(slide['sampleFixture'] for slide in data['slides'] if slide.get('sampleFixture')),
]))
manifest = {
    'contentSha256': digest(content),
    'pptxSha256': digest(root / 'dist/downloads/skill-engineering.pptx'),
    'sourceSha256': {file: digest(root / file) for file in inputs},
    'size': [1920, 1080],
    'encoding': {'format': 'webp', 'quality': 95},
    'slides': [],
}
for number, slide_id in enumerate(ids, 1):
    source = root / f'build/slides/slide-{number:02d}.png'
    file = target / f'{slide_id}.webp'
    with Image.open(source) as image:
        if image.size != (1920, 1080):
            raise ValueError(f'Unexpected slide size: {source}: {image.size}')
        image.convert('RGB').save(file, 'WEBP', quality=95, method=6)
    manifest['slides'].append({'id': slide_id, 'src': f'assets/slides/{file.name}', 'sha256': digest(file)})
(target / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
with Image.open(root / 'dist/assets/theme.png') as image:
    image.convert('RGB').save(root / 'dist/assets/theme.webp', 'WEBP', quality=95, method=6)
print(f'Exported {len(ids)} high-quality 16:9 previews from the reviewed PPT renders.')
