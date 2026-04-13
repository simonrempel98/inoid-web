"""
INOid App Icon Generator (Windows-kompatibel, nur Pillow)
"""
import os, sys
try:
    from PIL import Image
except ImportError:
    print("pip install Pillow"); sys.exit(1)

SIZES = [72, 96, 128, 144, 152, 180, 192, 512]
SOURCE = os.path.join(os.path.dirname(__file__), '..', 'public', 'Inometa_INOid_21x13mm.png')
OUT    = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
BG     = (0, 51, 102)   # #003366

os.makedirs(OUT, exist_ok=True)

logo_src = Image.open(SOURCE).convert('RGBA')

def make_icon(size, padding_ratio=0.18):
    canvas = Image.new('RGBA', (size, size), (*BG, 255))
    pad = int(size * padding_ratio)
    inner = size - pad * 2
    # Logo proportional skalieren (letterbox)
    logo = logo_src.copy()
    logo.thumbnail((inner, inner), Image.LANCZOS)
    lw, lh = logo.size
    x = (size - lw) // 2
    y = (size - lh) // 2
    canvas.paste(logo, (x, y), logo)
    return canvas.convert('RGB')

for s in SIZES:
    img = make_icon(s)
    img.save(os.path.join(OUT, f'icon-{s}.png'), 'PNG', optimize=True)
    print(f'  OK  icon-{s}.png')
    if s in (192, 512):
        make_icon(s, 0.10).save(os.path.join(OUT, f'icon-{s}-maskable.png'), 'PNG', optimize=True)
        print(f'  OK  icon-{s}-maskable.png')

make_icon(180).save(os.path.join(OUT, 'apple-touch-icon.png'), 'PNG', optimize=True)
print('  OK  apple-touch-icon.png')
print(f'\nFertig — Icons in public/icons/')
