import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Labels, SectionLabel } from '../components/ui/Editorial'
import { Rings } from '../components/ui/Icons'
import { brand, productSystem as c } from '../data/content'
import { EASE, beat, gsap, isTouchDevice, scrollToId, usePointerTilt, useReducedMotion, useSectionReveal } from '../lib/motion'
import styles from './ProductSystem.module.css'
import { asset } from '../lib/assets'

type Tone = 'blue' | 'violet' | 'white' | 'lime'
const TONE_HEX: Record<Tone, string> = { blue: '#0404e9', violet: '#afa1ea', white: '#f4f4f4', lime: '#c0bf34' }

/** A physical glass panel: front face, four edge faces (thickness), highlight and contact shadow. */
function GlassCard({
  tone,
  n,
  name,
  selected,
  onSelect,
  className,
}: {
  tone: Tone
  n: string
  name: string
  selected: boolean
  onSelect: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      className={[styles.card, styles[`tone-${tone}`], selected ? styles.selected : '', className].filter(Boolean).join(' ')}
      data-ps="card"
      data-card
      aria-pressed={selected}
      onClick={onSelect}
      style={{ '--tone': TONE_HEX[tone] } as CSSProperties}
    >
      <span className={styles.face}>
        <span className={styles.sheen} aria-hidden="true" />
        <span className={styles.cardInner} data-ps="content">
          <span className={`${styles.cardNum} t-mono`}>{n}</span>
          <span className={styles.cardTick} aria-hidden="true" />
          <span className={styles.cardName}>{name}</span>
          <span className={`${styles.cardMeta} t-mono-sm`}>
            {c.product} · {c.productCategory}
          </span>
        </span>
      </span>
      {/* thickness */}
      <span className={`${styles.edge} ${styles.edgeTop}`} aria-hidden="true" />
      <span className={`${styles.edge} ${styles.edgeBottom}`} aria-hidden="true" />
      <span className={`${styles.edge} ${styles.edgeLeft}`} aria-hidden="true" />
      <span className={`${styles.edge} ${styles.edgeRight}`} aria-hidden="true" />
      <span className={styles.contact} aria-hidden="true" />
    </button>
  )
}

