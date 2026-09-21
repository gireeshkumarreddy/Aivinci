import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LogoLockup, MARK_RATIO } from '../components/layout/LogoLockup'
import { EASE, gsap, useMedia, useReducedMotion } from '../lib/motion'
import styles from './Intro.module.css'
import { asset } from '../lib/assets'

interface Props {
  /** fired at 3500 ms — the logo has locked into the header */
  onLock: () => void
  /** fired at 4000 ms — the homepage may begin */
  onHandoff: () => void
  /** fired when the overlay is gone (5000 ms) */
  onDone: () => void
}

/** Sphere position of the mark inside its box (from the HD asset geometry). */
const SPHERE = { cx: 0.648, cy: 0.218, r: 0.192 } // r relative to box height

/**
 * 00 / OPENING LOGO ANIMATION — 5-second brand reveal.
 * White canvas → spheres/lines awaken → connection → metallic form assembles from
 * depth → the mark resolves → the lockup travels CENTRE → UPPER-LEFT → header lock.
 */
export function Intro({ onLock, onHandoff, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const lockup = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const isMobile = useMedia('(max-width: 900px)')
  const [placed, setPlaced] = useState(false)
  const fired = useRef(false)

  // Reduced motion: no opening sequence at all — the logo is simply in the header.
  useEffect(() => {
    if (reduced && !fired.current) {
      fired.current = true
      onLock()
      onHandoff()
      onDone()
    }
  }, [reduced, onLock, onHandoff, onDone])

  useLayoutEffect(() => {
    if (reduced) return
    const el = root.current
    const lk = lockup.current
    if (!el || !lk) return
    let cancelled = false

    const run = async () => {
      try {
        await document.fonts.ready
      } catch {
        /* fonts are optional for the choreography */
      }
      if (cancelled) return
      const headerBrand = document.querySelector<HTMLElement>('[data-header-brand] [data-lockup-mark]')
      const headerWord = document.querySelector<HTMLElement>('[data-header-brand] [data-lockup-word]')
      const headerLockup = document.querySelector<HTMLElement>('[data-header-brand] > div')
      if (!headerBrand || !headerWord || !headerLockup) return

      // 1. seat the intro lockup exactly where the header lockup lives
      const hr = headerLockup.getBoundingClientRect()
      gsap.set(lk, { position: 'fixed', left: hr.left, top: hr.top, width: hr.width, height: hr.height, margin: 0 })
      setPlaced(true)
      await new Promise((r) => requestAnimationFrame(r))
      if (cancelled) return

      const mark = lk.querySelector<HTMLElement>('[data-lockup-mark]')!
      const word = lk.querySelector<HTMLElement>('[data-lockup-word]')!
      const pieces = {
        tri: mark.querySelector<HTMLElement>('[data-piece="tri"]')!,
        slab: mark.querySelector<HTMLElement>('[data-piece="slab"]')!,
        sphere: mark.querySelector<HTMLElement>('[data-piece="sphere"]')!,
      }
      const mr = mark.getBoundingClientRect()
      const wr = word.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      // centre composition (frame 05): mark above, wordmark beneath
      const S = Math.min(isMobile ? 2.1 : 2.75, (vw * 0.5) / mr.width)
      const SW = Math.min(isMobile ? 1.55 : 1.9, (vw * 0.8) / wr.width)
      const cx = vw / 2
      const cy = vh * (isMobile ? 0.44 : 0.46)
      const markCentreY = cy - (S * mr.height) * 0.12
      const markStart = {
        x: cx - (S * mr.width) / 2 - mr.left,
        y: markCentreY - (S * mr.height) / 2 - mr.top,
        scale: S,
      }
      const wordStart = {
        x: cx - (SW * wr.width) / 2 - wr.left,
        y: markCentreY + (S * mr.height) / 2 + (isMobile ? 26 : 38) - wr.top,
        scale: SW,
      }
      gsap.set([mark, word], { transformOrigin: '0 0' })
      gsap.set(mark, markStart)
      gsap.set(word, wordStart)
      gsap.set(word, { opacity: 0 })
      gsap.set([pieces.tri, pieces.slab, pieces.sphere], { opacity: 0 })

      // where the mark's sphere sits on screen at the centred scale (for the metallic sphere hand-off)
      const sphereScreen = {
        x: cx - (S * mr.width) / 2 + SPHERE.cx * S * mr.width,
        y: markCentreY - (S * mr.height) / 2 + SPHERE.cy * S * mr.height,
        r: SPHERE.r * S * mr.height,
      }
      const scene = el.querySelector<HTMLElement>('[data-scene]')!
      const core = el.querySelector<HTMLElement>('[data-core]')!
      const orbit = el.querySelector<HTMLElement>('[data-orbit]')!
      const rings = Array.from(el.querySelectorAll<SVGEllipseElement>('[data-ring]'))
      const sats = Array.from(el.querySelectorAll<SVGCircleElement>('[data-sat]'))
      const axis = el.querySelector<SVGLineElement>('[data-axis]')!
      const elements = Array.from(el.querySelectorAll<HTMLElement>('[data-element]'))
      const shadow = el.querySelector<HTMLElement>('[data-shadow]')!
      const coreSize = Math.max(sphereScreen.r * 2, 56)
      gsap.set(scene, { x: cx, y: markCentreY + (isMobile ? 10 : 20) })
      gsap.set(core, { width: coreSize, height: coreSize, xPercent: -50, yPercent: -50, opacity: 0, scale: 0.3, filter: 'blur(14px)' })
      gsap.set(orbit, { opacity: 0 })
      gsap.set(rings, { strokeDasharray: 1, strokeDashoffset: 1 })
      gsap.set(sats, { opacity: 0, scale: 0, transformOrigin: '50% 50%' })
      gsap.set(axis, { scaleY: 0, transformOrigin: '50% 50%', opacity: 0 })
      gsap.set(shadow, { x: cx, y: markCentreY + (S * mr.height) / 2 + (isMobile ? 6 : 10), xPercent: -50, yPercent: -50, opacity: 0, width: S * mr.width * 1.1 })

      const tl = gsap.timeline({ defaults: { ease: EASE.cine } })

      // ---- 250–1100 ms  Elements awaken: spheres/lines activate and connect
      elements.forEach((g, i) => {
        const ball = g.querySelector('[data-ball]')
        const line = g.querySelector('[data-line]')
        const sh = g.querySelector('[data-ball-shadow]')
        const t0 = 0.25 + i * 0.09
        tl.fromTo(ball, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.55, ease: EASE.settle }, t0)
        tl.fromTo(sh, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.6, ease: EASE.soft }, t0 + 0.05)
        tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: EASE.cine }, t0 + 0.18)
      })
      // connection creates motion: the elements drift toward the forming system
      tl.to(elements, { x: (i) => [ -22, 18, -14, 20 ][i % 4], y: (i) => [ 10, 14, -12, -8 ][i % 4], duration: 0.7, ease: EASE.inOut, stagger: 0.04 }, 0.8)

      // ---- 700–1800 ms  Central form: metallic form assembles from depth
      tl.to(core, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.9, ease: EASE.settle }, 0.7)
      tl.to(orbit, { opacity: 1, duration: 0.4 }, 0.9)
      tl.to(rings, { strokeDashoffset: 0, duration: 0.8, ease: EASE.inOut, stagger: 0.12 }, 0.95)
      tl.to(axis, { scaleY: 1, opacity: 1, duration: 0.5 }, 1.2)
      tl.to(sats, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.08, ease: EASE.settle }, 1.15)
      tl.to(orbit, { rotation: 38, duration: 1.7, ease: EASE.inOut }, 0.9)

      // ---- 1500–2500 ms  Logo resolve: the brand mark forms
      tl.to(elements, { opacity: 0, scale: 0.6, duration: 0.45, ease: EASE.soft, stagger: 0.04 }, 1.5)
      // the metallic core travels to the sphere slot and becomes the sphere piece
      tl.to(core, { x: sphereScreen.x - cx, y: sphereScreen.y - (markCentreY + (isMobile ? 10 : 20)), width: sphereScreen.r * 2, height: sphereScreen.r * 2, duration: 0.55, ease: EASE.inOut }, 1.55)
      tl.fromTo(pieces.tri, { opacity: 0, scale: 0.86, x: -40 * S, filter: 'blur(10px)' }, { opacity: 1, scale: 1, x: 0, filter: 'blur(0px)', duration: 0.7, ease: EASE.settle }, 1.65)
      tl.fromTo(pieces.slab, { opacity: 0, scale: 0.86, x: 40 * S, filter: 'blur(10px)' }, { opacity: 1, scale: 1, x: 0, filter: 'blur(0px)', duration: 0.7, ease: EASE.settle }, 1.78)
      tl.to(pieces.sphere, { opacity: 1, duration: 0.25, ease: 'none' }, 2.05)
      tl.to(core, { opacity: 0, duration: 0.25, ease: 'none' }, 2.1)
      tl.to(shadow, { opacity: 1, duration: 0.6 }, 1.9)
      tl.to(rings, { strokeDashoffset: 1, duration: 0.5, ease: EASE.inOut, stagger: 0.06 }, 2.05)
      tl.to(sats, { opacity: 0, scale: 0, duration: 0.35, stagger: 0.04 }, 2.05)
      tl.to(axis, { opacity: 0, scaleY: 0, duration: 0.3 }, 2.1)
      tl.to(orbit, { opacity: 0, duration: 0.3 }, 2.25)
      tl.fromTo(word, { opacity: 0, y: wordStart.y + 14 }, { opacity: 1, y: wordStart.y, duration: 0.5, ease: EASE.settle }, 2.05)

      // ---- 2300–3500 ms  Logo travel: CENTRE → UPPER-LEFT, scaling down, smooth ease-out
      tl.to(shadow, { opacity: 0, duration: 0.3 }, 2.3)
      tl.to(mark, { x: 0, y: 0, scale: 1, duration: 1.2, ease: EASE.cine }, 2.3)
      tl.to(word, { x: 0, y: 0, scale: 1, duration: 1.2, ease: EASE.cine }, 2.3)

      // ---- 3500–4000 ms  Header lock: the header takes over the same asset
      tl.call(() => onLock(), [], 3.5)
      // ---- 4000–5000 ms  Homepage handoff
      tl.call(() => onHandoff(), [], 4.0)
      tl.to(el, { opacity: 0, duration: 0.8, ease: EASE.soft }, 4.0)
      tl.call(() => onDone(), [], 4.85)
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced])

  if (reduced) return null

  return (
    <div ref={root} className={styles.intro} aria-hidden="true">
      <div className={styles.scene} data-scene>
        {/* black matte elements with their lines (frame 01) */}
        {[
          { x: -0.34, y: -0.1, size: 62, angle: -150, len: 260 },
          { x: -0.14, y: -0.29, size: 30, angle: -35, len: 210 },
          { x: 0.3, y: -0.24, size: 46, angle: 25, len: 200 },
          { x: -0.2, y: 0.22, size: 34, angle: 150, len: 220 },
        ].map((e, i) => (
          <div
            key={i}
            className={styles.element}
            data-element
            style={{ left: `${e.x * 100}vw`, top: `${e.y * 100}vh` }}
          >
            <span className={styles.line} data-line style={{ width: e.len, transform: `rotate(${e.angle}deg)` }} />
            <span className={styles.ballShadow} data-ball-shadow style={{ width: e.size * 1.6, height: e.size * 0.5, top: e.size * 0.72 }} />
            <span className={styles.ball} data-ball style={{ width: e.size, height: e.size }} />
          </div>
        ))}

        {/* orbital system (frames 02–04) */}
        <div className={styles.orbit} data-orbit>
          <svg viewBox="-200 -200 400 400" width="100%" height="100%" aria-hidden="true">
            <defs>
              <radialGradient id="intro-sat" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#fff" />
                <stop offset="40%" stopColor="#bdbdbd" />
                <stop offset="100%" stopColor="#3a3a3a" />
              </radialGradient>
            </defs>
            <g transform="scale(1 0.34)">
              <ellipse data-ring rx="150" ry="150" pathLength={1} />
              <ellipse data-ring rx="118" ry="118" pathLength={1} transform="rotate(20)" />
              <ellipse data-ring rx="184" ry="184" pathLength={1} transform="rotate(-14)" />
            </g>
            <line data-axis x1="0" y1="-170" x2="0" y2="170" />
            <circle data-sat cx="-150" cy="0" r="7" fill="url(#intro-sat)" />
            <circle data-sat cx="118" cy="14" r="5" fill="url(#intro-sat)" />
            <circle data-sat cx="40" cy="-58" r="6" fill="url(#intro-sat)" />
            <circle data-sat cx="-80" cy="52" r="4.5" fill="url(#intro-sat)" />
            <circle data-sat cx="0" cy="-170" r="6" fill="url(#intro-sat)" />
            <circle data-sat cx="0" cy="170" r="6" fill="url(#intro-sat)" />
          </svg>
        </div>
        <span className={styles.core} data-core />
      </div>
      <span className={styles.shadow} data-shadow>
        <img src={asset('/assets/logo/mark-shadow.png')} alt="" width={670} height={100} draggable={false} />
      </span>
      <div className={styles.lockupWrap} data-placed={placed ? 'true' : 'false'}>
        <LogoLockup ref={lockup} markHeight={isMobile ? 38 : 52} tone="ink" />
      </div>
    </div>
  )
}

export { MARK_RATIO }
