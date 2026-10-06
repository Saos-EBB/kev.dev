# Face mesh from several photos: MediaPipe's 478 3D landmarks per photo,
# each aligned onto the frontal one (similarity Procrustes), then averaged.
# Out: renderer model files ({vs, fs}) — edges of the face tesselation —
# for /testModel (src/test/models/).
#
#   pip install mediapipe pillow numpy   (+ face_landmarker.task, see face-textures.py)
#   python3 scripts/head-mesh.py front.jpg left.jpg right.jpg ...
#
# The first photo is the frontal reference the others are aligned to.
import numpy as np, mediapipe as mp, json
from mediapipe.tasks.python import vision, BaseOptions
from PIL import Image, ImageOps
import sys
PHOTOS = {("front" if i == 0 else f"p{i}"): path for i, path in enumerate(sys.argv[1:])}
det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path="face_landmarker.task")))
sets = {}
for name, path in PHOTOS.items():
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    W, H = im.size
    r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.asarray(im)))
    sets[name] = np.array([[p.x * W, p.y * H, p.z * W] for p in r.face_landmarks[0]])
    print(name, len(sets[name]))

def procrustes(src, dst):
    ms, md = src.mean(0), dst.mean(0)
    a, b = src - ms, dst - md
    u, s, vt = np.linalg.svd(a.T @ b)
    d = np.sign(np.linalg.det(u @ vt))
    D = np.diag([1, 1, d])
    R = u @ D @ vt
    scale = (s * np.diag(D)).sum() / (a ** 2).sum()
    return scale * a @ R + md

ref = sets["front"]
aligned = [ref] + [procrustes(sets[n], ref) for n in sets if n != "front"]
for n, a in zip(sets, aligned):
    print(n, "rms to front", round(float(np.sqrt(((a - ref) ** 2).sum(1).mean())), 2))
fused = np.median(np.stack(aligned), axis=0)

edges = [(c.start, c.end) for c in vision.FaceLandmarksConnections.FACE_LANDMARKS_TESSELATION]

# The tesselation only lists edges; its triangles are the 3-cliques.
adj = {}
for a, b in edges:
    adj.setdefault(a, set()).add(b)
    adj.setdefault(b, set()).add(a)
tris = sorted({tuple(sorted((a, b, c))) for a, b in edges for c in adj[a] & adj[b]})

# More detail: split every triangle into 4, twice (16x the triangles), then
# relax the new points onto a smooth surface (Taubin smoothing — doesn't
# shrink). The 478 measured landmarks stay exactly where they were; the
# new points only interpolate between them, they add no new measurements.
SUBDIVISIONS = 2

def subdivide(pts, tris):
    pts = list(pts)
    mid = {}
    def m(a, b):
        k = (a, b) if a < b else (b, a)
        if k not in mid:
            mid[k] = len(pts)
            pts.append((np.asarray(pts[a]) + np.asarray(pts[b])) / 2)
        return mid[k]
    out = []
    for a, b, c in tris:
        ab, bc, ca = m(a, b), m(b, c), m(c, a)
        out += [(a, ab, ca), (ab, b, bc), (ca, bc, c), (ab, bc, ca)]
    return np.array(pts), out

def taubin(pts, tris, fixed, iters=12, lam=0.5, mu=-0.53):
    nb = [set() for _ in pts]
    for a, b, c in tris:
        nb[a] |= {b, c}; nb[b] |= {a, c}; nb[c] |= {a, b}
    nb = [list(n) for n in nb]
    free = np.array([i >= fixed for i in range(len(pts))])
    for _ in range(iters):
        for f in (lam, mu):
            avg = np.array([pts[n].mean(0) for n in nb])
            pts = np.where(free[:, None], pts + f * (avg - pts), pts)
    return pts

def detailed(pts):
    p, t = pts, tris
    for _ in range(SUBDIVISIONS):
        p, t = subdivide(p, t)
    return taubin(p, t, fixed=len(pts)), t

def export(pts, name):
    pts, faces = detailed(pts)
    p = pts - pts.mean(0)
    p = p / np.abs(p).max()
    p[:, 1] *= -1  # image y points down, the renderer's y points up
    vs = [{"x": round(float(x), 4), "y": round(float(y), 4), "z": round(float(z), 4)} for x, y, z in p]
    with open(f"head-{name}.json", "w") as f:
        json.dump({"vs": vs, "fs": [list(t) for t in faces]}, f, separators=(",", ":"))
    print(name, len(vs), "points,", len(faces), "triangles")
export(fused, "fused")
export(ref, "front")
