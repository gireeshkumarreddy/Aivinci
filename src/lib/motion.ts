/**
 * Motion system — every section timeline is authored from the document's
 * millisecond tables. Helpers here turn "350–1050 ms, BOTTOM → TOP" into a
 * GSAP tween positioned on an absolute timeline.
 */
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

gsap.registerPlugin(ScrollTrigger)
gsap.defaults({ overwrite: 'auto' })
// Choreographies are authored in real milliseconds and must settle on time everywhere: when a
// frame is late (a busy device, a throttled embedded browser), the clock still advances by the
// real elapsed time instead of GSAP's default 33 ms "lag smoothing" step, which would stretch a
// two-second reveal into a crawl and leave sections looking stuck mid-entrance.
gsap.ticker.lagSmoothing(0)

export { gsap, ScrollTrigger }

export const EASE = {
  out: 'power3.out',
  cine: 'expo.out',
  soft: 'power2.out',
  inOut: 'power2.inOut',
  settle: 'power4.out',
} as const

export type Direction = 'left' | 'right' | 'top' | 'bottom' | 'depth' | 'fade' | 'none'

/** Start state for a directional entrance. Amplitudes are deliberately low — cinematic, not bouncy. */
export function fromDir(dir: Direction, amount = 1): gsap.TweenVars {
  switch (dir) {
    case 'left':
      return { x: -56 * amount, opacity: 0 }
    case 'right':
      return { x: 56 * amount, opacity: 0 }
    case 'top':
      return { y: -44 * amount, opacity: 0 }
    case 'bottom':
      return { y: 52 * amount, opacity: 0 }
    case 'depth':
      return { scale: 1 - 0.08 * amount, opacity: 0, filter: 'blur(10px)', transformPerspective: 1200 }
    case 'fade':
      return { opacity: 0 }
    default:
      return {}
  }
}

export function toDir(dir: Direction): gsap.TweenVars {
  switch (dir) {
    case 'left':
    case 'right':
      return { x: 0, opacity: 1 }
    case 'top':
    case 'bottom':
      return { y: 0, opacity: 1 }
    case 'depth':
      return { scale: 1, opacity: 1, filter: 'blur(0px)' }
    case 'fade':
      return { opacity: 1 }
    default:
      return {}
  }
}

export interface Beat {
  /** [start, end] in milliseconds, exactly as written in the document tables */
  at: [number, number]
  dir?: Direction
  amount?: number
  ease?: string
  from?: gsap.TweenVars
  to?: gsap.TweenVars
  stagger?: number | gsap.StaggerVars
}

/** Place a beat on an absolute timeline. */
export function beat(tl: gsap.core.Timeline, target: gsap.TweenTarget, b: Beat) {
  const [s, e] = b.at
  const dir = b.dir ?? 'fade'
  const from = { ...fromDir(dir, b.amount ?? 1), ...(b.from ?? {}) }
  const to = { ...toDir(dir), ...(b.to ?? {}), duration: Math.max(e - s, 16) / 1000, ease: b.ease ?? EASE.cine }
  if (b.stagger !== undefined) (to as gsap.TweenVars).stagger = b.stagger
  tl.fromTo(target, from, to, s / 1000)
  return tl
}

/** QA affordance: `?settled` renders every choreography at its final, settled state. */
export const settledMode = () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('settled')

/** Returns true when motion should be skipped (user preference, or the settled QA mode). Reactive. */
export function useReducedMotion() {
  const [reduced, set] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches || settledMode() : false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fn = () => set(mq.matches || settledMode())
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return reduced
}

export function useMedia(query: string, initial = false) {
  const [m, set] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : initial))
  useEffect(() => {
    const mq = window.matchMedia(query)
    const fn = () => set(mq.matches)
    fn()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [query])
  return m
}

export const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches

export interface SectionRevealOptions {
  /** ScrollTrigger start (default: when the section's top passes 72% of the viewport) */
  start?: string
  /** play once (default) or reverse when scrolled away */
  once?: boolean
  /** Do not build until this becomes true (e.g. wait for the intro). */
  enabled?: boolean
  /** Dependencies that should rebuild the timeline */
  deps?: unknown[]
}

