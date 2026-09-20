import { useEffect, useRef, useState } from 'react'
import { Button, IconButton } from '../components/ui/Button'
import { Labels, ScrollCue, SectionLabel } from '../components/ui/Editorial'
import { ArrowLeft, ArrowRight, ArrowUpRight } from '../components/ui/Icons'
import { Handwriting, handwritingBeat } from '../components/ui/Handwriting'
import { MediaSlot } from '../components/ui/MediaSlot'
import { PhoneInHand } from '../components/product/PhoneInHand'
import { cta, products as c } from '../data/content'
import { EASE, beat, gsap, isTouchDevice, scrollToId, useReducedMotion, useSectionReveal } from '../lib/motion'
import styles from './Products.module.css'
import { asset } from '../lib/assets'

/** 08 / PRODUCTS — Built by Aivinci. Phone rises into the hand; data resolves right → left. */
export function Products() {
  const root = useRef<HTMLElement>(null)
  const float = useRef<HTMLDivElement>(null)
  const [slide, setSlide] = useState(0)
  const reduced = useReducedMotion()

  useSectionReveal(
    root,
    (tl, el) => {
      const q = (s: string) => el.querySelectorAll(s)
      // Product scene 0–350: dark canvas establishes, stable base before objects move
      beat(tl, q('[data-pr="canvas"]'), { at: [0, 350], dir: 'fade', ease: EASE.soft })
      beat(tl, q('[data-pr="head"]'), { at: [150, 750], dir: 'left', amount: 0.5, stagger: 0.07 })
      // Phone 350–1050: BOTTOM → TOP — the device rises into the hand
      tl.fromTo(q('[data-ph="phone"]'), { yPercent: 16, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: EASE.cine }, 0.35)
      // Hand 550–1150: BOTTOM → TOP — hand and phone feel physically connected
      tl.fromTo(q('[data-ph="hand"]'), { yPercent: 12, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: EASE.cine }, 0.55)
      tl.fromTo(q('[data-zy-line]'), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: EASE.inOut }, 0.9)
      // Upper element 650–1100: TOP → BOTTOM, controlled descent
      beat(tl, q('[data-pr="callout"]'), { at: [650, 1100], dir: 'top', amount: 0.8 })
      tl.fromTo(q('[data-pr="connector"]'), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, ease: EASE.inOut }, 0.7)
      // Screenshot 01 850–1300 / 02 1000–1450: RIGHT → LEFT, short stagger
      beat(tl, q('[data-pr="shot-1"]'), { at: [850, 1300], dir: 'right', amount: 1.1 })
      beat(tl, q('[data-pr="shot-2"]'), { at: [1000, 1450], dir: 'right', amount: 1.1 })
      beat(tl, q('[data-pr="shot-meta"]'), { at: [1050, 1450], dir: 'right', amount: 0.4, stagger: 0.05 })
      // Table / data 1150–1550: RIGHT → LEFT, one-by-one resolution
      beat(tl, q('[data-pr="row"]'), { at: [1150, 1550], dir: 'right', amount: 0.6, stagger: 0.09 })
      // Final product state 1500–1900: depth settle
      tl.fromTo(q('[data-pr="hand"]'), { scale: 1.012 }, { scale: 1, duration: 0.4, ease: EASE.settle }, 1.5)
      beat(tl, q('[data-pr="foot"]'), { at: [1500, 1900], dir: 'fade', stagger: 0.08, ease: EASE.soft })
      const hand = el.querySelector('[data-pr="handwriting"]')
      if (hand) handwritingBeat(tl, hand, [1550, 2100])
    },
    { start: 'top 62%' },
  )

  // very subtle idle float only (desktop, non-reduced), paused off-screen
  useEffect(() => {
    const el = float.current
    if (!el || reduced || isTouchDevice()) return
    const tl = gsap.timeline({ repeat: -1, yoyo: true, paused: true, delay: 1.9 })
    tl.to(el, { y: -4, rotation: -0.25, duration: 4.2, ease: 'sine.inOut' })
    tl.to(el, { y: 3, rotation: 0.2, duration: 4.2, ease: 'sine.inOut' })
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.pause()), { threshold: 0.2 })
    if (root.current) io.observe(root.current)
    return () => {
      io.disconnect()
      tl.kill()
    }
  }, [reduced])

  const p = c.product

  return (
    <section ref={root} id="products" className={styles.section} data-section data-theme="dark" data-nav="products" aria-labelledby="products-heading">
      <div className={styles.canvas} data-pr="canvas" aria-hidden="true" />
      <div className={styles.stage}>
        {/* ---- left: heading + product data --------------------------- */}
        <div className={styles.left}>
          <SectionLabel line className={styles.label} data-pr="head">
            {c.label}
          </SectionLabel>
          <h2 id="products-heading" className={`${styles.heading} t-headline-light`} data-pr="head">
            <span>{c.heading[0]}</span>
            <span>{c.heading[1]}</span>
          </h2>
          <p className={styles.description} data-pr="head">
            {c.description}
          </p>

          <div className={styles.table}>
            <div className={styles.productRow} data-pr="row">
              <span className={styles.productName}>{p.name}</span>
              <span className={`${styles.productCat} t-mono-sm`}>{p.category}</span>
            </div>
            <ol className={styles.rows} aria-label={`${p.name} capabilities`}>
              {p.features.map((f) => (
                <li key={f.n} className={styles.row} data-pr="row">
                  <span className={`${styles.rowNum} t-mono`}>{f.n}</span>
                  <span className={styles.rowName}>{f.name}</span>
                  <span className={styles.rowArrow} aria-hidden="true">
                    <ArrowRight size={13} />
                  </span>
                </li>
              ))}
            </ol>
            <p className={styles.productDesc} data-pr="row">
              {p.description}
            </p>
            <div data-pr="row">
              <Button variant="inverse" icon={<ArrowUpRight size={15} />} href={cta.zynnectUrl} target="_blank" rel="noopener noreferrer">
                {cta.exploreZynnect}
              </Button>
            </div>
          </div>
        </div>

        {/* ---- centre: the physical product --------------------------- */}
        <div ref={float} className={styles.hand} data-pr="hand">
          <PhoneInHand onExplore={() => window.open(cta.zynnectUrl, '_blank', 'noopener,noreferrer')} />
        </div>

        {/* ---- right: callout + product film slot ---------------------- */}
        <div className={styles.callout} data-pr="callout">
          <Labels lines={c.callout} rule={false} />
        </div>
        <svg className={styles.connector} viewBox="0 0 70 190" aria-hidden="true">
          <circle cx="4" cy="4" r="3" fill="#fff" />
          <path d="M6 6 L64 66 V186" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1" pathLength={1} data-pr="connector" />
        </svg>

        <div className={styles.shots}>
          <span className={`${styles.shotIndex} t-mono`} data-pr="shot-meta">
            0{slide + 1}
          </span>
          <div className={styles.stack}>
            <figure className={[styles.shot, slide === 0 ? styles.shotFront : styles.shotBack].join(' ')} data-pr="shot-1">
              <MediaSlot poster={asset('/assets/products/action-card.jpg')} aspect="349 / 230" radius={4} alt={c.action.join(' ')} />
              <figcaption className={styles.shotCap}>
                <Labels lines={c.action} rule={false} />
              </figcaption>
            </figure>
            <figure className={[styles.shot, styles.shotStatement, slide === 1 ? styles.shotFront : styles.shotBack].join(' ')} data-pr="shot-2">
              <div className={styles.statement}>
                <span className={`${styles.statementCat} t-mono-sm`}>{p.category}</span>
                <p className={`${styles.statementText} t-headline`}>
                  {p.uiText.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </p>
                <span className="rule" aria-hidden="true" />
              </div>
            </figure>
          </div>
          <div className={styles.shotNav} data-pr="shot-meta">
            <IconButton tone="outline" size={34} aria-label="Previous" onClick={() => setSlide((s) => (s + 1) % 2)}>
              <ArrowLeft size={13} />
            </IconButton>
            <span className={`t-mono ${styles.shotSlash}`}>/</span>
            <IconButton tone="outline" size={34} aria-label="Next" onClick={() => setSlide((s) => (s + 1) % 2)}>
              <ArrowRight size={13} />
            </IconButton>
          </div>
        </div>

        <div className={styles.handwriting} data-pr="foot">
          <Handwriting lines={c.handwriting} rotate={-5} size="clamp(22px, 1.9vw, 30px)" data-pr="handwriting" />
        </div>
        <div className={styles.cue} data-pr="foot">
          <span className={styles.cueLine} aria-hidden="true" />
          <ScrollCue tone="light" side="left" onClick={() => scrollToId('product-system')} />
        </div>
        <Button variant="ghost" size="sm" icon={<ArrowUpRight size={13} />} className={styles.mobileExplore} href={cta.zynnectUrl} target="_blank" rel="noopener noreferrer" data-pr="foot">
          {cta.exploreZynnect}
        </Button>
      </div>
    </section>
  )
}
