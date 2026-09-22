"""
Aivinci Studios — production asset pipeline.

Derives clean, HD web assets from the supplied reference art:
  * alpha cutouts (people, logo pieces, robot arm, phone/hand layers)
  * inpainted environments (fake headers / baked-in copy removed)
  * card media crops (baked captions removed)
  * poster frames + compressed video renditions

Run:  python tools/build_assets.py [all|logo|hero|services|approach|work|products|system|contact|video]
"""
import json
import os
import subprocess
import sys

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.dirname(ROOT)                       # the folder with the reference art
OUT = os.path.join(ROOT, "public", "assets")
VID = os.path.join(ROOT, "public", "video")

REF = {
    "logo": "Logo av .PNG",
    "home": "Home page .JPEG",
    "services": "03 service .JPEG",
    "grid": "04 services.PNG",
    "approach": None,  # only exists inside the docx (see APPROACH_SRC)
    "work": "06 our work .PNG",
    "products": "07 work idea .PNG",
    "system": "08 product .PNG",
    "contact": "10 contact .PNG",
}
APPROACH_SRC = os.environ.get(
    "APPROACH_SRC",
    os.path.join(os.environ.get("LOCALAPPDATA", ""), "Temp", "claude",
                 "C--Users-giris-OneDrive-Desktop-Aivinci-studios",
                 "252ae19c-5995-41a2-b912-33723f23bf7c", "scratchpad", "doc", "unpacked", "word", "media", "image5.jpeg"),
)


# ----------------------------------------------------------------------------- helpers
def load(name):
    p = os.path.join(SRC, REF[name]) if name != "approach" else APPROACH_SRC
    im = cv2.imread(p, cv2.IMREAD_COLOR)
    if im is None:
        raise SystemExit(f"missing source {p}")
    return im


def ensure(*parts):
    d = os.path.join(OUT, *parts)
    os.makedirs(d, exist_ok=True)
    return d


def save_png(path, bgra):
    cv2.imwrite(path, bgra, [cv2.IMWRITE_PNG_COMPRESSION, 9])
    print(f"  {os.path.relpath(path, ROOT)}  {bgra.shape[1]}x{bgra.shape[0]}  {os.path.getsize(path)//1024} KB")


def save_jpg(path, bgr, q=86):
    cv2.imwrite(path, bgr, [cv2.IMWRITE_JPEG_QUALITY, q, cv2.IMWRITE_JPEG_PROGRESSIVE, 1])
    print(f"  {os.path.relpath(path, ROOT)}  {bgr.shape[1]}x{bgr.shape[0]}  {os.path.getsize(path)//1024} KB")


def inpaint(img, rects=(), polys=(), radius=6, pad=2):
    """Remove baked-in UI/copy. rects: (x0,y0,x1,y1); polys: list of point lists."""
    mask = np.zeros(img.shape[:2], np.uint8)
    for (x0, y0, x1, y1) in rects:
        cv2.rectangle(mask, (x0 - pad, y0 - pad), (x1 + pad, y1 + pad), 255, -1)
    for poly in polys:
        cv2.fillPoly(mask, [np.array(poly, np.int32)], 255)
    return cv2.inpaint(img, mask, radius, cv2.INPAINT_TELEA)


def inpaint_text(img, rects=(), radius=5, bright=True, thresh=170, grow=3):
    """Remove baked-in copy by masking only the glyph pixels inside each rect (far less smear than a box)."""
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    mask = np.zeros(img.shape[:2], np.uint8)
    for (x0, y0, x1, y1) in rects:
        sub = g[y0:y1, x0:x1]
        m = (sub > thresh) if bright else (sub < thresh)
        mask[y0:y1, x0:x1] = m.astype(np.uint8) * 255
    mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * grow + 1, 2 * grow + 1)))
    return cv2.inpaint(img, mask, radius, cv2.INPAINT_TELEA)


def feather(mask01, px=1.2):
    return cv2.GaussianBlur(mask01.astype(np.float32), (0, 0), px)


def largest_component(mask01):
    n, lab, st, _ = cv2.connectedComponentsWithStats(mask01.astype(np.uint8), 8)
    if n <= 1:
        return mask01
    idx = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
    return (lab == idx).astype(np.uint8)


def fill_holes(mask01, max_area):
    inv = (1 - mask01).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(inv, 4)
    out = mask01.copy()
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < max_area:
            out[lab == i] = 1
    return out


def rgba(img, alpha01):
    bgra = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    bgra[:, :, 3] = np.clip(alpha01 * 255, 0, 255).astype(np.uint8)
    return bgra


def crop_alpha(bgra, pad=4):
    a = bgra[:, :, 3]
    ys, xs = np.where(a > 2)
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, bgra.shape[0])
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, bgra.shape[1])
    return bgra[y0:y1, x0:x1], (x0, y0, x1, y1)


