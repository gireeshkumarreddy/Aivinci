import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, IconButton } from '../components/ui/Button'
import { Labels, ScrollCue, SectionLabel } from '../components/ui/Editorial'
import { ArrowLeft, ArrowRight, ArrowUpRight, Close } from '../components/ui/Icons'
import { MediaSlot } from '../components/ui/MediaSlot'
import { cta, work as c, type WorkItem } from '../data/content'
import { EASE, beat, gsap, scrollToId, useReducedMotion, useScrollProgress, useSectionReveal } from '../lib/motion'
import styles from './Work.module.css'
import { asset } from '../lib/assets'

/** Case-study panel: opens smoothly, no layout shift, honest about pending production video. */
function CaseStudy({ item, onClose, onStep }: { item: WorkItem | null; onClose: () => void; onStep: (d: 1 | -1) => void }) {
  const open = !!item
  useEffect(() => {
    document.body.classList.toggle('is-locked', open)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onStep(1)
      if (e.key === 'ArrowLeft') onStep(-1)
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('is-locked')
    }
  }, [open, onClose, onStep])
  return (
    <div className={styles.panel} aria-hidden={!open} inert={!open} role="dialog" aria-modal="true" aria-label={item ? `${item.title} — case study` : 'Case study'}>
      <button type="button" className={styles.panelBackdrop} aria-label="Close case study" onClick={onClose} />
      <div className={styles.panelInner}>
        <header className={styles.panelHead}>
          <SectionLabel>{c.label}</SectionLabel>
          <span className={`${styles.panelCount} t-mono`}>
            {item?.n} / 0{c.items.length}
          </span>
          <IconButton tone="outline" size={44} aria-label="Close" onClick={onClose} className={styles.panelClose}>
            <Close size={18} />
          </IconButton>
        </header>
        {item && (
          <div className={styles.panelBody} key={item.n}>
            <div className={styles.panelMedia}>
              <MediaSlot poster={asset(`/assets/work/tile-${item.n}.jpg`)} aspect="16 / 9" radius={6} alt={`${item.title} — ${item.category}`} />
            </div>
            <div className={styles.panelText}>
              <p className={`${styles.panelCat} t-mono`}>{item.category}</p>
              <h3 className={`${styles.panelTitle} t-headline`}>{item.title}</h3>
              <p className={styles.panelDesc}>{c.description}</p>
              <div className={styles.panelNav}>
                <IconButton tone="outline" size={44} aria-label="Previous project" onClick={() => onStep(-1)}>
                  <ArrowLeft size={16} />
                </IconButton>
                <IconButton tone="outline" size={44} aria-label="Next project" onClick={() => onStep(1)}>
                  <ArrowRight size={16} />
                </IconButton>
                <Button variant="inverse" icon={<ArrowRight size={15} />} onClick={() => { onClose(); scrollToId('contact') }}>
                  {cta.startProject}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const N = c.items.length
/** the set is repeated so the loop is always wider than two viewports */
const COPIES = 4
/** one card passes every ~6.5 s — a slow, continuous drift */
const SECONDS_PER_CARD = 6.5

/** 06 / OUR WORK — Ideas, brought to life. A video rail that flows right → left in a seamless 3D loop. */
export function Work() {
  const root = useRef<HTMLElement>(null)
  const rail = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState<number | null>(null)
  const openRef = useRef(false)
  const reduced = useReducedMotion()
  // imperative marquee control (filled by the loop effect below)
  const seatRef = useRef<(i: number) => void>(() => {})
  useEffect(() => {
    openRef.current = open !== null
  }, [open])

  useSectionReveal(root, (tl, el) => {
    const q = (s: string) => el.querySelectorAll(s)
    // the rail holds the card set twice (seamless loop): both copies enter in step
    const inStep = (gap: number) => (i: number) => (i % N) * gap
    // Work frame 0–350: structural resolve, editorial geometry preserved
    beat(tl, q('[data-wk="env"]'), { at: [0, 350], dir: 'fade', ease: EASE.soft })
    beat(tl, q('[data-wk="frame"]'), { at: [100, 600], dir: 'fade', stagger: 0.05, ease: EASE.soft })
    beat(tl, q('[data-wk="head"]'), { at: [150, 700], dir: 'left', amount: 0.5, stagger: 0.06 })
    // Video card chain 350–1200: RIGHT → LEFT in 3D — each card sweeps in from the right, turning
    // from an angled depth pose into its seat on the rail; the rail then keeps flowing
    tl.fromTo(q('[data-wk="tile"]'), { '--enter': 1, opacity: 0 }, { '--enter': 0, opacity: 1, duration: 0.85, ease: EASE.cine, stagger: inStep(0.09) }, 0.35)
    // Image/video content 500–1300: TOP → BOTTOM reveal inside a stable media mask
    tl.fromTo(q('[data-wk="media"]'), { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.55, ease: EASE.cine, stagger: inStep(0.09) }, 0.5)
    // Open markers + numbers: RIGHT → LEFT in 3D, trailing their cards
    tl.fromTo(q('[data-wk="tile"] [data-wk-open]'), { x: 44, rotationY: -70, opacity: 0, transformPerspective: 600 }, { x: 0, rotationY: 0, opacity: 1, duration: 0.6, ease: EASE.cine, stagger: inStep(0.09) }, 0.62)
    tl.fromTo(q('[data-wk="tile"] [data-wk-num]'), { x: 22, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: EASE.cine, stagger: inStep(0.09) }, 0.7)
    beat(tl, q('[data-wk="foot"]'), { at: [900, 1400], dir: 'bottom', amount: 0.35, stagger: 0.06 })
  })

  // ---- the loop: a constant right → left drift, posed in 3D every frame ----------------
  // The card set is rendered twice; the track travels the width of one set and wraps, so the
  // flow never stops or jumps. Hover / press / keyboard focus ease it to a hold so a card can
  // be opened, and it resumes as smoothly as it paused.
  useEffect(() => {
    const el = rail.current
    const tr = track.current
    if (!el || !tr) return
    const tiles = Array.from(tr.querySelectorAll<HTMLElement>('[data-wk="tile"]'))
    if (tiles.length < 2 * N) return
    const setX = gsap.quickSetter(tr, 'x', 'px')
    // card geometry in track space (measured once per layout, never per frame)
    const mid: number[] = []
    let origin = 0 // the untransformed track's left edge, relative to the rail
    let setW = 1
    let centre = 0
    let x = 0 // distance travelled (px); the track sits at -x
    let speed = 0 // px/s, eased toward its target
    let base = 30
    let hold = 0 // hold reasons (hover, press, focus)
    let visible = false
    let lastActive = -1
    let dragging = false
    let dragId = -1
    let dragStartX = 0
    let dragStartPos = 0

    const measure = () => {
      // rects include the current translation (-x) and the tiles' own 3D poses do not move
      // their boxes, so subtracting the track's rect gives stable, untransformed positions
      const railRect = el.getBoundingClientRect()
      const trackRect = tr.getBoundingClientRect()
      const tx = Number(gsap.getProperty(tr, 'x')) || 0 // whatever translation the track carries right now
      origin = trackRect.left - railRect.left - tx
      tiles.forEach((t, i) => {
        const r = t.getBoundingClientRect()
        mid[i] = r.left - trackRect.left + r.width / 2
      })
      setW = Math.max(1, mid[N] - mid[0])
      centre = railRect.width / 2
      base = tiles[0].getBoundingClientRect().width / SECONDS_PER_CARD
    }
    const wrap = () => {
      x = ((x % setW) + setW) % setW
    }
    /** pose every card against the viewport centre: flat in the middle, turned and deeper at the edges */
    const render = () => {
      let best = 0
      let bestD = Infinity
      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i]
        const off = origin + mid[i] - x - centre
        const d = Math.abs(off)
        if (d < bestD) {
          bestD = d
          best = i
        }
        if (d > centre * 1.6) continue // far outside the viewport: leave the pose alone
        const n = Math.max(-1, Math.min(1, off / centre))
        t.style.setProperty('--ry', `${(-n * 26).toFixed(2)}deg`)
        t.style.setProperty('--tz', `${(-Math.abs(n) * 180).toFixed(1)}px`)
      }
      setX(-x)
      const idx = best % N
      if (idx !== lastActive) {
        lastActive = idx
        setActive(idx)
      }
    }
    /** shortest signed distance (px) that brings card `i` (either copy) to the centre */
    const distanceTo = (i: number) => {
      let bestOff = 0
      let bestD = Infinity
      for (const k of [i, i + N]) {
        const off = origin + mid[k] - x - centre
        for (const o of [off, off - setW, off + setW]) {
          if (Math.abs(o) < bestD) {
            bestD = Math.abs(o)
            bestOff = o
          }
        }
      }
      return bestOff
    }
    const seat = (i: number, animate = true) => {
      const delta = distanceTo(i)
      if (!animate || reduced) {
        x += delta
        wrap()
        render()
        return
      }
      const p = { v: 0 }
      let last = 0
      gsap.to(p, {
        v: delta,
        duration: 0.8,
        ease: EASE.cine,
        onUpdate: () => {
          x += p.v - last
          last = p.v
          wrap()
        },
      })
    }
    seatRef.current = (i) => seat(i)

    const tick = (_t: number, dtMs: number) => {
      if (!visible) return
      // real elapsed time, so the rail keeps its pace even when frames come late (a busy
      // device, a throttled embedded browser); capped so a tab returning from the
      // background moves at most one second's worth
      const dt = Math.min(dtMs, 1000) / 1000
      const target = reduced || hold > 0 || dragging || openRef.current ? 0 : base
      speed += (target - speed) * Math.min(1, dt * 5)
      x += speed * dt
      wrap()
      render()
    }

    // ---- hold / release ----
    const holdOn = () => {
      hold++
    }
    const holdOff = () => {
      hold = Math.max(0, hold - 1)
    }
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') holdOn()
    }
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') holdOff()
    }
    const onFocusIn = (e: FocusEvent) => {
      holdOn()
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-wk="tile"]')
      if (t) seat(Number(t.dataset.index)) // bring the focused card into view
    }
    const onFocusOut = () => holdOff()

    // ---- drag (mouse + touch; vertical touch pans still scroll the page) ----
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      dragId = e.pointerId
      dragStartX = e.clientX
      dragStartPos = x
      if (e.pointerType !== 'mouse') holdOn() // a finger on the rail holds it in place
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== dragId) return
      const dx = e.clientX - dragStartX
      if (!dragging && Math.abs(dx) > 5) {
        // a real drag: only now take the pointer, so plain clicks on cards keep working
        dragging = true
        el.setPointerCapture(dragId)
        el.classList.add(styles.dragging)
      }
      if (dragging) {
        x = dragStartPos - dx
        wrap()
        render()
      }
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== dragId) return
      dragId = -1
      if (e.pointerType !== 'mouse') holdOff()
      if (dragging) {
        el.classList.remove(styles.dragging)
        try {
          el.releasePointerCapture(e.pointerId)
        } catch {
          /* noop */
        }
        el.setAttribute('data-just-dragged', '1')
        window.setTimeout(() => el.removeAttribute('data-just-dragged'), 80)
      }
      dragging = false
    }

    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting
    })
    io.observe(el)
    const onResize = () => {
      measure()
      wrap()
      render()
    }
    measure()
    // open on the featured film, as the reference composition does
    seat(c.featuredIndex, false)
    render()
    gsap.ticker.add(tick)
    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('focusin', onFocusIn)
    el.addEventListener('focusout', onFocusOut)
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    window.addEventListener('resize', onResize)
    return () => {
      gsap.ticker.remove(tick)
      io.disconnect()
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('focusin', onFocusIn)
      el.removeEventListener('focusout', onFocusOut)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      window.removeEventListener('resize', onResize)
    }
  }, [reduced])

  // the environment sits deeper than the rail: it drifts slower than the page (section depth)
  useScrollProgress(root, (p) => {
    const env = root.current?.querySelector<HTMLElement>('[data-wk="env"]')
    if (env && !reduced) env.style.setProperty('--py', `${((p - 0.5) * -48).toFixed(1)}px`)
  })

  const seatTile = useCallback((i: number) => seatRef.current(((i % N) + N) % N), [])

  const openItem = (i: number) => {
    if (rail.current?.getAttribute('data-just-dragged')) return
    setOpen(i)
  }
  const step = useCallback((d: 1 | -1) => setOpen((o) => (o === null ? null : (o + d + c.items.length) % c.items.length)), [])
  const close = useCallback(() => setOpen(null), [])

  return (
    <section ref={root} id="work" className={styles.section} data-section data-theme="dark" data-nav="work" aria-labelledby="work-heading">
      <div className={styles.env} data-wk="env" aria-hidden="true">
        <picture>
          <source media="(max-width: 767px)" srcSet={asset('/assets/work/environment-sm.jpg')} />
          <img src={asset('/assets/work/environment.jpg')} width={1672} height={941} alt="" loading="lazy" decoding="async" draggable={false} />
        </picture>
        <span className={styles.envShade} />
      </div>

      <div className={styles.stage}>
        <div className={styles.headBlock}>
          <SectionLabel className={styles.label} data-wk="head">
            {c.label}
          </SectionLabel>
          <h2 id="work-heading" className={`${styles.heading} t-headline`} data-wk="head">
            <span>{c.heading[0]}</span>
            <span>{c.heading[1]}</span>
          </h2>
          <p className={`${styles.by} t-mono`} data-wk="head">
            {c.by}
          </p>
        </div>

        <div className={styles.rightLabels} data-wk="frame">
          <Labels lines={c.labels} mono rule={false} />
        </div>
        <p className={`${styles.categories} t-mono`} data-wk="frame">
          {c.categories.map((k, i) => (
            <span key={k}>
              {i > 0 && <span className={styles.slash}>/</span>}
              {k}
            </span>
          ))}
        </p>

        {/* ---- video rail: the card set twice, flowing right → left ---- */}
        <div ref={rail} className={styles.rail} role="region" aria-label="Selected work — a continuously moving rail">
          <div ref={track} className={styles.railTrack}>
            {Array.from({ length: COPIES }, (_, copy) => copy).map((copy) => (
              <div key={copy} className={styles.railSet} role={copy ? undefined : 'list'} aria-hidden={copy ? true : undefined} inert={copy ? true : undefined}>
                {c.items.map((it, i) => (
                  <article
                    key={it.n}
                    className={[styles.tile, i === c.featuredIndex ? styles.featured : ''].filter(Boolean).join(' ')}
                    data-wk="tile"
                    data-index={i}
                    data-copy={copy}
                    role={copy ? undefined : 'listitem'}
                    aria-current={!copy && active === i ? 'true' : undefined}
                  >
                    <div className={styles.tile3d}>
                      <div className={styles.tileBody}>
                        <div className={styles.tileMedia} data-wk="media">
                          <MediaSlot poster={asset(`/assets/work/tile-${it.n}.jpg`)} aspect={i === c.featuredIndex ? '222 / 285' : '240 / 188'} radius={3} alt={`${it.title} — ${it.category}`} focus="50% 40%" />
                          <button type="button" className={styles.tileHit} onClick={() => openItem(i)} aria-label={`Open ${it.title} — ${it.category}`} tabIndex={copy ? -1 : 0} />
                          <span className={styles.tileOpen} data-wk-open aria-hidden="true">
                            <ArrowUpRight size={14} />
                          </span>
                        </div>
                        <span className={`${styles.tileNum} t-mono`} data-wk-num>{it.n}</span>
                        <span className={styles.tileMeta}>
                          <span className={styles.tileTitle}>{it.title}</span>
                          <span className={`${styles.tileCat} t-mono-sm`}>{it.category}</span>
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ---- footer row --------------------------------------------- */}
        <div className={styles.ideas} data-wk="foot">
          <Labels lines={c.ideasIntoImpact} mono />
        </div>
        <p className={styles.real} data-wk="foot">
          {c.realPeople.map((l) => (
            <span key={l}>{l}</span>
          ))}
          <span className={`rule ${styles.realRule}`} aria-hidden="true" />
        </p>
        <div className={styles.cue} data-wk="foot">
          <ScrollCue tone="light" onClick={() => scrollToId('ai-video-story')} />
        </div>
        <div className={styles.progress} data-wk="foot">
          <span className="t-mono">{c.items[active]?.n}</span>
          <span className={styles.track} aria-hidden="true">
            <span className={styles.thumb} style={{ left: `${(active / (c.items.length - 1)) * 100}%` }} />
          </span>
          <span className="t-mono">0{c.items.length}</span>
          <span className={styles.arrows}>
            <IconButton tone="outline" size={36} aria-label="Previous" onClick={() => seatTile(active - 1)}>
              <ArrowLeft size={14} />
            </IconButton>
            <IconButton tone="outline" size={36} aria-label="Next" onClick={() => seatTile(active + 1)}>
              <ArrowRight size={14} />
            </IconButton>
          </span>
          <Button variant="text" size="sm" icon={<ArrowRight size={14} />} className={styles.viewAll} onClick={() => seatTile(0)}>
            {cta.viewAllWork}
          </Button>
        </div>
      </div>

      <CaseStudy item={open === null ? null : c.items[open]} onClose={close} onStep={step} />
    </section>
  )
}
