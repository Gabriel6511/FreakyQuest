import os
from PIL import Image

FILES = [
    'arnold.png', 'aura_broly_icon.png', 'aura_goku_icon.png',
    'bebezinho_tribute.png', 'braceletes_aco_icon.png', 'brolyz.png',
    'capa_saitama_icon.png', 'cinturao_ouro_icon.png', 'faixa_lee_icon.png',
    'goku.png', 'logo.jpg', 'nickwalker.png', 'ramondino.png',
    'rocklee.png', 'saitama.png', 'shape_emagrecer.png',
    'shape_engordar.png', 'shape_estetico.png', 'shape_saude.png',
]

QUALITY = 90

rows = []
total_before = 0
total_after = 0
for f in FILES:
    before = os.path.getsize(f)
    out = os.path.splitext(f)[0] + '.webp'
    im = Image.open(f)
    im.save(out, 'WEBP', quality=QUALITY, method=6)
    after = os.path.getsize(out)
    total_before += before
    total_after += after
    rows.append((f, out, before, after))

print(f"{'original':30s} {'webp':30s} {'before(KB)':>12s} {'after(KB)':>12s} {'saved':>8s}")
for f, out, before, after in rows:
    saved = 100 * (1 - after / before)
    print(f"{f:30s} {out:30s} {before/1024:12.1f} {after/1024:12.1f} {saved:7.1f}%")

print()
print(f"TOTAL before: {total_before/1024/1024:.2f} MB")
print(f"TOTAL after:  {total_after/1024/1024:.2f} MB")
print(f"TOTAL saved:  {(total_before-total_after)/1024/1024:.2f} MB ({100*(1-total_after/total_before):.1f}%)")