/**
 * Build a section timeline from the document's table and play it when the
 * section enters the viewport. Honors prefers-reduced-motion by jumping
 * straight to the settled state (content + hierarchy preserved, no motion).
 */
export function useSectionReveal(
  ref: RefObject<HTMLElement | null>,
  build: (tl: gsap.core.Timeline, root: HTMLElement) => void,
  opts: SectionRevealOptions = {},
) {
  const reduced = useReducedMotion()
  const enabled = opts.enabled ?? true
  const buildRef = useRef(build)
  useEffect(() => {
    buildRef.current = build
  })

  useLayoutEffect(() => {
    const root = ref.current
    if (!root || !enabled) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.cine } })
      buildRef.current(tl, root)
      if (reduced) {
        tl.progress(1)
        root.setAttribute('data-revealed', 'true')
        return
      }
      // `data-revealed` lands only once the choreography has settled, so CSS hover
      // transitions never fight the entrance tweens
      tl.eventCallback('onComplete', () => root.setAttribute('data-revealed', 'true'))
      ScrollTrigger.create({
        trigger: root,
        start: opts.start ?? 'top 72%',
        once: opts.once ?? true,
        onEnter: () => {
          root.setAttribute('data-revealing', 'true')
          tl.play()
        },
      })
    }, root)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, reduced, enabled, ...(opts.deps ?? [])])
}

/**
 * Low-amplitude pointer tilt/parallax for desktop only. Touch devices get
 * nothing (the document forbids continuous pointer effects there).
 */
export function usePointerTilt(
  ref: RefObject<HTMLElement | null>,
  opts: { maxTilt?: number; maxShift?: number; perspective?: number; layers?: string; enabled?: boolean } = {},
) {
  const reduced = useReducedMotion()
  useEffect(() => {
    const el = ref.current
    if (!el || reduced || isTouchDevice() || opts.enabled === false) return
    const maxTilt = opts.maxTilt ?? 3
    const maxShift = opts.maxShift ?? 10
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.9, ease: 'power3.out' })
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.9, ease: 'power3.out' })
    gsap.set(el, { transformPerspective: opts.perspective ?? 1400, transformStyle: 'preserve-3d' })
    const layers = opts.layers ? Array.from(el.querySelectorAll<HTMLElement>(opts.layers)) : []
    const layerTo = layers.map((l) => {
      const depth = parseFloat(l.dataset.depth ?? '0.5')
      return {
        depth,
        x: gsap.quickTo(l, 'x', { duration: 1, ease: 'power3.out' }),
        y: gsap.quickTo(l, 'y', { duration: 1, ease: 'power3.out' }),
      }
    })
    let raf = 0
    let nx = 0
    let ny = 0
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      nx = ((e.clientX - r.left) / r.width - 0.5) * 2
      ny = ((e.clientY - r.top) / r.height - 0.5) * 2
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0
          ry(nx * maxTilt)
          rx(-ny * maxTilt)
          layerTo.forEach((l) => {
            l.x(nx * maxShift * l.depth)
            l.y(ny * maxShift * l.depth)
          })
        })
    }
    const onLeave = () => {
      ry(0)
      rx(0)
      layerTo.forEach((l) => {
        l.x(0)
        l.y(0)
      })
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref, reduced, opts.maxTilt, opts.maxShift, opts.perspective, opts.layers, opts.enabled])
}

/** Scroll-linked progress (0..1) of an element through the viewport, throttled to rAF. */
export function useScrollProgress(ref: RefObject<HTMLElement | null>, onProgress: (p: number) => void) {
  const cb = useRef(onProgress)
  useEffect(() => {
    cb.current = onProgress
  })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => cb.current(self.progress),
    })
    return () => st.kill()
  }, [ref])
}

/** Smoothly scroll to an in-page chapter (chapters compose their own top spacing under the fixed header). */
export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY
  window.scrollTo({ top, behavior: 'smooth' })
}
