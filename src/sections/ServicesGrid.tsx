import { useRef } from 'react'
import { Button, IconButton } from '../components/ui/Button'
import { Labels, VRule } from '../components/ui/Editorial'
import { ArrowRight } from '../components/ui/Icons'
import { Handwriting, handwritingBeat } from '../components/ui/Handwriting'
import { MediaSlot } from '../components/ui/MediaSlot'
import { cta, services, servicesGrid as c, type Service } from '../data/content'
import { EASE, beat, scrollToId, usePointerTilt, useSectionReveal } from '../lib/motion'
import styles from './ServicesGrid.module.css'
import { asset } from '../lib/assets'

/** One dimensional service card: media plane + floating caption + control. */
function ServiceCard({ s, index }: { s: Service; index: number }) {
  const media = useRef<HTMLDivElement>(null)
  usePointerTilt(media, { maxTilt: 5, maxShift: 12, perspective: 900, layers: '[data-depth]' })
  return (
    <article className={styles.card} data-sg="card" style={{ '--i': index } as React.CSSProperties}>
      <div className={styles.head}>
        <p className={`${styles.num} t-body`}>
          {s.n}
          <span className={styles.numRule} aria-hidden="true" />
        </p>
        <h3 className={`${styles.title} t-title`}>
          {s.title.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </h3>
        <p className={styles.desc}>{s.body}</p>
      </div>
      <div ref={media} className={styles.media} data-sg="media">
        <MediaSlot
          poster={asset(`/assets/services/grid-${s.media}.jpg`)}
          aspect="372 / 176"
          radius={3}
          playControl={false}
          tag="Video placeholder"
          alt={`${s.title.join(' ')} — ${s.caption.join(' ')}`}
          className={styles.slot}
        />
        <Labels lines={s.caption} rule={false} className={styles.caption} data-depth />
        <span className={styles.arrow} data-depth="1">
          <IconButton tone="glass" size={40} aria-label={`${s.title.join(' ')} — explore`} onClick={() => scrollToId('contact')}>
            <ArrowRight size={16} />
          </IconButton>
        </span>
      </div>
    </article>
  )
}

/** 04 / SERVICES — the complete 8-service catalogue. */
export function ServicesGrid() {
  const root = useRef<HTMLElement>(null)

  useSectionReveal(root, (tl, el) => {
    const q = (s: string) => el.querySelectorAll(s)
    // Grid / frame 0–350: subtle structural resolve, no layout shift
    beat(tl, q('[data-sg="frame"]'), { at: [0, 350], dir: 'fade', ease: EASE.soft })
    beat(tl, q('[data-sg="top"]'), { at: [100, 600], dir: 'bottom', amount: 0.3, stagger: 0.08 })
    // Service cards: 01 700–850, 02 780–930, 03 860–1010, 04 940–1090, 05–08 1000–1500 — BOTTOM → TOP
    const cards = Array.from(q('[data-sg="card"]'))
    const windows: [number, number][] = [
      [700, 850], [780, 930], [860, 1010], [940, 1090],
      [1000, 1150], [1115, 1265], [1230, 1380], [1350, 1500],
    ]
    cards.forEach((card, i) => {
      const w = windows[i] ?? [1000 + i * 60, 1500]
      beat(tl, card, { at: w, dir: 'bottom', amount: 0.9, ease: EASE.cine })
      // Card media: after the frame, resolves from depth
      const media = card.querySelector('[data-sg="media"]')
      if (media) beat(tl, media, { at: [w[0] + 90, w[1] + 260], dir: 'depth', amount: 0.5, ease: EASE.settle })
    })
    // CTA / outro: final phase, subtle plane reveal
    beat(tl, q('[data-sg="outro"]'), { at: [1500, 1900], dir: 'bottom', amount: 0.35, stagger: 0.07 })
    const hand = el.querySelector('[data-sg="hand"]')
    if (hand) handwritingBeat(tl, hand, [1650, 2300])
  })

  return (
    <section ref={root} id="services-grid" className={styles.section} data-section data-theme="light" data-nav="services" aria-label="Services catalogue">
      <div className={styles.top}>
        <Labels lines={c.topLeft} className={styles.topLeft} data-sg="top" />
        <p className={styles.topCenter} data-sg="top">
          {c.topCenter}
        </p>
        <p className={`${styles.topRight} t-label-wide`} data-sg="top">
          {c.topRight[0]}
          <br />
          {c.topRight[1]}
        </p>
      </div>

      <div className={styles.grid} data-sg="frame">
        {services.map((s, i) => (
          <ServiceCard key={s.n} s={s} index={i} />
        ))}
      </div>

      <div className={styles.outro}>
        <h3 className={`${styles.outroHead} t-display`} data-sg="outro">
          <span>{c.outro.headline[0]}</span>
          <span className={styles.outroMuted}>{c.outro.headline[1]}</span>
        </h3>
        <div className={styles.outroBody} data-sg="outro">
          <p>
            {c.outro.body[0]}
            <br />
            {c.outro.body[1]}
          </p>
          <Button icon={<ArrowRight size={16} />} onClick={() => scrollToId('contact')}>
            {cta.startProject}
          </Button>
        </div>
        <VRule className={styles.vr} />
        <div className={styles.arch} data-sg="outro">
          <img src={asset('/assets/services/arch.jpg')} width={92} height={90} alt="" loading="lazy" decoding="async" draggable={false} />
        </div>
        <div className={styles.hand} data-sg="outro">
          <Handwriting lines={c.handwriting} rotate={-6} size="clamp(20px, 1.7vw, 28px)" data-sg="hand" />
        </div>
        <VRule className={styles.vr} />
        <Labels lines={c.outroLabels} rule={false} className={styles.outroLabels} data-sg="outro" />
      </div>
    </section>
  )
}
