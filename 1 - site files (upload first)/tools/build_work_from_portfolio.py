#!/usr/bin/env python3
"""Rebuild work.html (the main site's Portfolio page) from the standalone
portfolio page in ~/Desktop/quovex portfolio page/index.html.

The standalone page is the master copy. The site version is the same page
with the site's navbar put back, links made relative again, and the few
"no navbar" layout tweaks taken out. It also copies the videos and the
portfolio script the page needs into this site's assets.

Run it from anywhere:  python3 tools/build_work_from_portfolio.py
"""
import os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.dirname(HERE)
SRC_DIR = os.path.expanduser('~/Desktop/quovex portfolio page')
SRC = os.path.join(SRC_DIR, 'index.html')
DST = os.path.join(SITE, 'work.html')
LIVE = 'https://quovex.quovex-agency.workers.dev/'

if not os.path.exists(SRC):
    sys.exit('Portfolio page not found: ' + SRC)

src = open(SRC, encoding='utf-8').read()
old = open(DST, encoding='utf-8').read()


def cut(s, start, end, keep_end=False):
    a = s.index(start)
    b = s.index(end, a) + (0 if keep_end else len(end))
    return s[:a] + s[b:]


# 1. the site's navbar + phone menu, taken from the current work.html
nav = old[old.index('<nav class="nav" aria-label="Main">'):old.index('<div class="sheet"') if '<div class="sheet"' in old else old.index('<section class="portfolio-hero"')]
nav = nav.rstrip() + '\n\n'

out = src
# drop the "no navbar" top strip and put the navbar in front of the page
out = cut(out, '<header class="c-top">', '</header>\n')
out = out.replace('<div class="sheet" id="sheet">', nav + '<div class="sheet" id="sheet">', 1)

# 2. head: canonical + manifest, like every other page of the site
out = out.replace('<link href="assets/favicon-logo.png" rel="icon" type="image/png"/>',
                  '<link href="work.html" rel="canonical"/>\n<link href="assets/favicon-logo.png" rel="icon" type="image/png"/>', 1)
out = out.replace('<link href="assets/apple-touch-icon.png" rel="apple-touch-icon"/>',
                  '<link href="assets/apple-touch-icon.png" rel="apple-touch-icon"/>\n<link href="site.webmanifest" rel="manifest"/>', 1)

# 3. links back to relative ones
out = out.replace('href="' + LIVE + '"', 'href="index.html"')
out = out.replace('href="' + LIVE, 'href="')

# 4. layout tweaks that only exist because the standalone page has no navbar
out = re.sub(r'\.sheet \.portfolio-hero\{[^}]*\}\n', '', out)
if '/* phones: no dock any more' in out:
    out = cut(out, '/* phones: no dock any more', '/* phones: keep scrolling at full frame rate', keep_end=True)

open(DST, 'w', encoding='utf-8').write(out)

# 5. assets the page needs
for name in ['portfolio-3d.js', 'concrete.webp']:
    shutil.copy2(os.path.join(SRC_DIR, 'assets', name), os.path.join(SITE, 'assets', name))
vids = os.path.join(SRC_DIR, 'assets', 'video')
for name in os.listdir(vids):
    if name.startswith('testimonial-'):
        shutil.copy2(os.path.join(vids, name), os.path.join(SITE, 'assets', 'video', name))

# sanity checks
assert 'class="c-top"' not in out, 'top strip still there'
assert 'no dock any more' not in out, 'no-navbar tweaks still there'
assert LIVE not in out, 'live links still there'
assert '<nav class="nav"' in out, 'navbar missing'
print('work.html rebuilt from', SRC)
