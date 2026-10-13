from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent
output=root/'build/course-static-backup.zip'
output.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as archive:
    for file in sorted((root/'dist').rglob('*')):
        if file.is_file(): archive.write(file,file.relative_to(root/'dist'))
print(f'Static-only backup: {output}')
print('Includes static resources only. Functions and D1 require the repository Wrangler/Actions deployment.')