def key_dark_bg(img, bg_level, softness, region=None, close_k=7, hole_area=2000):
    """Cutout for a subject that is darker than a flat light background."""
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    diff = np.clip(bg_level - g, 0, None)
    hard = (diff > 40).astype(np.uint8)
    if region is not None:
        r = np.zeros_like(hard)
        x0, y0, x1, y1 = region
        r[y0:y1, x0:x1] = 1
        hard &= r
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (close_k, close_k))
    hc = cv2.morphologyEx(hard, cv2.MORPH_CLOSE, k)
    comp = fill_holes(largest_component(hc), hole_area)
    dil = cv2.dilate(comp, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    soft = np.clip(diff / softness, 0, 1)
    alpha = np.where(dil > 0, soft, 0)
    core = cv2.erode(comp, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    alpha = np.where(core > 0, 1.0, alpha)
    return alpha


def rim_light(alpha01, light_dir=(0.55, -0.83), width=7, blur=5, strength=1.0):
    """White edge-light layer: alpha edge band weighted by the outward normal vs light direction."""
    a = alpha01.astype(np.float32)
    gx = cv2.Sobel(a, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(a, cv2.CV_32F, 0, 1, ksize=3)
    mag = np.sqrt(gx * gx + gy * gy) + 1e-6
    nx, ny = -gx / mag, -gy / mag              # outward normal
    w = np.clip(nx * light_dir[0] + ny * light_dir[1], 0, 1) ** 1.4
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (width, width))
    band = a - cv2.erode(a, k)
    band = np.clip(band, 0, 1) * w
    band = cv2.GaussianBlur(band, (0, 0), blur) * strength
    out = np.zeros((a.shape[0], a.shape[1], 4), np.uint8)
    out[:, :, :3] = 255
    out[:, :, 3] = np.clip(band * 255, 0, 255).astype(np.uint8)
    return out


# ----------------------------------------------------------------------------- logo
# The studio's logo ("Logo lockup 2026b.png"): the red mark, the metallic "ivinci" lettering and
# the CREATIVE STUDIOS line are one piece of artwork. It is used whole — cut out of its white
# background, never sliced — in the header, the opening animation and the footer. A second
# colouring recolours only the CREATIVE STUDIOS line white for dark chapters.
LOGO_SRC = "Logo lockup 2026b.png"
LOGO_CAPS_TOP = 680          # first row of the CREATIVE STUDIOS line in the source


def build_logo():
    print("[logo]")
    d = ensure("logo")
    src = os.path.join(SRC, LOGO_SRC)
    if not os.path.exists(src):
        raise SystemExit(f"missing {src}")
    bgr = cv2.imread(src, cv2.IMREAD_COLOR)
    lum = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)
    H, W = lum.shape

    # The artwork is rendered standing on a studio floor: its own reflection must not travel with
    # it. The solid forms are cut with a soft edge, then everything below each column's baseline
    # is dropped; the CREATIVE STUDIOS line underneath is cut separately, tighter (it is flat type
    # over the same reflection).
    soft = np.clip((248.0 - lum) / 18.0, 0, 1)
    body = np.zeros_like(soft)
    body[:LOGO_CAPS_TOP] = soft[:LOGO_CAPS_TOP]

    keep = (body > 0.08).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(keep, 8)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < 120:
            keep[labels == i] = 0
    # the metal's white highlights sit inside the shapes: fill the interiors so they stay opaque
    inv = (1 - keep).astype(np.uint8)
    nb, labb, _, _ = cv2.connectedComponentsWithStats(inv, 4)
    border = set(labb[0, :]) | set(labb[-1, :]) | set(labb[:, 0]) | set(labb[:, -1])
    filled = keep.copy()
    for i in range(1, nb):
        if i not in border:
            filled[labb == i] = 1
    alpha = np.maximum(body * keep, cv2.erode(filled, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))).astype(np.float32))

    # per-column baseline: the lowest genuinely solid pixel of the forms themselves
    solid = lum[:LOGO_CAPS_TOP] < 185
    rows = np.arange(LOGO_CAPS_TOP)[:, None]
    base = np.where(solid.any(axis=0), np.where(solid, rows, -1).max(axis=0), -1)
    below = rows > (base[None, :] + 2)
    alpha[:LOGO_CAPS_TOP][below] = 0

    # the CREATIVE STUDIOS line
    caps = np.clip((215.0 - lum[LOGO_CAPS_TOP:]) / 40.0, 0, 1)
    alpha[LOGO_CAPS_TOP:] = caps

    out = np.dstack([bgr, (np.clip(alpha, 0, 1) * 255).astype(np.uint8)])
    out, (x0, y0, x1, y1) = crop_alpha(out, pad=2)
    save_png(os.path.join(d, "lockup.png"), out)

    # dark chapters: the CREATIVE STUDIOS line is set in white, the metal and the mark unchanged
    white = out.copy()
    band = white[max(0, LOGO_CAPS_TOP - y0):]
    ink = cv2.cvtColor(band[:, :, :3], cv2.COLOR_BGR2GRAY) < 170
    for c in range(3):
        band[:, :, c][ink] = 255
    save_png(os.path.join(d, "lockup-white.png"), white)

    # the mark alone drives the favicons (a square of the red form)
    mark, _ = crop_alpha(out[:, : max(1, int((520 - x0)))], pad=2)
    side = int(max(mark.shape[:2]) * 1.08)
    square = np.zeros((side, side, 4), np.uint8)
    oy, ox = (side - mark.shape[0]) // 2, (side - mark.shape[1]) // 2
    square[oy:oy + mark.shape[0], ox:ox + mark.shape[1]] = mark
    for name, size in (("favicon.png", 256), ("apple-touch-icon.png", 180)):
        icon = cv2.resize(square, (size, size), interpolation=cv2.INTER_AREA)
        path = os.path.join(ROOT, "public", name)
        cv2.imwrite(path, icon)
        print(f"  {os.path.relpath(path, ROOT)}  {size}x{size}  {os.path.getsize(path)//1024} KB")

    with open(os.path.join(d, "lockup.json"), "w") as f:
        json.dump({"w": int(out.shape[1]), "h": int(out.shape[0])}, f)

    # the previous logo's slices are gone for good
    for stale in ("mark.png", "mark-tri.png", "mark-slab.png", "mark-sphere.png", "mark-shadow.png",
                  "mark.json", "word-aivinci-ink.png", "word-aivinci-white.png",
                  "word-studios-ink.png", "word-studios-white.png"):
        p = os.path.join(d, stale)
        if os.path.exists(p):
            os.remove(p)
            print(f"  removed {stale}")


