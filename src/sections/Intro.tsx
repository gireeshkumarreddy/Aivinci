import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LogoLockup, LOCKUP_RATIO } from '../components/layout/LogoLockup'
import { EASE, gsap, useMedia, useReducedMotion } from '../lib/motion'
import styles from './Intro.module.css'

interface Props {
  /** fired at 3500 ms — the logo has locked into the header */
  onLock: () => void
  /** fired at 4000 ms — the homepage may begin */
  onHandoff: () => void
  /** fired when the overlay is gone (5000 ms) */
  onDone: () => void
}

/**
 * 00 / OPENING LOGO ANIMATION — 5-second brand reveal.
 * White canvas → elements awaken → they connect into an orbital system → the logo resolves out
 * of that light → the lockup travels CENTRE → UPPER-LEFT and locks into the header. The logo is
 * the studio's artwork, whole: nothing is assembled from pieces.
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
      const headerLockup = document.querySelector<HTMLElement>('[data-header-brand] [data-lockup]')
      if (!headerLockup) return

      // 1. seat the intro lockup exactly where the header lockup lives
      const hr = headerLockup.getBoundingClientRect()
      gsap.set(lk, { position: 'fixed', left: hr.left, top: hr.top, width: hr.width, height: hr.height, margin: 0 })
      setPlaced(true)
      await new Promise((r) => requestAnimationFrame(r))
      if (cancelled) return

      const art = lk.querySelector<HTMLElement>('img')!
      const vw = window.innerWidth
      const vh = window.innerHeight
      // centre composition: the logo at poster scale, optically centred
      const S = Math.min(isMobile ? 3.2 : 4.6, (vw * (isMobile ? 0.88 : 0.66)) / hr.width)
      const cx = vw / 2
      const cy = vh * (isMobile ? 0.46 : 0.47)
      const start = {
        x: cx - (S * hr.width) / 2 - hr.left,
        y: cy - (S * hr.height) / 2 - hr.top,
        scale: S,
      }
      gsap.set(lk, { transformOrigin: '0 0', ...start, opacity: 0 })

      const scene = el.querySelector<HTMLElement>('[data-scene]')!
      const core = el.querySelector<HTMLElement>('[data-core]')!
      const orbit = el.querySelector<HTMLElement>('[data-orbit]')!
      const rings = Array.from(el.querySelectorAll<SVGEllipseElement>('[data-ring]'))
      const sats = Array.from(el.querySelectorAll<SVGCircleElement>('[data-sat]'))
      const axis = el.querySelector<SVGLineElement>('[data-axis]')!
      const elements = Array.from(el.querySelectorAll<HTMLElement>('[data-element]'))
      const coreSize = Math.max(S * hr.height * 0.42, 56)
      gsap.set(scene, { x: cx, y: cy })
      gsap.set(core, { width: coreSize, height: coreSize, xPercent: -50, yPercent: -50, opacity: 0, scale: 0.3, filter: 'blur(14px)' })
      gsap.set(orbit, { opacity: 0 })
      gsap.set(rings, { strokeDasharray: 1, strokeDashoffset: 1 })
      gsap.set(sats, { opacity: 0, scale: 0, transformOrigin: '50% 50%' })
      gsap.set(axis, { scaleY: 0, transformOrigin: '50% 50%', opacity: 0 })

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
      tl.to(elements, { x: (i) => [-22, 18, -14, 20][i % 4], y: (i) => [10, 14, -12, -8][i % 4], duration: 0.7, ease: EASE.inOut, stagger: 0.04 }, 0.8)

      // ---- 700–1800 ms  Central form: a metallic core assembles from depth
      tl.to(core, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.9, ease: EASE.settle }, 0.7)
      tl.to(orbit, { opacity: 1, duration: 0.4 }, 0.9)
      tl.to(rings, { strokeDashoffset: 0, duration: 0.8, ease: EASE.inOut, stagger: 0.12 }, 0.95)
      tl.to(axis, { scaleY: 1, opacity: 1, duration: 0.5 }, 1.2)
      tl.to(sats, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.08, ease: EASE.settle }, 1.15)
      tl.to(orbit, { rotation: 38, duration: 1.7, ease: EASE.inOut }, 0.9)

      // ---- 1500–2500 ms  Logo resolve: the artwork forms out of that light, whole
      tl.to(elements, { opacity: 0, scale: 0.6, duration: 0.45, ease: EASE.soft, stagger: 0.04 }, 1.5)
      tl.to(core, { scale: 2.6, opacity: 0, filter: 'blur(26px)', duration: 0.8, ease: EASE.settle }, 1.6)
      tl.fromTo(
        lk,
        { opacity: 0, scale: S * 0.86, filter: 'blur(16px) brightness(1.5)' },
        { opacity: 1, scale: S, filter: 'blur(0px) brightness(1)', duration: 0.8, ease: EASE.settle },
        1.6,
      )
      tl.fromTo(art, { y: 18 }, { y: 0, duration: 0.8, ease: EASE.settle }, 1.6)
      tl.to(rings, { strokeDashoffset: 1, duration: 0.5, ease: EASE.inOut, stagger: 0.06 }, 2.05)
      tl.to(sats, { opacity: 0, scale: 0, duration: 0.35, stagger: 0.04 }, 2.05)
      tl.to(axis, { opacity: 0, scaleY: 0, duration: 0.3 }, 2.1)
      tl.to(orbit, { opacity: 0, duration: 0.3 }, 2.25)

      // ---- 2400–2750 ms  the brand holds at poster scale, then
      // ---- 2750–3500 ms  Logo travel: CENTRE → UPPER-LEFT, scaling down, smooth ease-out
      tl.to(lk, { x: 0, y: 0, scale: 1, duration: 0.75, ease: EASE.cine }, 2.75)

      // ---- 3500–4000 ms  Header lock: the header takes over the same artwork
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
      <div className={styles.lockupWrap} data-placed={placed ? 'true' : 'false'}>
        <LogoLockup ref={lockup} height={isMobile ? 44 : 58} tone="ink" eager />
      </div>
    </div>
  )
}

export { LOCKUP_RATIO }