/** 09 / PRODUCT SYSTEM — modular 3D cards + glass; the central object answers card selection. */
export function ProductSystem() {
  const root = useRef<HTMLElement>(null)
  const object = useRef<HTMLDivElement>(null)
  const grid = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<number>(-1)
  const reduced = useReducedMotion()
  // low-amplitude parallax/tilt on desktop: the glass edges catch light as the pointer moves
  usePointerTilt(grid, { maxTilt: 1.6, maxShift: 0, perspective: 2400 })

  useSectionReveal(
    root,
    (tl, el) => {
      const q = (s: string) => el.querySelectorAll(s)
      // Grid / frame 0–350: structural grid establishes, no layout shift
      beat(tl, q('[data-ps="cell"]'), { at: [0, 350], dir: 'fade', stagger: 0.02, ease: EASE.soft })
      beat(tl, q('[data-ps="title"]'), { at: [200, 800], dir: 'depth', amount: 0.4, stagger: 0.07, ease: EASE.settle })
      // Cards 300–1100: every card rises BOTTOM → TOP into its final position (blue, violet,
      // white, lime — one after the other, fast, smooth, no bounce)
      beat(tl, q('[data-ps="card"]'), { at: [300, 1000], dir: 'bottom', amount: 1.6, stagger: 0.1, ease: EASE.cine })
      // Central 3D object 600–1250: DEPTH → FOREGROUND, physical material and lighting
      beat(tl, q('[data-ps="object"]'), { at: [600, 1250], dir: 'depth', amount: 1.6, from: { y: 30 }, to: { y: 0 }, ease: EASE.settle })
      beat(tl, q('[data-ps="object-shadow"]'), { at: [900, 1350], dir: 'fade', ease: EASE.soft })
      // Internal card content 800–1350: depth → final plane, after the frames
      beat(tl, q('[data-ps="content"]'), { at: [800, 1350], dir: 'depth', amount: 0.5, stagger: 0.06, ease: EASE.settle })
      beat(tl, q('[data-ps="text"]'), { at: [850, 1400], dir: 'fade', stagger: 0.06, ease: EASE.soft })
      beat(tl, q('[data-ps="foot"]'), { at: [1200, 1600], dir: 'fade', stagger: 0.06, ease: EASE.soft })
    },
    { start: 'top 62%' },
  )

  // Idle 3D 1350 ms+: micro float — never an obvious continuous spin; paused off-screen
  useEffect(() => {
    const el = object.current
    if (!el || reduced || isTouchDevice()) return
    const tl = gsap.timeline({ repeat: -1, yoyo: true, paused: true, delay: 1.35 })
    tl.to(el, { y: -6, rotation: -0.4, duration: 4.5, ease: 'sine.inOut' })
    tl.to(el, { y: 4, rotation: 0.35, duration: 4.5, ease: 'sine.inOut' })
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.pause()), { threshold: 0.2 })
    if (root.current) io.observe(root.current)
    return () => {
      io.disconnect()
      tl.kill()
    }
  }, [reduced])

  // pointer light on the material (desktop) — the highlight follows the cursor across the object
  useEffect(() => {
    const el = root.current
    if (!el || reduced || isTouchDevice()) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width) * 100
      const y = ((e.clientY - r.top) / r.height) * 100
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0
          el.style.setProperty('--lx', `${x}%`)
          el.style.setProperty('--ly', `${y}%`)
        })
    }
    el.addEventListener('pointermove', onMove)
    return () => {
      el.removeEventListener('pointermove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduced])

  const cards = c.cards
  const sel = selected >= 0 ? cards[selected] : null
  const select = (i: number) => setSelected((s) => (s === i ? -1 : i))

  return (
    <section
      ref={root}
      id="product-system"
      className={styles.section}
      data-section
      data-theme="dark"
      data-nav="products"
      aria-labelledby="system-heading"
      style={{ '--tint': sel ? TONE_HEX[sel.tone] : 'transparent', '--sel': selected } as CSSProperties}
      data-selected={sel?.tone ?? 'none'}
    >
      <div className={styles.stage}>
        <div ref={grid} className={styles.grid} role="group" aria-label="Product system">
          {/* title block */}
          <div className={`${styles.cell} ${styles.title}`} data-ps="cell">
            <SectionLabel className={styles.label} data-ps="title">
              {c.label}
            </SectionLabel>
            <h2 id="system-heading" className={`${styles.heading} t-headline-light`} data-ps="title">
              <span>{c.heading[0]}</span>
              <span>{c.heading[1]}</span>
            </h2>
            <span className={`rule ${styles.titleRule}`} data-ps="title" aria-hidden="true" />
            <Labels lines={c.sub} rule={false} className={styles.sub} data-ps="title" />
          </div>

          <GlassCard tone="blue" n={cards[1].n} name={cards[1].name} selected={selected === 1} onSelect={() => select(1)} className={styles.blue} />
          <div className={`${styles.cell} ${styles.cellA}`} data-ps="cell" />
          <div className={`${styles.cell} ${styles.cellLabels}`} data-ps="cell">
            <Labels lines={c.labels} strong={3} className={styles.cellText} data-ps="text" />
          </div>
          <div className={`${styles.cell} ${styles.cellB}`} data-ps="cell" />
          <div className={`${styles.cell} ${styles.cellC}`} data-ps="cell" />
          <div className={`${styles.cell} ${styles.cellBuilt}`} data-ps="cell">
            <Labels lines={c.built} className={styles.cellText} data-ps="text" />
          </div>
          <div className={`${styles.cell} ${styles.cellD}`} data-ps="cell" />
          <GlassCard tone="violet" n={cards[0].n} name={cards[0].name} selected={selected === 0} onSelect={() => select(0)} className={styles.violet} />
          <GlassCard tone="white" n={cards[2].n} name={cards[2].name} selected={selected === 2} onSelect={() => select(2)} className={styles.white} />
          <div className={`${styles.cell} ${styles.cellTools}`} data-ps="cell">
            <Labels lines={c.tools} className={styles.cellText} data-ps="text" />
            <span className={`${styles.cellFoot} t-mono-sm`} data-ps="text">
              {brand.name}
              <br />© {brand.year}
            </span>
          </div>
          <GlassCard tone="lime" n={cards[3].n} name={cards[3].name} selected={selected === 3} onSelect={() => select(3)} className={styles.lime} />

          {/* central 3D object */}
          <div className={styles.objectWrap} aria-hidden="true">
            <span className={styles.objectShadow} data-ps="object-shadow" />
            <div ref={object} className={styles.object} data-ps="object">
              <div className={styles.objectInner}>
                <img src={asset('/assets/system/robot-arm.png')} width={836} height={746} alt="" loading="lazy" decoding="async" draggable={false} className={styles.arm} />
                <span className={styles.armLight} />
                <span className={styles.armTint} />
              </div>
            </div>
          </div>
        </div>
        <p className="sr-only">Aivinci Products — a robotic camera arm, the central product object.</p>

        {/* footer row */}
        <div className={styles.foot}>
          <button type="button" className={styles.cue} data-ps="foot" onClick={() => scrollToId('contact')}>
            <Rings size={44} />
            <span className="t-label">
              Scroll
              <br />
              to explore
            </span>
          </button>
          <p className={`${styles.selectedState} t-mono`} data-ps="foot" aria-live="polite">
            {sel ? `${sel.n} / ${sel.name}` : c.chapter}
          </p>
          <p className={`${styles.footRight} t-mono`} data-ps="foot">
            {brand.keywords.join('   /   ')}
          </p>
        </div>
      </div>
    </section>
  )
}
