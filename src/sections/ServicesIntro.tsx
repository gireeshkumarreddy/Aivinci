import { useRef } from 'react'
import { Labels, ScrollCue, SectionLabel } from '../components/ui/Editorial'
import { MediaSlot } from '../components/ui/MediaSlot'
import { servicesIntro as c } from '../data/content'
import { EASE, beat, scrollToId, useSectionReveal } from '../lib/motion'
import styles from './ServicesIntro.module.css'
import { asset } from '../lib/assets'

/** 03 / SERVICES — Create solutions for a brighter tomorrow. */
export function ServicesIntro() {
  const root = useRef<HTMLElement>(null)

  useSectionReveal(root, (tl, el) => {
    const q = (s: string) => el.querySelectorAll(s)
    // Background 0–300: establish the scene first
    beat(tl, q('[data-si="env"]'), { at: [0, 300], dir: 'fade', ease: EASE.soft })
    // Hero image 250–800: background → foreground, reference crop preserved
    beat(tl, q('[data-si="image"]'), { at: [250, 800], dir: 'depth', amount: 0.9, from: { scale: 1.08 }, to: { scale: 1 }, ease: EASE.settle })
    // Create solutions message 350–900: depth → final plane, slow and confident
    beat(tl, q('[data-si="headline"]'), { at: [350, 900], dir: 'depth', amount: 0.6, ease: EASE.settle })
    beat(tl, q('[data-si="labels"]'), { at: [450, 950], dir: 'fade' })
    // SERVICES 500–1150: BOTTOM → TOP, oversized, slow rise out of the section edge
    tl.fromTo(q('[data-si="giant"]'), { yPercent: 100 }, { yPercent: 0, duration: 0.65, ease: EASE.cine }, 0.5)
    // Service cards 700–1500: BOTTOM → TOP, staggered — every card the same language
    beat(tl, q('[data-si="card"]'), { at: [700, 1500], dir: 'bottom', stagger: 0.14 })
    // Technology copy 1150–1600: restrained plane reveal
    beat(tl, q('[data-si="copy"]'), { at: [1150, 1600], dir: 'bottom', amount: 0.3, stagger: 0.06 })
    // Settle 1500–1850: final lock
    tl.fromTo(q('[data-si="image"]'), { scale: 1.006 }, { scale: 1, duration: 0.35, ease: EASE.settle }, 1.5)
  })

  return (
    <section ref={root} id="services" className={styles.section} data-section data-theme="dark" data-nav="services" aria-labelledby="services-heading">
      {/* ---- cinematic production environment ------------------------- */}
      <div className={styles.env} data-si="env">
        <img
          className={styles.image}
          src={asset('/assets/services/environment.jpg')}
          width={1536}
          height={525}
          alt="Aivinci film set — the director framed against a white cyc, crew and camera in the haze"
          loading="lazy"
          decoding="async"
          data-si="image"
          draggable={false}
        />
        <div className={styles.envShade} aria-hidden="true" />

        <div className={styles.headlineBlock} data-si="headline">
          <h2 id="services-heading" className={`${styles.headline} t-display`}>
            {c.headline.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </h2>
          <p className={styles.support}>{c.support}</p>
        </div>

        <div className={styles.sideLabels} data-si="labels">
          <Labels lines={c.labelsA} rule={false} className={styles.sideA} />
          <Labels lines={c.labelsB} rule={false} className={styles.sideB} />
        </div>

        {/* giant typography rises out of the section edge */}
        <div className={styles.giantClip} aria-hidden="true">
          <svg className={styles.giant} viewBox="0 0 1536 132" preserveAspectRatio="none" data-si="giant">
            <text x="0" y="130" textLength="1536" lengthAdjust="spacingAndGlyphs">
              {c.giant}
            </text>
          </svg>
        </div>
      </div>

      {/* ---- paper: the technology copy + media ----------------------- */}
      <div className={styles.paper} data-section data-theme="light" data-nav="services">
        <div className={styles.paperGrid}>
          <div className={styles.meta} data-si="copy">
            <SectionLabel className={styles.label}>{c.label}</SectionLabel>
            <p className={styles.metaText}>
              {c.sideText[0]}
              <br />
              {c.sideText[1]}
            </p>
          </div>

          <h3 className={`${styles.statement} t-title`} data-si="copy">
            {c.statement.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </h3>

          <div className={styles.message} data-si="copy">
            <p>{c.message}</p>
            <span className="rule" aria-hidden="true" />
          </div>

          <div className={styles.ideas} data-si="copy">
            <Labels lines={c.ideasIntoImpact} />
          </div>

          <div className={styles.cardA} data-si="card">
            <MediaSlot poster={asset('/assets/services/card-crew.jpg')} aspect="492 / 190" radius={4} playControl={false} tag="Video placeholder" alt="Crew silhouettes on a lit film set" />
          </div>

          <div className={styles.cardB} data-si="card">
            <div className={styles.cardBInner}>
              <Labels lines={c.cardText} className={styles.cardBText} />
              <img src={asset('/assets/services/card-lens.jpg')} width={240} height={152} alt="" loading="lazy" decoding="async" className={styles.lens} draggable={false} />
            </div>
          </div>

          <div className={styles.cue} data-si="copy">
            <ScrollCue onClick={() => scrollToId('services-grid')} />
          </div>
        </div>
      </div>
    </section>
  )
}
