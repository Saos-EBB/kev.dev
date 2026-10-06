# Face textures for /testCloth: cut out (BiRefNet portrait via rembg),
# cropped to the head (MediaPipe face landmarker box, extended up for a
# cap and down for the neck) and duotoned in the site's gradient.
#
#   pip install rembg[cpu] mediapipe pillow numpy
#   curl -O https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task
#   python3 scripts/face-textures.py front=photo1.jpg left=photo2.jpg ...
#
# Writes face-<name>.webp into the current folder (copy to public/test-cloth/).
# The photos themselves stay out of the repo.
import numpy as np, mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
from rembg import remove, new_session
from PIL import Image, ImageOps, ImageFilter
det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(base_options=BaseOptions(model_asset_path="face_landmarker.task")))
seg = new_session("birefnet-portrait")
STOPS = [(0.0,(0x14,0x0c,0x22)),(0.35,(0x6a,0x2a,0x8a)),(0.6,(0xcd,0x57,0xa6)),(0.8,(0xcd,0x57,0xff)),(1.0,(0x9f,0xd8,0xff))]
import sys
for name, path in (a.split("=", 1) for a in sys.argv[1:]):
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    W, H = im.size
    res = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.asarray(im)))
    if not res.face_landmarks: print(name, "no face"); continue
    pts = np.array([[p.x * W, p.y * H] for p in res.face_landmarks[0]])
    fx0, fy0 = pts.min(0); fx1, fy1 = pts.max(0)
    fw, fh = fx1 - fx0, fy1 - fy0
    cx = (fx0 + fx1) / 2
    half = max(fw, fh) * 0.95
    box = (int(max(0, cx - half)), int(max(0, fy0 - fh * 0.75)), int(min(W, cx + half)), int(min(H, fy1 + fh * 0.45)))
    crop = im.crop(box)
    cut = remove(crop.resize((crop.width // 2, crop.height // 2)), session=seg).resize(crop.size)
    a = np.asarray(cut).astype(np.float32) / 255
    rgb, al = a[..., :3], a[..., 3]
    hh = al.shape[0]
    al = al * np.clip((hh * 0.98 - np.arange(hh)) / (hh * 0.16), 0, 1)[:, None]
    lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
    lo, hi = np.percentile(lum[al > 0.5], [3, 97])
    t = np.clip((lum - lo) / (hi - lo), 0, 1)
    out = np.zeros(rgb.shape, np.float32)
    for (t0, c0), (t1, c1) in zip(STOPS, STOPS[1:]):
        m = (t >= t0) & (t <= t1); k = ((t - t0) / (t1 - t0))[..., None]
        out[m] = (np.array(c0) * (1 - k) + np.array(c1) * k)[m]
    res_im = Image.fromarray(np.dstack([out, al * 255]).astype(np.uint8), "RGBA")
    res_im = res_im.resize((900, int(900 * res_im.height / res_im.width)), Image.LANCZOS)
    res_im.save(f"face-{name}.webp", quality=88)
    prev = Image.new("RGBA", res_im.size, (8, 7, 10, 255)); prev.alpha_composite(res_im)
    prev.convert("RGB").resize((300, int(300 * res_im.height / res_im.width))).save(f"prev-{name}.png")
    print(name, res_im.size)