# ----------------------------------------------------------------------------- hero
def build_hero():
    print("[hero]")
    d = ensure("hero")
    im = load("home")
    alpha = key_dark_bg(im, 238, 26, region=(470, 110, 1130, 864))
    person = rgba(im, alpha)
    person, _ = crop_alpha(person, pad=8)
    save_png(os.path.join(d, "person.png"), person)
    save_png(os.path.join(d, "person-rim.png"), rim_light(person[:, :, 3] / 255.0, strength=0.95))
    small = cv2.resize(person, (person.shape[1] * 2 // 3, person.shape[0] * 2 // 3), interpolation=cv2.INTER_AREA)
    save_png(os.path.join(d, "person-sm.png"), small)
    build_lens_mask()

    # stats box portrait (monochrome) — remove the baked "230+ / Global Clients" and the arrow
    port = im[610:792, 258:407].copy()
    port = inpaint(port, rects=[(48, 108, 140, 172), (116, 2, 146, 30)], radius=8)
    save_jpg(os.path.join(d, "stat-portrait.jpg"), port, 88)

    # featured work poster — the baked play control sits exactly under the live one; only the progress bar is removed
    feat = im[644:812, 1160:1482].copy()
    feat = inpaint(feat, rects=[(22, 142, 305, 154)], radius=8)
    save_jpg(os.path.join(d, "featured-poster.jpg"), feat, 88)


# The sunglass lenses of the hero character, traced on person.png (671 x 766): the near lens and
# the sliver of the far one. A soft alpha mask lets a light sweep play on the glass only.
LENS_NEAR = [(198, 165), (204, 158), (213, 153), (223, 151), (230, 155), (234, 165), (234, 178),
             (230, 190), (223, 198), (213, 201), (205, 199), (199, 192), (196, 181), (196, 172)]
LENS_FAR = [(185, 178), (191, 179), (195, 185), (196, 193), (193, 201), (188, 205), (182, 203),
            (179, 197), (179, 188), (181, 181)]


def build_lens_mask():
    d = ensure("hero")
    person = cv2.imread(os.path.join(d, "person.png"), cv2.IMREAD_UNCHANGED)
    h, w = person.shape[:2]
    mask = np.zeros((h, w), np.uint8)
    for poly in (LENS_NEAR, LENS_FAR):
        cv2.fillPoly(mask, [np.array(poly, np.int32)], 255)
    # stay on the glass: pull in from the frame, then a soft edge
    mask = cv2.erode(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)))
    mask = cv2.GaussianBlur(mask, (0, 0), 1.2)
    # only where the character actually is (never outside the cutout)
    mask = (mask.astype(np.float32) * (person[:, :, 3].astype(np.float32) / 255.0)).astype(np.uint8)
    out = np.dstack([np.full((h, w), 255, np.uint8)] * 3 + [mask])
    save_png(os.path.join(d, "lens-mask.png"), out)


# ----------------------------------------------------------------------------- services intro + grid
def build_services():
    print("[services]")
    d = ensure("services")
    im = load("services")
    env = im[0:525, :].copy()
    env = inpaint(env, rects=[
        (50, 12, 260, 58),          # fake logo + wordmark
        (930, 18, 1440, 48),        # fake nav
        (55, 80, 380, 325),         # CREATIVE SOLUTIONS ... TOMORROW.
        (55, 340, 360, 385),        # supporting line
        (1370, 120, 1500, 395),     # right vertical labels + line
    ], radius=9)
    env = inpaint(env, rects=[(0, 398, 1536, 525)], radius=12)   # SERVICES letter tops
    fade = np.linspace(1.0, 0.35, 525 - 380)[:, None, None]
    env = env.astype(np.float32)
    env[380:525] *= fade
    env = env.astype(np.uint8)
    save_jpg(os.path.join(d, "environment.jpg"), env, 84)

    save_jpg(os.path.join(d, "card-crew.jpg"), im[712:864, 310:802].copy(), 86)
    save_jpg(os.path.join(d, "card-lens.jpg"), im[712:864, 985:1225].copy(), 86)

    # ---- service grid card media (fixed editorial grid; edges refined against the paper background)
    grid = load("grid")
    g = cv2.cvtColor(grid, cv2.COLOR_BGR2GRAY)

    def refine(x, y, w, h):
        def col_dark(cx):
            return g[y + 10:y + h - 10, cx].mean() < 190

        def row_dark(cy):
            return g[cy, x + 10:x + w - 10].mean() < 190

        x0, x1, y0, y1 = x, x + w, y, y + h
        while x0 > 0 and col_dark(x0 - 1): x0 -= 1
        while not col_dark(x0): x0 += 1
        while x1 < g.shape[1] and col_dark(x1): x1 += 1
        while not col_dark(x1 - 1): x1 -= 1
        while y0 > 0 and row_dark(y0 - 1): y0 -= 1
        while not row_dark(y0): y0 += 1
        while y1 < g.shape[0] and row_dark(y1): y1 += 1
        while not row_dark(y1 - 1): y1 -= 1
        return (x0, y0, x1 - x0, y1 - y0)

    boxes = [refine(*b) for b in [(40, 283, 360, 168), (452, 283, 358, 168), (862, 284, 366, 167), (1275, 284, 358, 167),
                                  (40, 640, 357, 152), (446, 639, 367, 153), (865, 639, 363, 153), (1275, 639, 358, 153)]]
    names = ["ai-filmmaking", "brand-commercial", "social-digital", "creative-technology",
             "digital-experiences", "product-development", "vfx-motion", "audio-music"]
    caption_w = [112, 104, 92, 96, 100, 62, 82, 66]
    for name, (x, y, w, h), cw in zip(names, boxes, caption_w):
        card = grid[y:y + h, x:x + w].copy()
        card = inpaint(card, rects=[(10, h - 64, cw, h - 10), (w - 62, h - 62, w - 8, h - 8)], radius=9)
        save_jpg(os.path.join(d, f"grid-{name}.jpg"), card, 86)
    save_jpg(os.path.join(d, "arch.jpg"), grid[828:918, 1150:1242].copy(), 86)


