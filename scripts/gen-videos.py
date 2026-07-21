# Renders a small cinematic Ken-Burns hero video per landing-page model from its real gallery photos.
import subprocess, os, json, glob, time, re
from concurrent.futures import ThreadPoolExecutor, as_completed

FF = r"C:/Users/zahci/AppData/Local/Programs/Python/Python311/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe"
ROOT = os.getcwd()
built = json.load(open(ROOT + '/scripts/_built.json', encoding='utf-8'))
os.makedirs(ROOT + '/videos/lp', exist_ok=True)

W, H, DUR, X, FPS, CRF = 768, 432, 3.0, 0.6, 18, 38

def ext_imgs(folder):
    hd = sorted(glob.glob(f'images/gallery/{folder}-hd/*.jpg'))
    files = hd if len(hd) >= 3 else sorted(glob.glob(f'images/gallery/{folder}/*.jpg'))
    def key(p):
        b = os.path.basename(p).lower()
        # exterior first (ext1..4, front/side/grille/wheel), interior last
        if re.search(r'ext[1-4]|front|side|grille|wheel', b): return (0, b)
        return (1, b)
    files.sort(key=key)
    ext = [p for p in files if key(p)[0] == 0]
    pick = ext[:3] if len(ext) >= 2 else files[:3]
    while len(pick) < 2 and files: pick.append(files[0])
    return [p.replace('\\', '/') for p in pick] or files[:1]

def render(folder):
    out = f'videos/lp/{folder}.mp4'
    imgs = ext_imgs(folder)
    if not imgs: return folder, 'no-imgs'
    d = int(round(DUR * FPS))
    args = [FF, '-y']
    for im in imgs: args += ['-loop', '1', '-t', str(DUR), '-i', im]
    parts = []
    for i in range(len(imgs)):
        parts.append(f"[{i}:v]scale=1100:620:force_original_aspect_ratio=increase,crop=1100:620,"
                     f"zoompan=z='min(zoom+0.0006,1.07)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={d}:s={W}x{H}:fps={FPS},setsar=1[v{i}]")
    L = DUR; prev = 'v0'; cum = L
    for i in range(1, len(imgs)):
        off = round(cum - X, 3); o = f'x{i}' if i < len(imgs) - 1 else 'vout'
        parts.append(f"[{prev}][v{i}]xfade=transition=fade:duration={X}:offset={off}[{o}]"); prev = o; cum += L - X
    map_lbl = '[vout]' if len(imgs) > 1 else '[v0]'
    args += ['-filter_complex', ';'.join(parts), '-map', map_lbl, '-pix_fmt', 'yuv420p',
             '-c:v', 'libx264', '-crf', str(CRF), '-preset', 'veryfast', '-movflags', '+faststart', out]
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode != 0: return folder, 'ERR ' + r.stderr[-300:]
    return folder, '%.0fKB' % (os.path.getsize(out) / 1024)

targets = [b['folder'] for b in built if b['folder'] != 'jaecoo-8']
print('rendering', len(targets), 'videos...', flush=True)
t0 = time.time(); done = 0
with ThreadPoolExecutor(max_workers=6) as ex:
    futs = {ex.submit(render, f): f for f in targets}
    for fut in as_completed(futs):
        folder, res = fut.result(); done += 1
        print(f'[{done}/{len(targets)}] {folder}: {res}', flush=True)
print('ALL DONE in %.0fs' % (time.time() - t0), flush=True)
