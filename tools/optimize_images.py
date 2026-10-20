"""Create WebP derivatives and build-time dimension metadata; originals stay intact."""
from pathlib import Path
from PIL import Image, ImageOps
import json

ROOT = Path(__file__).resolve().parents[1]
target = ROOT / 'assets' / 'media'
target.mkdir(exist_ok=True)
manifest = {}
for source in sorted((ROOT / 'assets' / 'img').iterdir()):
    if source.suffix.lower() not in {'.png', '.jpg', '.jpeg'}:
        continue
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        width, height = image.size
        sizes = []
        for size in sorted({min(width, n) for n in [480, 800, 1280]}):
            path = target / f'{source.stem}-{size}.webp'
            resized = image.resize((size, round(height * size / width)), Image.Resampling.LANCZOS)
            resized.save(path, 'WEBP', quality=83, method=6)
            sizes.append({'src': '/' + path.relative_to(ROOT).as_posix(), 'width': size})
        manifest['/assets/img/' + source.name] = {'src': sizes[-1]['src'], 'width': width, 'height': height, 'sizes': sizes}
(ROOT / '_data' / 'images.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(f'Optimized {len(manifest)} original images without changing their bytes.')