# ----------------------------------------------------------------------------- our approach collage
def build_approach():
    print("[approach]")
    d = ensure("approach")
    im = load("approach")
    crops = {
        "eye": (283, 122, 615, 427),
        "profile": (522, 248, 697, 425),
        "set": (765, 122, 1194, 326),
        "portrait": (1362, 143, 1450, 284),
        "silhouette": (55, 570, 135, 694),
        "mountains": (350, 590, 757, 786),
        "hands": (797, 580, 913, 683),
        "lighttable": (1131, 563, 1392, 688),
    }
    for name, (x0, y0, x1, y1) in crops.items():
        img = im[y0:y1, x0:x1].copy()
        if name == "eye":
            img = inpaint(img, rects=[(302, 4, 328, 32)], radius=6)      # editorial cross marker
        if name == "lighttable":
            img = inpaint(img, rects=[(img.shape[1] - 34, 0, img.shape[1], 44)], radius=6)
        save_jpg(os.path.join(d, f"{name}.jpg"), img, 88)
        if name == "eye":
            save_jpg(os.path.join(d, "eye-tight.jpg"), img[:, :crops["profile"][0] - 6 - x0].copy(), 88)


# ----------------------------------------------------------------------------- our work (red chapter)
def build_work():
    print("[work]")
    d = ensure("work")
    im = load("work")
    H, W = im.shape[:2]
    tiles = [(0, 437, 228, 625), (236, 437, 478, 625), (484, 437, 705, 625), (718, 420, 940, 705),
             (950, 437, 1190, 625), (1198, 437, 1436, 625), (1444, 437, 1672, 625)]
    for i, (x0, y0, x1, y1) in enumerate(tiles, 1):
        t = im[y0:y1, x0:x1].copy()
        h, w = t.shape[:2]
        t = inpaint(t, rects=[(6, h - 40, 44, h - 8), (w - 60, h - 60, w - 8, h - 8)], radius=8)
        save_jpg(os.path.join(d, f"tile-{i:02d}.jpg"), t, 86)

    env = inpaint(im, rects=[
        (50, 15, 320, 75), (480, 20, 1080, 70), (1160, 22, 1330, 70), (1400, 18, 1615, 72),  # header
        (55, 175, 210, 200), (55, 215, 445, 380), (430, 380, 610, 398),                       # heading block
        (1470, 205, 1600, 300), (1210, 378, 1620, 398),                                        # right labels
        (50, 700, 120, 785), (1270, 720, 1420, 800), (1480, 725, 1625, 790),                   # bottom copy
        (50, 860, 500, 885),                                                                   # progress line
    ], radius=9)
    # the rail occludes the shoulders (y 412..632). Rebuild that band: red field + a plausible silhouette.
    y0, y1 = 412, 632
    band_mask = np.zeros((H, W), np.uint8); band_mask[y0 - 2:y1 + 2, :] = 255; band_mask[y0 - 2:712, 712:946] = 255
    field = cv2.inpaint(env, band_mask, 24, cv2.INPAINT_TELEA)
    field_blur = cv2.GaussianBlur(field, (0, 0), 18)
    field[y0 - 2:y1 + 2, :] = field_blur[y0 - 2:y1 + 2, :]
    field[y0 - 2:712, 712:946] = field_blur[y0 - 2:712, 712:946]

    def figure_row(y):
        r = im[y, :, 2].astype(np.int32); gch = im[y, :, 1].astype(np.int32)
        return (r < 38) & (gch < 30)

    def span(row, lo, hi):
        xs = np.where(row[lo:hi])[0]
        return (lo + xs.min(), lo + xs.max()) if len(xs) else (lo, hi)

    nl, nr = span(figure_row(y0 - 6), 560, 1100)
    tl, tr = span(figure_row(y1 + 8), 380, 1300)
    tl, tr = tl - 8, tr + 8                                     # include the red rim light on both edges
    nl, nr = nl + 44, nr - 44                                   # the collar is narrower than the hair above it
    src_row = im[y1 + 6:y1 + 34, :, :].astype(np.float32).mean(axis=0)   # shoulder texture incl. rim light
    keep = np.zeros((H, W), np.float32); keep[y0 - 2:y1 + 2, :] = 1; keep[y0 - 2:712, 712:946] = 1
    out = field.astype(np.float32)
    for y in range(y0 - 2, y1 + 2):
        t = min(max((y - (y0 - 2)) / 150.0, 0.0), 1.0)
        e = t * t * (3 - 2 * t)
        l = nl + (tl - nl) * e; r = nr + (tr - nr) * e
        xs = np.arange(int(l), int(r) + 1)
        n = len(xs)
        core = np.array([2, 1, 7], np.float32) * (1 - e) + np.array([1, 1, 3], np.float32) * e   # BGR, lit slightly at the top
        tex = np.tile(core, (n, 1))
        rim = 26
        if n > 2 * rim:
            tex[:rim] = src_row[tl:tl + rim]
            tex[-rim:] = src_row[tr - rim:tr]
        out[y, xs] = tex
    band = out[y0 - 6:y1 + 6, :]
    out[y0 - 6:y1 + 6, :] = cv2.GaussianBlur(band, (0, 0), 1.2)
    seam = out[y1 - 14:y1 + 14, :]
    out[y1 - 14:y1 + 14, :] = cv2.GaussianBlur(seam, (0, 0), sigmaX=0.1, sigmaY=5)
    keep[y1 - 14:y1 + 14, :] = 1
    env = np.where(keep[:, :, None] > 0, out, env.astype(np.float32)).astype(np.uint8)
    save_jpg(os.path.join(d, "environment.jpg"), env, 84)
    save_jpg(os.path.join(d, "environment-sm.jpg"), cv2.resize(env[0:941, 300:1380], (720, 627), interpolation=cv2.INTER_AREA), 82)


