# Aivinci Studios — website

Implementation of the **Aivinci Studios Master Visual + Motion Document** as a single-page cinematic site.
The supplied Aivinci visuals are the visual source of truth; the document's animation tables drive every
section timeline (millisecond for millisecond, direction for direction).

## Stack

- Vite + React 19 + TypeScript
- GSAP 3 + ScrollTrigger (scroll-linked chapter timelines, the opening logo choreography)
- CSS Modules, container-query units for the poster-scale desktop stages, CSS 3D for depth systems
- Self-hosted fonts (Inter, Manrope, IBM Plex Mono, Caveat) — no runtime font requests

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview
```

## Structure

```
src/
  data/content.ts           every approved string on the site (single source of truth), incl. the studio's channels
  lib/motion.ts             beat() = one row of an animation table; useSectionReveal, pointer tilt, reduced motion
  lib/homography.ts         projective map used to seat the live product UI on the photographed phone
  components/layout/        Header (one live global header), LogoLockup (shared by intro, header + footer;
                            the lettering is the supplied logo artwork carried as alpha masks)
  components/ui/            Button, MediaSlot (video-ready container), Handwriting (draw-on copy), editorial bits
  components/product/       PhoneInHand (layered raster + live screen), ZynnectScreen (real HTML product UI)
  sections/                 00 Intro · 02 Hero · 03 ServicesIntro · 04 ServicesGrid · 05 Approach · 06 Work
                            06A AiVideoStory · 07 WorkMedia (The Studio) · 08 Products · 09 ProductSystem
                            10 Contact · Footer
tools/
  build_assets.py           derives every web asset from the reference art (cutouts, inpainting, crops, video)
  qa.mjs                    headless captures + overflow/console audits at any viewport (`?settled` mode)
  qa-intro.mjs              traces the opening logo → header → hero timeline
  qa-motion.mjs             captures a chapter mid-choreography after a realistic scroll trigger
  qa-el.mjs                 captures one chapter (settled or live) at several widths in one run
  qa-trace.mjs              traces computed opacity/transform of elements during a reveal
  qa-interact.mjs           interaction smoke test (nav, case study, product cards, search, form, videos)
