"""Package only intentional practice sources, never local run directories."""
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parent.parent
practice = root / 'practice'
downloads = root / 'dist/downloads'
downloads.mkdir(parents=True, exist_ok=True)
skill = practice / 'ticket-daily-report'
sources = [practice / 'GUIDE.txt', skill / 'SKILL.md']
for folder in ['scripts', 'references', 'tests', 'evals']:
    sources.extend(p for p in (skill / folder).rglob('*')
                   if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc')
with zipfile.ZipFile(downloads / 'practice-kit.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(sources):
        archive.write(file, file.relative_to(practice))
with zipfile.ZipFile(downloads / 'ticket-daily-report.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(sources):
        if 'ticket-daily-report' in file.relative_to(practice).parts:
            archive.write(file, file.relative_to(practice))
print('Packaged the practice kit and teaching Skill with shared tests/evals resources')