# ----------------------------------------------------------------------------- products (07 + 08)
def build_products():
    print("[products]")
    d = ensure("products")
    im = load("products")
    band = im[0:396, :].copy()
    band = inpaint(band, rects=[
        (50, 15, 300, 70), (500, 25, 1020, 62), (1200, 22, 1360, 65), (1425, 18, 1630, 70),
        (55, 285, 165, 372), (525, 190, 640, 240), (1100, 165, 1420, 275), (1490, 195, 1560, 220),
        (1300, 285, 1610, 378),
    ], radius=9)
    hole = np.zeros(band.shape[:2], np.uint8)
    cv2.rectangle(hole, (640, 78), (925, 396), 255, -1)
    cv2.rectangle(hole, (715, 356), (995, 396), 255, -1)
    band = cv2.inpaint(band, hole, 18, cv2.INPAINT_TELEA)
    # the fill is boxy; the whole band is a motion-blurred crowd, so blur the fill into its surroundings
    soft = cv2.GaussianBlur(band, (0, 0), 14)
    m = cv2.GaussianBlur(cv2.dilate(hole, np.ones((41, 41), np.uint8)).astype(np.float32) / 255.0, (0, 0), 16)[:, :, None]
    band = (soft * m + band * (1 - m)).astype(np.uint8)
    save_jpg(os.path.join(d, "crowd-bg.jpg"), band, 84)
    save_jpg(os.path.join(d, "crowd-bg-sm.jpg"), cv2.resize(band, (900, 213), interpolation=cv2.INTER_AREA), 80)

    # subject cutout: dark silhouette against the pale blur, inside the bracket area
    sub = im[78:392, 640:925].copy()
    sub = inpaint(sub, rects=[(0, 5, 285, 10), (0, 220, 285, 225), (6, 0, 11, 314), (271, 0, 276, 314)], radius=4, pad=1)
    sub = inpaint(sub, rects=[(75, 278, 285, 314)], radius=10)
    g = cv2.cvtColor(sub, cv2.COLOR_BGR2GRAY).astype(np.float32)
    hard = (g < 70).astype(np.uint8)
    hard = cv2.morphologyEx(hard, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    comp = fill_holes(largest_component(hard), 1500)
    dil = cv2.dilate(comp, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    softa = np.clip((110 - g) / 50.0, 0, 1)
    alpha = np.where(dil > 0, softa, 0)
    alpha = np.where(cv2.erode(comp, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))) > 0, 1, alpha)
    alpha[-10:, :] *= np.linspace(1, 0.0, 10)[:, None]
    save_png(os.path.join(d, "subject.png"), rgba(sub, alpha))

    card = im[483:713, 1243:1592].copy()
    card = inpaint(card, rects=[(158, 100, 210, 152), (14, 166, 110, 212)], radius=9)
    save_jpg(os.path.join(d, "action-card.jpg"), card, 86)

    # ---- hand + phone ----------------------------------------------------------------
    # The hand is a near-black silhouette in a near-black room: it cannot (and need not) be keyed.
    # The block blends into the section's matching dark field; only the phone is cut precisely.
    x0, y0, x1, y1 = 585, 355, 1115, 941
    reg = im[y0:y1, x0:x1].copy()
    h, w = reg.shape[:2]
    band_h = 396 - y0
    # the "POWERFUL TOOLS" callout (dot, bent connector, text) is rebuilt live; strip the baked one
    reg = inpaint(reg, rects=[(490, 126, 530, 182)], polys=[
        [(440, 128), (452, 128), (512, 200), (512, 312), (500, 312), (500, 206), (440, 142)]], radius=6, pad=1)
    outer = np.array([[146, 24], [400, 14], [354, 552], [94, 530]], np.float32)
    screen = [[156, 34], [388, 26], [342, 539], [107, 519]]

    def rounded_quad_mask(quad, radius):
        mk = np.zeros((h, w), np.uint8)
        cv2.fillPoly(mk, [quad.astype(np.int32)], 1)
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * radius + 1, 2 * radius + 1))
        return cv2.dilate(cv2.erode(mk, k), k)

    phone_mask = rounded_quad_mask(outer, 34).astype(np.float32)
    phone_alpha = cv2.GaussianBlur(phone_mask, (0, 0), 0.8)
    save_png(os.path.join(d, "phone.png"), rgba(reg, phone_alpha))

    block = np.ones((h, w), np.float32)
    block[:band_h, :] = 0
    fade = 28
    ramp = np.linspace(0, 1, fade)
    block[:, :fade] *= ramp[None, :]
    block[:, -fade:] *= ramp[::-1][None, :]
    block[-fade:, :] *= ramp[::-1][:, None]
    block[band_h:band_h + 10, :] *= np.linspace(0, 1, 10)[:, None]
    hand_alpha = block * (1 - cv2.GaussianBlur(phone_mask, (0, 0), 1.2))
    save_png(os.path.join(d, "hand.png"), rgba(reg, hand_alpha))

    # lit finger/thumb rims that overlap the device edge: drawn above the live screen UI.
    # Band: from 6px outside the outline to 7px inside the screen edge (never deep enough to catch UI copy).
    lum = cv2.cvtColor(reg, cv2.COLOR_BGR2GRAY).astype(np.float32)
    scr_mask = np.zeros((h, w), np.uint8)
    cv2.fillPoly(scr_mask, [np.array(screen, np.int32)], 1)
    inner = cv2.erode(scr_mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    band_mask = cv2.dilate(phone_mask.astype(np.uint8), np.ones((13, 13), np.uint8)) & (1 - inner)
    not_ui = (scr_mask == 0) | (lum < 118)
    fa = np.where((band_mask > 0) & not_ui, np.clip((lum - 22) / 60.0, 0, 1), 0).astype(np.float32)
    fa = cv2.GaussianBlur(fa, (0, 0), 0.8)
    save_png(os.path.join(d, "fingers.png"), rgba(reg, fa))
    with open(os.path.join(d, "hand.json"), "w") as f:
        json.dump({"w": w, "h": h, "bandTop": band_h, "screen": screen, "outer": outer.astype(int).tolist()}, f)


# ----------------------------------------------------------------------------- product system (09)
def build_system():
    print("[system]")
    d = ensure("system")
    im = load("system")
    H, W = im.shape[:2]
    # remove the grid hairlines so they don't ride along inside the generous cutout
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    col_mean = g[100:850, :].mean(axis=0)
    row_mean = g[:, 340:1150].mean(axis=1)
    lines_x = [x for x in range(330, 1200) if col_mean[x] > col_mean[max(x - 6, 0)] + 6 and col_mean[x] > col_mean[min(x + 6, W - 1)] + 6]
    lines_y = [y for y in range(95, 870) if row_mean[y] > row_mean[max(y - 6, 0)] + 6 and row_mean[y] > row_mean[min(y + 6, H - 1)] + 6]
    rects = [(x - 2, 0, x + 2, H) for x in lines_x] + [(0, y - 2, W, y + 2) for y in lines_y]
    clean = inpaint(im, rects=rects, radius=4, pad=0)
    clean = inpaint(clean, rects=[(550, 130, 640, 215), (550, 225, 590, 240), (700, 715, 830, 800), (700, 810, 740, 822)], radius=8)
    g = cv2.cvtColor(clean, cv2.COLOR_BGR2GRAY)
    reg = np.zeros((H, W), np.uint8)
    reg[120:870, 330:1150] = 1
    bright = ((g > 48).astype(np.uint8)) & reg
    bright = cv2.morphologyEx(bright, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    bright = cv2.morphologyEx(bright, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    comp = largest_component(bright)
    # black camera modules + base machinery: add generous manual regions (bg there is the same near-black)
    manual = np.zeros((H, W), np.uint8)
    cv2.circle(manual, (935, 222), 92, 1, -1)
    cv2.circle(manual, (708, 362), 80, 1, -1)
    cv2.circle(manual, (812, 455), 100, 1, -1)
    cv2.circle(manual, (500, 512), 62, 1, -1)
    cv2.rectangle(manual, (900, 620), (1125, 850), 1, -1)
    comp = fill_holes((comp | manual).astype(np.uint8), 30000)
    comp = cv2.morphologyEx(comp, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21)))
    alpha = feather(comp, 1.6)
    # inside the hand-drawn regions the black housings sit on the black floor: let true black fall away
    lum = cv2.cvtColor(clean, cv2.COLOR_BGR2GRAY).astype(np.float32)
    soft = np.clip((lum - 9) / 26.0, 0, 1)
    soft = cv2.GaussianBlur(soft, (0, 0), 1.0)
    alpha = np.where((manual > 0) & (bright == 0), alpha * soft, alpha)
    arm = rgba(clean, alpha)
    arm, box = crop_alpha(arm, pad=6)
    save_png(os.path.join(d, "robot-arm.png"), arm)
    small = cv2.resize(arm, (arm.shape[1] * 3 // 5, arm.shape[0] * 3 // 5), interpolation=cv2.INTER_AREA)
    save_png(os.path.join(d, "robot-arm-sm.png"), small)
    print("  arm box", box)


# ----------------------------------------------------------------------------- contact / reality
def build_contact():
    print("[contact]")
    d = ensure("contact")
    im = load("contact")
    H, W = im.shape[:2]
    # header + right-column copy sit on the dark room: a box inpaint is invisible there
    env = inpaint(im, rects=[
        (90, 18, 340, 65), (555, 25, 1060, 60), (1220, 20, 1380, 62), (1420, 15, 1620, 70),   # header
        (1285, 295, 1400, 315), (1285, 330, 1500, 435), (1285, 448, 1560, 490),                 # contact copy
        (1300, 555, 1640, 720), (1475, 775, 1640, 845),                                         # rows + plus
        (45, 880, 165, 918), (700, 885, 970, 905), (1440, 885, 1620, 905), (190, 893, 690, 897), (990, 893, 1420, 897),
    ], radius=9)
    # copy over the bright screen: mask the glyphs only, so the sky/lake gradient survives
    env = inpaint_text(env, rects=[
        (45, 130, 135, 235), (780, 122, 895, 145), (1285, 132, 1345, 220), (1555, 132, 1640, 215),
        (615, 445, 1095, 500), (1115, 452, 1240, 490),
    ], radius=6, thresh=175, grow=3)
    env = inpaint_text(env, rects=[(1110, 448, 1245, 495)], radius=6, thresh=110, grow=3)   # the thin rule + BEYOND IDEAS
    # small cross markers: boxes on the dark room (invisible), glyph masks on the bright screen
    env = inpaint(env, rects=[(cx - 13, cy - 13, cx + 13, cy + 13) for (cx, cy) in [
        (27, 25), (487, 25), (1185, 25), (1645, 25), (347, 210), (835, 210), (1443, 210), (1645, 470), (1325, 845), (1645, 915)]], radius=6)
    env = inpaint_text(env, rects=[(cx - 13, cy - 13, cx + 13, cy + 13) for (cx, cy) in [
        (27, 470), (347, 470), (487, 470), (835, 470), (347, 715), (347, 845), (27, 915)]], radius=5, thresh=110, grow=2)
    save_jpg(os.path.join(d, "environment.jpg"), env, 84)

    # foreground: the viewer + seating, isolated by darkness within the lower-right area
    g = cv2.cvtColor(env, cv2.COLOR_BGR2GRAY)
    reg = np.zeros((H, W), np.uint8)
    cv2.fillPoly(reg, [np.array([[640, 560], [1000, 520], [1672, 470], [1672, 941], [640, 941]], np.int32)], 1)
    dark = ((g < 60).astype(np.uint8)) & reg
    dark = cv2.morphologyEx(dark, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
    dark = fill_holes(largest_component(dark), 6000)
    fg = rgba(env, feather(dark, 1.5))
    fg, box = crop_alpha(fg, pad=4)
    save_png(os.path.join(d, "foreground.png"), fg)
    print("  foreground box", box)
    # base with the foreground smoothed away so parallax never doubles the viewer
    base_mask = (cv2.dilate(dark, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))) * 255).astype(np.uint8)
    base = cv2.inpaint(env.copy(), base_mask, 12, cv2.INPAINT_TELEA)
    save_jpg(os.path.join(d, "environment-base.jpg"), base, 84)
    save_jpg(os.path.join(d, "environment-sm.jpg"), cv2.resize(env, (1000, 563), interpolation=cv2.INTER_AREA), 82)


# ----------------------------------------------------------------------------- video
# The four production videos. Each role lists its sources in order of preference: the 4K
# masters Aivinci supplied ("… HD.mp4") first, the earlier 1080p files as the fallback.
# Renditions come from the best source present; a 1440p tier is cut only from a 4K master.
VIDEO_SOURCES = {
    "first-hero-video": ["Video (1) HD.mp4", "Video 1 HD.mp4", "1st hero video HD.mp4", "1st hero video.mp4"],
    "video-two": ["Video 2 HD.mp4", "video 2 hd.mp4", "2 video HD.mp4", "2 video.mp4"],
    "video-three": ["video 3 hd.mp4", "Video 3 HD.mp4", "video 3.mp4"],
    # slot 04 is the Hanuman film (the 4K master "Video 4 HD"); the car film stays on disk unused
    "last-video": ["Video 4 HD", "Video 4 HD.mp4", "video 4 hd.mp4", "last video HD.mp4", "Last video HD.mp4", "last video.mp4"],
}
# (suffix, height, crf, maxrate, minimum source height)
VIDEO_TIERS = (("1440", 1440, 25, "12M", 1440), ("1080", 1080, 24, "8M", 0), ("720", 720, 26, "4M", 0))
MANIFEST = os.path.join(ROOT, "src", "data", "video-manifest.json")


def video_intact(path):
    """True when the video stream really reaches the container's declared duration (a transfer
    that stopped early leaves a file whose index promises more than the stream holds)."""
    dur = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout.strip()
    last = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "packet=pts_time",
                           "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip().splitlines()
    try:
        declared, reached = float(dur), float(last[-1].split(",")[0])
    except (ValueError, IndexError):
        return False
    return reached >= declared - 0.5


def video_source(role):
    for name in VIDEO_SOURCES[role]:
        path = os.path.join(SRC, name)
        if not os.path.exists(path):
            continue
        if not video_intact(path):
            print(f"  ! {name}: the stream ends before its declared duration (incomplete file) — skipped")
            continue
        return path
    raise SystemExit(f"no usable source video for {role}")


def video_height(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=height",
                          "-of", "csv=p=0", path], capture_output=True, text=True, check=True)
    return int(out.stdout.strip().splitlines()[0])


def build_video():
    print("[video]")
    os.makedirs(VID, exist_ok=True)
    manifest = {}
    if os.path.exists(MANIFEST):
        manifest = json.load(open(MANIFEST, encoding="utf-8"))
    for role in VIDEO_SOURCES:
        src = video_source(role)
        height = video_height(src)
        signature = f"{os.path.basename(src)}:{os.path.getsize(src)}"
        entry = manifest.get(role, {})
        fresh = entry.get("source") == signature
        renditions = []
        for tag, h, crf, maxrate, min_h in VIDEO_TIERS:
            if height < min_h:
                continue
            dst = os.path.join(VID, f"{role}-{tag}.mp4")
            if not (fresh and os.path.exists(dst)):
                print(f"  encoding {role}-{tag} from {os.path.basename(src)} ({height}p) …")
                subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-an",
                                "-vf", f"scale=-2:{min(h, height)}:flags=lanczos",
                                "-c:v", "libx264", "-preset", "medium", "-crf", str(crf),
                                "-maxrate", maxrate, "-bufsize", f"{int(maxrate[:-1]) * 2}M",
                                "-profile:v", "high", "-pix_fmt", "yuv420p", "-g", "60",
                                "-movflags", "+faststart", dst], check=True)
                print(f"  {os.path.relpath(dst, ROOT)}  {os.path.getsize(dst)//1024} KB")
            renditions.append(tag)
        poster = os.path.join(VID, f"{role}-poster.jpg")
        if not (fresh and os.path.exists(poster)):
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", "0.5", "-i", src, "-frames:v", "1",
                            "-vf", "scale=1920:-2:flags=lanczos", "-q:v", "3", poster], check=True)
            print(f"  {os.path.relpath(poster, ROOT)}  {os.path.getsize(poster)//1024} KB")
        manifest[role] = {"source": signature, "sourceHeight": height, "renditions": renditions}
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        f.write("\n")
    print(f"  {os.path.relpath(MANIFEST, ROOT)}")


