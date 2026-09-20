import { useRef, type CSSProperties } from 'react'
import { Crosshair, Labels, ScrollCue, SectionLabel } from '../components/ui/Editorial'
import { approach as c } from '../data/content'
import { EASE, beat, scrollToId, useSectionReveal } from '../lib/motion'
import styles from './Approach.module.css'
import { asset } from '../lib/assets'

interface Photo {
  id: string
  src: string
  w: number
  h: number
  alt: string
}

const PHOTOS: Record<string, Photo> = {
  eye: { id: 'eye', src: asset('/assets/approach/eye.jpg'), w: 332, h: 305, alt: 'A close-up of an eye catching warm light' },
  eyeTight: { id: 'eye-tight', src: asset('/assets/approach/eye-tight.jpg'), w: 227, h: 305, alt: 'A close-up of an eye catching warm light' },
  profile: { id: 'profile', src: asset('/assets/approach/profile.jpg'), w: 175, h: 177, alt: 'A profile in low light' },
  set: { id: 'set', src: asset('/assets/approach/set.jpg'), w: 429, h: 204, alt: 'A film crew at work on a lit set' },
  portrait: { id: 'portrait', src: asset('/assets/approach/portrait.jpg'), w: 88, h: 141, alt: 'Portrait in a doorway of light' },
  silhouette: { id: 'silhouette', src: asset('/assets/approach/silhouette.jpg'), w: 80, h: 124, alt: 'A silhouette against a lit wall' },
  mountains: { id: 'mountains', src: asset('/assets/approach/mountains.jpg'), w: 407, h: 196, alt: 'Looking out over mountains at dusk' },
  hands: { id: 'hands', src: asset('/assets/approach/hands.jpg'), w: 116, h: 103, alt: 'Two hands reaching for each other' },
  lighttable: { id: 'lighttable', src: asset('/assets/approach/lighttable.jpg'), w: 261, h: 125, alt: 'Hands reviewing frames on a light table' },
}

const CROSSES: [number, number][] = [
  [38.9, 3.2], [95.7, 3.2], [3.2, 96.4], [50.6, 96.4],
]

/** A photograph in the collage: a hairline frame, the pixels revealed inside a mask. */
function Frame({ p, className, framed, ratio, focus }: { p: Photo; className?: string; framed?: boolean; ratio?: string; focus?: string }) {
  return (
    <figure
      className={[styles.frame, framed ? styles.framed : '', className].filter(Boolean).join(' ')}
      style={{ aspectRatio: ratio ?? `${p.w} / ${p.h}` } as CSSProperties}
      data-ap="frame"
      data-frame={p.id}
    >
      <span className={styles.frameEdge} data-ap="edge" aria-hidden="true" />
      <span className={styles.mask} data-ap="mask">
        <img src={p.src} width={p.w} height={p.h} alt={p.alt} loading="lazy" decoding="async" data-ap="img" draggable={false} style={{ objectPosition: focus }} />
      </span>
    </figure>
  )
}

