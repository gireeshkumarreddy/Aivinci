import { useEffect, useRef } from 'react'
import { Labels } from '../components/ui/Editorial'
import { workMedia as c } from '../data/content'
import { EASE, beat, gsap, isTouchDevice, useReducedMotion, useSectionReveal } from '../lib/motion'
import styles from './WorkMedia.module.css'
import { asset } from '../lib/assets'

/** 07 / PRODUCTS / THE FOUNDER — dark → controlled light → the founder frame, one continuous scene. */
export function WorkMedia() {
  const root = useRef<HTMLElement>(null)
  const scene = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useSectionReveal(
    root,
    (tl, el) => {
      const q = (s: string) => el.querySelectorAll(s)
      // Dark state 0–500: a full dark scene — no generic white fade
      tl.set(q('[data-wm="light"]'), { opacity: 0 }, 0)
      // Light reveal 450–1000: DARK → SUDDEN CONTROLLED LIGHT (cinematic illumination, not a flash)
      tl.fromTo(q('[data-wm="crowd"]'), { opacity: 0, filter: 'brightness(0.2) blur(6px)' }, { opacity: 1, filter: 'brightness(1) blur(0px)', duration: 0.55, ease: 'power2.inOut' }, 0.45)
      tl.fromTo(q('[data-wm="light"]'), { opacity: 0, scaleX: 0.6 }, { opacity: 1, scaleX: 1, duration: 0.55, ease: 'power2.out' }, 0.45)
      // Face / subject 700–1400: BACKGROUND → FOREGROUND, controlled focus and depth
      beat(tl, q('[data-wm="subject"]'), { at: [700, 1400], dir: 'depth', amount: 1.2, from: { y: 24 }, to: { y: 0 }, ease: EASE.settle })
      beat(tl, q('[data-wm="bracket"]'), { at: [900, 1400], dir: 'fade', ease: EASE.soft })
      beat(tl, q('[data-wm="copy"]'), { at: [800, 1450], dir: 'depth', amount: 0.4, stagger: 0.07, ease: EASE.settle })
      // The founder frame 900–1600: the scene continues — the frame resolves out of the dark
      // (brightness + focus), settling from a gentle scale, never a hard edge appearing
      tl.fromTo(q('[data-wm="founder-img"]'), { opacity: 0, scale: 1.05, filter: 'brightness(0.3) blur(8px)' }, { opacity: 1, scale: 1, filter: 'brightness(1) blur(0px)', duration: 0.7, ease: EASE.settle }, 0.9)
    },
    { start: 'top 60%' },
  )

  // Screen / camera movement 1400 ms+: subtle 3D float (paused off-screen, never on touch or reduced motion)
  useEffect(() => {
    const el = scene.current
    if (!el || reduced || isTouchDevice()) return
    gsap.set(el, { transformPerspective: 1800, transformOrigin: '50% 60%' })
    const tl = gsap.timeline({ repeat: -1, yoyo: true, paused: true, delay: 1.4 })
    tl.to(el, { rotationY: 0.7, rotationX: -0.45, y: -4, duration: 5.5, ease: 'sine.inOut' })
    tl.to(el, { rotationY: -0.6, rotationX: 0.4, y: 3, duration: 5.5, ease: 'sine.inOut' })
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.pause()), { threshold: 0.1 })
    if (root.current) io.observe(root.current)
    return () => {
      io.disconnect()
      tl.kill()
    }
  }, [reduced])

  return (
    <section ref={root} id="work-media" className={styles.section} data-section data-theme="dark" data-nav="products" aria-labelledby="workmedia-heading">
      <div ref={scene} className={styles.scene}>
        {/* ---- the crowd environment: begins dark, then a controlled light reveal ---- */}
        <div className={styles.band}>
          <picture>
            <source media="(max-width: 767px)" srcSet={asset('/assets/products/crowd-bg-sm.jpg')} />
            <img className={styles.crowd} src={asset('/assets/products/crowd-bg.jpg')} width={1672} height={396} alt="" loading="lazy" decoding="async" data-wm="crowd" draggable={false} />
          </picture>
          <span className={styles.light} data-wm="light" aria-hidden="true" />
          <span className={styles.bandFade} aria-hidden="true" />
          <div className={styles.bandInner}>
          <figure className={styles.subject} data-wm="subject">
            <img src={asset('/assets/products/subject.png')} width={285} height={314} alt="Profile of the Aivinci director in cold light" loading="lazy" decoding="async" draggable={false} />
          </figure>
          <span className={styles.bracket} data-wm="bracket" aria-hidden="true" />

          <Labels lines={c.labels} strong={3} className={styles.labels} data-wm="copy" />
          <Labels lines={c.callout} rule={false} className={styles.callout} data-wm="copy" />
          <div className={styles.headBlock}>
            <h2 id="workmedia-heading" className={`${styles.heading} t-headline-light`} data-wm="copy">
              <span>{c.heading[0]}</span>
              <span>
                {c.heading[1].slice(0, -1)}
                <span className={styles.dot}>.</span>
              </span>
            </h2>
            <span className={styles.marker} data-wm="copy">
              <span className="t-mono">{c.marker}</span>
              <span className={styles.markerLine} aria-hidden="true" />
            </span>
            <p className={styles.description} data-wm="copy">
              {c.description}
            </p>
          </div>
          </div>
        </div>

        {/* ---- the founder frame: full width, its edges dissolved into the chapter ---- */}
        <figure className={styles.founder} data-wm="founder">
          <picture className={styles.founderPicture}>
            <source type="image/webp" media="(max-width: 767px)" srcSet={asset(`/assets/studio/${c.founder.image}-sm.webp`)} />
            <source type="image/webp" srcSet={asset(`/assets/studio/${c.founder.image}.webp`)} />
            <source media="(max-width: 767px)" srcSet={asset(`/assets/studio/${c.founder.image}-sm.jpg`)} />
            <img src={asset(`/assets/studio/${c.founder.image}.jpg`)} width={1672} height={941} alt={c.founder.alt} loading="lazy" decoding="async" draggable={false} data-wm="founder-img" />
          </picture>
          <span className={styles.founderFade} aria-hidden="true" />
        </figure>
      </div>
    </section>
  )
}