# ---------------------------------------------------------------- clients
# The three client portraits supplied by Aivinci ("Image 1.jpg" … "image 3.jpg" in the
# reference folder) become 4:5 portrait cards: a centred cover crop (faces are never
# distorted or clipped), a desktop and a phone rendition, JPEG + WebP each.
CLIENTS = ["Image 1.jpg", "image 2.jpg", "image 3.jpg"]
CLIENT_W, CLIENT_H = 900, 1125       # 4:5
CLIENT_SM_W, CLIENT_SM_H = 560, 700  # 4:5


def cover_crop(img, ratio_w, ratio_h, focus_y=0.42):
    """Crop to ratio around a focus point (fraction of height) without scaling distortion."""
    h, w = img.shape[:2]
    target = ratio_w / ratio_h
    if w / h > target:  # too wide: trim the sides
        nw = int(round(h * target))
        x0 = (w - nw) // 2
        return img[:, x0:x0 + nw]
    nh = int(round(w / target))  # too tall: trim top/bottom around the focus
    y0 = int(round(focus_y * h - nh / 2))
    y0 = max(0, min(h - nh, y0))
    return img[y0:y0 + nh, :]


def build_clients():
    from PIL import Image
    out = ensure("clients")
    for i, name in enumerate(CLIENTS, start=1):
        src = os.path.join(SRC, name)
        img = cv2.imread(src, cv2.IMREAD_COLOR)
        if img is None:
            raise SystemExit(f"missing client image {src}")
        crop = cover_crop(img, 4, 5)
        for w, h, suffix in ((CLIENT_W, CLIENT_H, ""), (CLIENT_SM_W, CLIENT_SM_H, "-sm")):
            resized = cv2.resize(crop, (w, h), interpolation=cv2.INTER_AREA)
            jpg = os.path.join(out, f"client-{i:02d}{suffix}.jpg")
            save_jpg(jpg, resized, q=84)
            Image.open(jpg).save(jpg[:-4] + ".webp", "WEBP", quality=84, method=6)
            print(f"  {os.path.relpath(jpg[:-4] + '.webp', ROOT)}  {os.path.getsize(jpg[:-4] + '.webp')//1024} KB")