/** 05 / OUR APPROACH — Human creativity. Intelligent technology. */
export function Approach() {
  const root = useRef<HTMLElement>(null)

  useSectionReveal(root, (tl, el) => {
    const q = (s: string) => el.querySelectorAll(s)
    // Grid 0–350: very low opacity, structural only
    beat(tl, q('[data-ap="grid"]'), { at: [0, 350], dir: 'fade', to: { opacity: 1 }, ease: EASE.soft })
    // Image frames 200–650: establish geometry (exact dimensions reserved)
    beat(tl, q('[data-ap="edge"]'), { at: [200, 650], dir: 'fade', stagger: 0.04, ease: EASE.soft })
    // Image content 350–1050: pixels reveal BOTTOM → TOP inside the mask, no crop jump
    tl.fromTo(q('[data-ap="mask"]'), { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.7, ease: EASE.cine, stagger: 0.06 }, 0.35)
    tl.fromTo(q('[data-ap="img"]'), { yPercent: 10, scale: 1.04 }, { yPercent: 0, scale: 1, duration: 0.7, ease: EASE.cine, stagger: 0.06 }, 0.35)
    // Icons 400–1050: BOTTOM → TOP, staggered by visual relationship
    beat(tl, q('[data-ap="icon"]'), { at: [400, 1050], dir: 'bottom', amount: 0.4, stagger: 0.05 })
    // Supporting labels 500–1150: BOTTOM → TOP / settle
    beat(tl, q('[data-ap="label"]'), { at: [500, 1150], dir: 'bottom', amount: 0.45, stagger: 0.05 })
    beat(tl, q('[data-ap="head"]'), { at: [450, 1000], dir: 'bottom', amount: 0.5, stagger: 0.06 })
    // HUMAN / CREATIVITY 700–1200: FAST LEFT → RIGHT, strong editorial travel, clean stop
    tl.fromTo(q('[data-ap="giant"]'), { xPercent: -22, opacity: 0, clipPath: 'inset(0 0 0 100%)' }, { xPercent: 0, opacity: 1, clipPath: 'inset(0 0 0 0%)', duration: 0.5, ease: EASE.cine, stagger: 0.08 }, 0.7)
    // Final copy 1050–1500: quiet fade / settle, hierarchy stays secondary
    beat(tl, q('[data-ap="final"]'), { at: [1050, 1500], dir: 'fade', stagger: 0.06, ease: EASE.soft })
  })

  const human = (
    <svg className={styles.giantLine1} viewBox="0 0 780 100" preserveAspectRatio="none" data-ap="giant">
      <text x="0" y="98" textLength="780" lengthAdjust="spacingAndGlyphs">
        {c.giant[0]}
      </text>
    </svg>
  )
  const creativity = (
    <svg className={styles.giantLine2} viewBox="0 0 1425 104" preserveAspectRatio="none" data-ap="giant">
      <text x="0" y="102" textLength="1425" lengthAdjust="spacingAndGlyphs">
        {c.giant[1]}
      </text>
    </svg>
  )

  const method = (
    <ol className={styles.method} data-ap="label" aria-label="How we work">
      {c.steps.map((s) => (
        <li key={s.n} className={styles.methodStep}>
          <span className="t-mono">{s.n}</span>
          <span className={styles.methodText}>
            <strong>{s.name}</strong>
            <span>{s.body}</span>
          </span>
        </li>
      ))}
    </ol>
  )

  return (
    <section ref={root} id="approach" className={styles.section} data-section data-theme="light" data-nav="approach" aria-labelledby="approach-heading">
      {/* ================= desktop: the editorial collage, row by row — nothing overlaps ================= */}
      <div className={styles.stage}>
        <div className={styles.grid} data-ap="grid" aria-hidden="true">
          {CROSSES.map(([x, y], i) => (
            <Crosshair key={i} className={styles.cross} style={{ left: `${x}%`, top: `${y}%` }} size={18} />
          ))}
        </div>

        {/* ---- row 1: heading · eye (with the framed profile) · set · portrait; HUMAN under the set ---- */}
        <div className={styles.top}>
          <div className={styles.headBlock}>
            <SectionLabel className={styles.label} data-ap="head">
              {c.label}
            </SectionLabel>
            <h2 id="approach-heading" className={`${styles.keywords} t-display`} data-ap="head">
              {c.keywords.map((k) => (
                <span key={k}>{k}</span>
              ))}
            </h2>
            <span className={`rule ${styles.headRule}`} data-ap="head" aria-hidden="true" />
            <p className={styles.tagline} data-ap="head">
              {c.tagline[0]}
              <br />
              {c.tagline[1]}
            </p>
          </div>

          <div className={styles.eyeCell}>
            <Frame p={PHOTOS.eye} className={styles.eye} />
            <Frame p={PHOTOS.profile} className={styles.profile} framed />
          </div>
          <Labels lines={c.labelA} className={styles.labelA} data-ap="label" />

          <Frame p={PHOTOS.set} className={styles.set} />
          <Labels lines={c.labelB} className={styles.labelB} data-ap="label" />
          <div className={styles.portraitCell}>
            <Frame p={PHOTOS.portrait} className={styles.portrait} />
            <Labels lines={c.moreHuman} className={styles.moreHuman} rule={false} data-ap="label" />
          </div>

          <div className={styles.human} aria-hidden="true">
            {human}
          </div>
        </div>

        {/* ---- row 2: CREATIVITY, full width, in its own band ---- */}
        <div className={styles.creativity} aria-hidden="true">
          {creativity}
        </div>
        <p className="sr-only">{c.giant.join(' ')}</p>

        {/* ---- row 3: the four-step method ---- */}
        {method}

        {/* ---- row 4: the lower collage · ideas into impact ---- */}
        <div className={styles.bottom}>
          <Frame p={PHOTOS.silhouette} className={styles.silhouette} />
          <Labels lines={c.labelC} className={styles.labelC} data-ap="label" />
          <Frame p={PHOTOS.mountains} className={styles.mountains} />
          <Frame p={PHOTOS.hands} className={styles.hands} />
          <Labels lines={c.labelD} className={styles.labelD} data-ap="label" />
          <div className={styles.impact} data-ap="label">
            <h3 className={`${styles.impactHead} t-title`}>
              {c.ideasIntoImpact.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </h3>
            <span className="rule" aria-hidden="true" />
            <p className={styles.closing} data-ap="final">
              {c.body}
            </p>
          </div>
          <div className={styles.lightCell}>
            <Frame p={PHOTOS.lighttable} className={styles.lighttable} />
            <div className={styles.cue} data-ap="icon">
              <ScrollCue onClick={() => scrollToId('work')} />
            </div>
          </div>
        </div>

        <div className={`${styles.foot} t-label`} data-ap="final">
          <span>
            {c.footer.left[0]}
            <br />
            {c.footer.left[1]}
          </span>
          <span className={styles.footCenter}>{c.footer.center}</span>
          <span className={styles.footRight}>{c.footer.right.join('   /   ')}</span>
        </div>
      </div>

      {/* ================= tablet / mobile: a vertical editorial sequence ================= */}
      <div className={styles.mobile}>
        <div className={styles.mHead}>
          <SectionLabel data-ap="head">{c.label}</SectionLabel>
          <h2 className={`${styles.mKeywords} t-display`} data-ap="head" aria-hidden="true">
            {c.keywords.map((k) => (
              <span key={k}>{k}</span>
            ))}
          </h2>
          <p className={styles.mTagline} data-ap="head">
            {c.tagline[0]}
            <br />
            {c.tagline[1]}
          </p>
        </div>

        {/* four photographs, one grid — the labels sit under them, never on them */}
        <div className={styles.mCollage}>
          <Frame p={PHOTOS.eyeTight} ratio="4 / 5" />
          <Frame p={PHOTOS.set} ratio="4 / 5" focus="55% 50%" />
          <Frame p={PHOTOS.profile} ratio="4 / 5" />
          <Frame p={PHOTOS.mountains} ratio="4 / 5" focus="50% 40%" />
        </div>
        <div className={styles.mLabels}>
          <Labels lines={c.labelA} data-ap="label" />
          <Labels lines={c.labelB} data-ap="label" />
          <Labels lines={c.moreHuman} data-ap="label" />
        </div>

        <div className={styles.mGiant} aria-hidden="true">
          {human}
          {creativity}
        </div>

        <ol className={styles.mSteps} aria-label="How we work">
          {c.steps.map((s, i) => (
            <li key={s.n} className={styles.mStep} data-ap="icon">
              <div className={styles.mStepMedia}>
                <span className={styles.mask} data-ap="mask">
                  <img
                    src={[PHOTOS.portrait, PHOTOS.hands, PHOTOS.lighttable, PHOTOS.silhouette][i].src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    data-ap="img"
                    draggable={false}
                  />
                </span>
              </div>
              <div className={styles.mStepText}>
                <span className="t-mono">{s.n}</span>
                <strong>{s.name}</strong>
                <span>{s.body}</span>
              </div>
            </li>
          ))}
        </ol>

        <div className={styles.mImpact} data-ap="label">
          <h3 className={`${styles.impactHead} t-title`}>{c.ideasIntoImpact.join(' ')}</h3>
          <p className={styles.mClosing} data-ap="final">
            {c.body}
          </p>
        </div>

        <div className={`${styles.mFoot} t-label`} data-ap="final">
          <span>
            {c.footer.left[0]} {c.footer.left[1]}
          </span>
          <span>{c.footer.right.join(' / ')}</span>
        </div>
      </div>
    </section>
  )
}