public/assets/              generated production assets (run the pipeline to regenerate)
public/video/               VIDEO 01–04 renditions (1080p / 720p) + posters
```

## Assets

`python tools/build_assets.py [all|logo|hero|services|approach|work|products|system|contact|video|webp|clients]`

The pipeline reads the reference art from the parent folder and produces clean assets: alpha cutouts
(hero character + rim-light layer, logo pieces, robot arm, phone / hand / finger layers), environments with
fake headers and baked copy removed, card media with captions removed, and the four production videos
transcoded (H.264, 1080p + 720p, muted) with poster frames. The `webp` step writes WebP companions for
the heavy alpha cutouts (phone / hand / finger layers, the Contact audience); the site serves them through
`<picture>` with the PNG as the fallback.

Video mapping (as required by the document). Each slot takes the best source present in the reference
folder — the 4K master (`… HD.mp4`) when it exists, otherwise the earlier 1080p file — and the pipeline
writes `src/data/video-manifest.json` so the player knows which renditions exist:

| Slot | Content | Sources (best first) | Renditions |
| --- | --- | --- | --- |
| VIDEO 01 — first Hero video | tiger | `Video (1) HD.mp4` → `1st hero video.mp4` | `first-hero-video-1440/1080/720.mp4` |
| VIDEO 02 — video two | Ganesh | `Video 2 HD.mp4` → `2 video.mp4` | `video-two-1440/1080/720.mp4` |
| VIDEO 03 — video three | the fight | `video 3 hd.mp4` → `video 3.mp4` | `video-three-1440/1080/720.mp4` |
| VIDEO 04 — last video | the car film | `Car Video.mp4` → `Video 4 HD` → `last video.mp4` | `last-video-1440/1080/720.mp4` |

The 1440p tier is cut only from a 4K master and is served to large / high-density desktop screens (not
when the browser asks to save data); phones get 720p, everything else 1080p. Re-run
`python tools/build_assets.py video` after dropping a new master in the folder — outputs are re-encoded
only when their source changed.

Every other media area (service cards, work tiles, the product film, the hero feature) is an image: a
`MediaSlot` without `src` renders as a plain photograph (no player affordance); pass a `src` and it becomes
a live video without touching the layout.

The `founder` step prepares the wide founder frame supplied by Aivinci (`person image.PNG` in the
reference folder) for the Products chapter (JPEG + WebP, desktop + phone): it runs full width with its
edges dissolved into the chapter, its copy is part of the artwork. `clients` still builds the earlier
portrait cards should they be needed again.

## Motion

Every section calls `useSectionReveal(ref, (tl, root) => { beat(tl, target, { at: [start, end], dir }) … })`
with the numbers from the document tables. Directions are real (`left`, `right`, `top`, `bottom`, `depth`),
never fade-only. `prefers-reduced-motion` jumps every timeline to its settled state and skips the opening
animation; content and hierarchy are preserved.

GSAP's lag smoothing is disabled: a late frame advances every choreography by the real elapsed time, so
sections settle on schedule even on a busy device or a throttled embedded browser.

The Work rail is a seamless loop: the card set is rendered twice and a ticker drifts the track right → left
(one card every ~6.5 s), posing every card in 3D against the viewport centre each frame. Hover, a finger on
the rail, keyboard focus or an open case study ease it to a hold; the arrows and "View All Work" seat a card
at the centre; dragging moves it by hand. With reduced motion the rail stays still and only user actions move it.

`?settled` on the URL renders the whole page at its final state — used by the QA tools for deterministic
composition screenshots.

## Contact form

"Start the Conversation" posts to `public/api/contact.php`, a dependency-free PHP endpoint that e-mails
the enquiry to `studio@aivinci.ai` (honeypot, minimum fill time, size caps, header-injection stripping,
per-IP rate limit). It runs as-is on Hostinger / any PHP host; the mail is sent from the studio's own
mailbox with the visitor as Reply-To, so replies go straight back to them. If the endpoint is missing
(a static-only host, the Vite dev server) the page falls back to opening the visitor's mail app with
the message composed. To change the destination address edit `TO_EMAIL` in `contact.php` and
`brand.email` in `src/data/content.ts`.

## Deploy

The site is a static single-page build: `npm run build` → `dist/` (no server, no client-side routes).

- **Netlify / Vercel / Cloudflare Pages / Render**: connect the repository; the build command is
  `npm run build`, the publish directory `dist`, Node 22 (`netlify.toml`, `vercel.json`, `.nvmrc` are
  included; `public/_headers` gives long-lived caching for assets, video and fonts).
- **Plain static hosting (Hostinger / cPanel / FTP)**: `npm run build:static` builds with relative
  asset paths (`./assets/…`), so the *contents* of `dist/` can be uploaded to `public_html` (or any
  sub-folder) as-is — a `.htaccess` with the right MIME types and caching ships inside it.
- **Sub-path hosting** (e.g. GitHub Pages at `/Aivinci/`): build with `VITE_BASE=/Aivinci/ npm run build`
  (or `vite build --base=/Aivinci/`) — every asset URL honours the base.

Everything the page needs (fonts, images, WebP companions, the four videos in three renditions) lives
in `public/` and is committed, so a fresh clone builds and deploys as-is.

## QA

Always audit the **static export** as well as the dev server: `npm run build:static`, then
`node tools/serve-dist.mjs dist /site/ 8096` and run the audits with `QA_URL=http://127.0.0.1:8096/site/`
— relative asset paths only fail once the files are served from a folder. `tools/qa-webkit.mjs`
renders a page in WebKit (Playwright) as an iPhone for Safari-specific checks.

```bash
node tools/qa.mjs audit 390 844             # overflow offenders, console errors, failed requests, tiny text
node tools/qa.mjs shot 1440 900 out.png --full --audit
node tools/qa-intro.mjs 390 844             # opening sequence timing trace
node tools/qa-motion.mjs "#work" out.png 700 # frame 700 ms into the Work chapter's choreography
node tools/qa-el.mjs "#products" out 320,390,430 844 --offset 800   # one chapter at several widths
node tools/qa-webkit.mjs http://127.0.0.1:8096/site/?settled "#contact" out.png   # WebKit / iPhone render
node tools/qa-interact.mjs                  # interaction smoke test
```

Verified widths: 320 · 360 · 375 · 390 · 414 · 430 (mobile) · 768 (tablet) · 1024 · 1280 · 1440 (desktop).