# ---------------------------------------------------------------- webp companions
# The large alpha cutouts (the hand/phone layers, the audience) get a WebP sibling at ~1/4 the
# weight; the site serves it through <picture> with the PNG as the fallback.
# ---------------------------------------------------------------- founder frame
# The wide founder frame supplied by Aivinci ("person image.PNG", 1672 x 941): a desktop
# rendition at the reference frame size and a lighter phone rendition, JPEG + WebP each. The
# page blends its edges into the chapter so it reads as a continuation of the scene.
FOUNDER = "person image.PNG"


def build_founder():
    from PIL import Image
    src = os.path.join(SRC, FOUNDER)
    if not os.path.exists(src):
        raise SystemExit(f"missing {src}")
    out = ensure("studio")
    im = Image.open(src).convert("RGB")
    for w, suffix in ((1672, ""), (1000, "-sm")):
        r = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        jpg = os.path.join(out, f"founder-frame{suffix}.jpg")
        r.save(jpg, "JPEG", quality=86, optimize=True, progressive=True)
        r.save(jpg[:-4] + ".webp", "WEBP", quality=84, method=6)
        print(f"  {os.path.relpath(jpg, ROOT)}  {r.width}x{r.height}  {os.path.getsize(jpg)//1024} KB / webp {os.path.getsize(jpg[:-4] + '.webp')//1024} KB")


WEBP = [
    ("products", "phone.png"), ("products", "hand.png"), ("products", "fingers.png"),
    ("contact", "foreground.png"),
]


def build_webp():
    from PIL import Image
    for folder, name in WEBP:
        src = os.path.join(OUT, folder, name)
        if not os.path.exists(src):
            print("skip (missing)", src)
            continue
        im = Image.open(src).convert("RGBA")
        dst = src[:-4] + ".webp"
        im.save(dst, "WEBP", quality=90, method=6, exact=False)
        print("webp", dst, os.path.getsize(src) // 1024, "KB ->", os.path.getsize(dst) // 1024, "KB")


STEPS = {
    "logo": build_logo, "hero": build_hero, "services": build_services, "approach": build_approach,
    "work": build_work, "products": build_products, "system": build_system, "contact": build_contact,
    "video": build_video, "webp": build_webp, "clients": build_clients, "lens": build_lens_mask,
    "founder": build_founder,
}

if __name__ == "__main__":
    which = sys.argv[1:] or ["all"]
    for w in (STEPS.keys() if which == ["all"] else which):
        STEPS[w]()
