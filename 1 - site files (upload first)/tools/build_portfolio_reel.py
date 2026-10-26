#!/usr/bin/env python3
"""Builds the silent, looping highlight reel that plays on the iPad in
the Portfolio hero (work.html).

For every source video it scores each moment by how much changes on
screen (cuts + motion, via ffmpeg's scene score), skips dark frames and
the very start/end, and keeps the most dynamic window(s). Blurry frames (mid-transition
smears) are penalised so the picks are sharp. Those windows
are laid out for the iPad's 4:3 screen:
  - portrait clips play two side by side over a blurred backdrop
  - landscape talking-head clips are cropped to fill the screen
  - SaaS screen recordings are fitted whole (UI never cut off)
Every shot gets a slow push-in. Output:
  assets/video/portfolio-reel.mp4        1920x1440 (desktop, sharp on retina screens)
  assets/video/portfolio-reel-sm.mp4     1024x768 (phones)
  assets/video/portfolio-reel-poster.jpg
  assets/video/portfolio-reel.json       which section is on screen when

To change what's in the reel, edit ACTS below and run:
  python3 tools/build_portfolio_reel.py
"""
import json, os, re, subprocess, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VID = os.path.join(ROOT, 'assets', 'video')
W, H, FPS = 1920, 1440, 30

# kind: 'pair' = portrait (paired up side by side), 'fill' = crop to fill,
# 'fit' = show whole frame over a blurred backdrop. n = windows to take.
ACTS = [
  {'id': 'short-form', 'label': 'Short-form', 'clips': [
    ('rkd-1', 'pair', 2),
    ('zeeya-1', 'fill', 1),
    ('lake-nona-home-tour', 'pair', 2), ('ahmad-meta-ads', 'pair', 2),
    ('zeeya-2', 'fill', 1),
    ('ahmad-realestate', 'pair', 2), ('ahmad-clipping', 'pair', 2),
    ('zeeya-3', 'fill', 1),
  ]},
  {'id': 'saas', 'label': 'SaaS demos', 'clips': [
    ('saas-rerun', 'fit', 2), ('saas-babbel', 'fit', 2), ('saas-gemini', 'fit', 1),
    ('saas-grammarly', 'fit', 2), ('saas-codxna', 'fit', 1),
    ('saas-seo', 'fit', 1), ('saas-fashion', 'fit', 1),
  ]},
  # Long-form: add your own file here, e.g.
  # {'id': 'long-form', 'label': 'Long-form', 'clips': [('my-long-edit', 'fill', 3)]},
]
SEG = {'pair': 2.2, 'fill': 1.8, 'fit': 1.9}
PUSH = 0.045  # push-in amount over one shot


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def analyse(name):
    """Per-frame (time, scene score, brightness, blur) at 10 fps."""
    path = os.path.join(VID, name + '.mp4')
    out = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', path, '-an', '-vf',
         "fps=10,scale=320:-2,signalstats,blurdetect,select='gte(scene,0)',metadata=print:file=-",
         '-f', 'null', '-'], capture_output=True, text=True).stdout
    frames, t = [], None
    for line in out.splitlines():
        m = re.search(r'pts_time:([\d.]+)', line)
        if m:
            t = float(m.group(1)); frames.append([t, 0.0, 128.0, 0.0]); continue
        if frames and 'lavfi.scene_score=' in line:
            frames[-1][1] = float(line.split('=')[1])
        elif frames and 'lavfi.signalstats.YAVG=' in line:
            frames[-1][2] = float(line.split('=')[1])
        elif frames and 'lavfi.blur=' in line:
            frames[-1][3] = float(line.split('=')[1])
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                                '-of', 'csv=p=0', path], capture_output=True, text=True).stdout)
    return frames, dur


