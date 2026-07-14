import re
from pathlib import Path
import collections

html = Path('index.html').read_text(encoding='utf-8')
ids = re.findall(r'\bid="([^"]+)"', html)
counter = collections.Counter(ids)
dups = [i for i, c in counter.items() if c > 1]
print('Total IDs:', len(ids))
print('IDs duplicados:', dups)