def best_windows(name, length, n):
    frames, dur = analyse(name)
    wl = int(length * 10)
    blurs = sorted(f[3] for f in frames) or [1]
    med = blurs[len(blurs) // 2] or 1
    lo, hi = min(0.6, dur * 0.05), dur - 0.8 - length
    cands = []
    for i, (t, *_) in enumerate(frames):
        if t < lo or t > hi:
            continue
        win = frames[i:i + wl]
        if len(win) < wl:
            break
        energy = sum(min(f[1], 0.5) for f in win)
        dark = sum(1 for f in win if f[2] < 28) / wl
        # how much blurrier than this video's normal frame (motion smears)
        blur = sum(max(0.0, f[3] / med - 1) for f in win) / wl
        # a hard cut in the first/last quarter-second makes a jarring flash
        edge = sum(f[1] for f in win[:3] + win[-3:] if f[1] > 0.3)
        cands.append((energy - 4 * dark - 2 * edge - 6 * blur, t))
    cands.sort(reverse=True)
    picked = []
    for score, t in cands:
        if all(abs(t - p) > length + 2 for p in picked):
            picked.append(t)
        if len(picked) == n:
            break
    if not picked:
        picked = [max(0, dur / 3)]
    return sorted(picked)


def push(d):
    # slow zoom over the shot, centred
    z = f'(1+{PUSH}*t/{d})'
    return (f"scale=w='trunc({W}*{z}/2)*2':h='trunc({H}*{z}/2)*2':eval=frame,"
            f"crop={W}:{H},setsar=1,fps={FPS},format=yuv420p")


def render(tmp, idx, kind, parts, d):
    out = os.path.join(tmp, f'seg{idx:03d}.mp4')
    inputs = []
    for name, t in parts:
        inputs += ['-ss', f'{t:.2f}', '-t', f'{d:.2f}', '-i', os.path.join(VID, name + '.mp4')]
    if kind == 'pair':
        cw = int(H * 9 / 16) // 2 * 2; gap = 34
        f = (f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=28:2,eq=brightness=-0.12[bg];"
             f"[0:v]scale={cw}:{H}:force_original_aspect_ratio=increase,crop={cw}:{H}[a];"
             f"[1:v]scale={cw}:{H}:force_original_aspect_ratio=increase,crop={cw}:{H}[b];"
             f"[bg][a]overlay={W//2 - cw - gap//2}:0[t];[t][b]overlay={W//2 + gap//2}:0,{push(d)}[v]")
    elif kind == 'fill':
        f = f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},{push(d)}[v]"
    else:
        f = (f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=28:2,eq=brightness=-0.15[bg];"
             f"[0:v]scale={W}:{H}:force_original_aspect_ratio=decrease[fg];"
             f"[bg][fg]overlay=(W-w)/2:(H-h)/2,{push(d)}[v]")
    run(['ffmpeg', '-y', '-v', 'error', *inputs, '-filter_complex', f, '-map', '[v]', '-an',
         '-t', f'{d:.2f}', '-r', str(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', out])
    return out


def main():
    tmp = tempfile.mkdtemp(prefix='reel-')
    segs, timeline, clock, idx = [], [], 0.0, 0
    for act in ACTS:
        start = clock
        shots = []
        pend = []
        for name, kind, n in act['clips']:
            d = SEG[kind]
            for t in best_windows(name, d, n):
                if kind == 'pair':
                    pend.append((name, t))
                else:
                    shots.append((kind, [(name, t)], d))
        # pair portrait windows from different videos, spread between the other shots
        # single shots: round-robin across videos so none repeats back to back
        byvid = {}
        for sh in shots:
            byvid.setdefault(sh[1][0][0], []).append(sh)
        shots = []
        while any(byvid.values()):
            for k in list(byvid):
                if byvid[k]:
                    shots.append(byvid[k].pop(0))
        pend_a, pend_b = pend[0::2], pend[1::2]
        pend_b = pend_b[1:] + pend_b[:1]  # shift so a pair never shows the same video twice
        pairs = [('pair', [a, b], SEG['pair']) for a, b in zip(pend_a, pend_b)]
        mixed = []
        while pairs or shots:
            if pairs: mixed.append(pairs.pop(0))
            if pairs and len(pairs) > len(shots): mixed.append(pairs.pop(0))
            if shots: mixed.append(shots.pop(0))
        for kind, parts, d in mixed:
            print(f'  {act["id"]:10} {kind:4} ' + ' + '.join(f'{n}@{t:.1f}s' for n, t in parts))
            segs.append(render(tmp, idx, kind, parts, d)); idx += 1; clock += d
        timeline.append({'id': act['id'], 'label': act['label'], 'start': round(start, 2), 'end': round(clock, 2)})

    lst = os.path.join(tmp, 'list.txt')
    with open(lst, 'w') as fh:
        fh.writelines(f"file '{s}'\n" for s in segs)
    master = os.path.join(tmp, 'master.mp4')
    run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', master])
    for out, size, crf in [('portfolio-reel.mp4', f'{W}:{H}', 23), ('portfolio-reel-sm.mp4', '1024:768', 24)]:
        run(['ffmpeg', '-y', '-v', 'error', '-i', master, '-vf', f'scale={size}:flags=lanczos', '-an',
             '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf), '-profile:v', 'high', '-pix_fmt', 'yuv420p',
             '-g', '60', '-movflags', '+faststart', os.path.join(VID, out)])
    run(['ffmpeg', '-y', '-v', 'error', '-ss', '0.6', '-i', os.path.join(VID, 'portfolio-reel.mp4'),
         '-frames:v', '1', '-q:v', '4', os.path.join(VID, 'portfolio-reel-poster.jpg')])
    with open(os.path.join(VID, 'portfolio-reel.json'), 'w') as fh:
        json.dump({'duration': round(clock, 2), 'acts': timeline}, fh, indent=1)
    # keep the label timings on the page in step with the new cut
    page = os.path.join(ROOT, 'work.html')
    html = open(page).read()
    acts = json.dumps({'duration': round(clock, 2), 'acts': timeline}, separators=(',', ':'))
    html = re.sub(r"data-reel-acts='[^']*'", "data-reel-acts='" + acts + "'", html)
    # new version stamp on the reel files so browsers drop any cached copy
    stamp = str(int(os.path.getmtime(os.path.join(VID, 'portfolio-reel.mp4'))))
    html = re.sub(r'(portfolio-reel(?:-sm)?\.mp4|portfolio-reel-poster\.jpg)(\?v=\d+)?', r'\1?v=' + stamp, html)
    open(page, 'w').write(html)
    print('duration', round(clock, 2), 'acts', timeline, '| work.html updated')


if __name__ == '__main__':
    main()
