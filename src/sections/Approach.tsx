import { useRef, type CSSProperties } from 'react'
import { Crosshair, Labels, ScrollCue, SectionLabel } from '../components/ui/Editorial'
import { approach as c } from '../data/content'
import { EASE, beat, scrollToId, useSectionReveal } from '../lib/motion'
import styles from './Approach.module.css'
import { asset } from '../lib/assets'

interface Frame {
  id: string
  src: string
  w: number
  h: number
  /** % of the stage: left, top, width, height */
  box: [number, number, number, number]
  alt: string
  framed?: boolean
  focus?: string
}

const FRAMES: Frame[] = [
  { id: 'eye', src: asset('/assets/approach/eye.jpg'), w: 332, h: 305, box: [18.4, 4.2, 21.6, 40.1], alt: 'A close-up of an eye catching warm light' },
  { id: 'profile', src: asset('/assets/approach/profile.jpg'), w: 175, h: 177, box: [33.7, 20.1, 11.9, 24.2], alt: 'A profile in low light', framed: true },
  { id: 'set', src: asset('/assets/approach/set.jpg'), w: 429, h: 204, box: [49.8, 4.2, 27.9, 26.8], alt: 'A film crew at work on a lit set' },
  { id: 'portrait', src: asset('/assets/approach/portrait.jpg'), w: 88, h: 141, box: [88.7, 7, 5.7, 18.6], alt: 'Portrait in a doorway of light' },
  { id: 'silhouette', src: asset('/assets/approach/silhouette.jpg'), w: 80, h: 124, box: [3.6, 63.2, 5.2, 16.3], alt: 'A silhouette against a lit wall' },
  { id: 'mountains', src: asset('/assets/approach/mountains.jpg'), w: 407, h: 196, box: [22.8, 65.8, 26.5, 25.8], alt: 'Looking out over mountains at dusk' },
  { id: 'hands', src: asset('/assets/approach/hands.jpg'), w: 116, h: 103, box: [51.9, 64.5, 7.6, 13.6], alt: 'Two hands reaching for each other' },
  { id: 'lighttable', src: asset('/assets/approach/lighttable.jpg'), w: 261, h: 125, box: [73.6, 62.2, 17, 16.4], alt: 'Hands reviewing frames on a light table' },
]

const CROSSES: [number, number][] = [
  [38.9, 6.6], [5.9, 83.8], [50.6, 79.6], [72.6, 62.6], [89.8, 67.1], [95.7, 6.6],
]

function Frame({ f, index }: { f: Frame; index: number }) {
  const [l, t, w, h] = f.box
  return (
    <figure
      className={[styles.frame, f.framed ? styles.framed : ''].filter(Boolean).join(' ')}
      style={{ '--l': `${l}%`, '--t': `${t}%`, '--w': `${w}%`, '--h': `${h}%`, '--i': index } as CSSProperties}
      data-ap="frame"
      data-frame={f.id}
    >
      <span className={styles.frameEdge} data-ap="edge" aria-hidden="true" />
      <span className={styles.mask} data-ap="mask">
        <img src={f.src} width={f.w} height={f.h} alt={f.alt} loading="lazy" decoding="async" data-ap="img" draggable={false} style={{ objectPosition: f.focus }} />
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

  const step = (i: number) => c.steps[i]

  return (
    <section ref={root} id="approach" className={styles.section} data-section data-theme="light" data-nav="approach" aria-labelledby="approach-heading">
      <div className={styles.stage}>
        <div className={styles.grid} data-ap="grid" aria-hidden="true">
          {CROSSES.map(([x, y], i) => (
            <Crosshair key={i} className={styles.cross} style={{ left: `${x}%`, top: `${y}%` }} size={18} />
          ))}
        </div>

        {/* ---- heading block ------------------------------------------- */}
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

        {/* ---- frames ---------------------------------------------------- */}
        {FRAMES.map((f, i) => (
          <Frame key={f.id} f={f} index={i} />
        ))}

        {/* ---- numbered markers (as in the reference) + the four-step method ---- */}
        {[
          { i: 0, l: 16.6, t: 36.4 },
          { i: 1, l: 89.5, t: 30.2 },
          { i: 2, l: 21.2, t: 68.6 },
          { i: 3, l: 91.7, t: 63.4 },
        ].map(({ i, l, t }) => (
          <div key={i} className={styles.marker} style={{ left: `${l}%`, top: `${t}%` }} data-ap="icon">
            <span className="t-mono">{step(i).n}</span>
            <span className={styles.stepLine} aria-hidden="true" />
          </div>
        ))}
        <ol className={styles.method} data-ap="label">
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

        {/* ---- editorial labels -------------------------------------------- */}
        <Labels lines={c.labelA} className={styles.labelA} data-ap="label" />
        <Labels lines={c.labelB} className={styles.labelB} data-ap="label" />
        <Labels lines={c.moreHuman} className={styles.moreHuman} rule={false} data-ap="label" />
        <Labels lines={c.labelC} className={styles.labelC} data-ap="label" />
        <Labels lines={c.labelD} className={styles.labelD} data-ap="label" />

        {/* ---- giant editorial typography ---------------------------------- */}
        <div className={styles.giant} aria-hidden="true">
          <svg className={styles.giantLine1} viewBox="0 0 780 100" preserveAspectRatio="none" data-ap="giant">
            <text x="0" y="98" textLength="780" lengthAdjust="spacingAndGlyphs">
              {c.giant[0]}
            </text>
          </svg>
          <svg className={styles.giantLine2} viewBox="0 0 1425 104" preserveAspectRatio="none" data-ap="giant">
            <text x="0" y="102" textLength="1425" lengthAdjust="spacingAndGlyphs">
              {c.giant[1]}
            </text>
          </svg>
        </div>
        <p className="sr-only">{c.giant.join(' ')}</p>

        {/* ---- ideas into impact + closing ---------------------------------- */}
        <div className={styles.impact} data-ap="label">
          <span className={styles.impactLine} aria-hidden="true" />
          <h3 className={`${styles.impactHead} t-title`}>
            {c.ideasIntoImpact.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </h3>
          <span className="rule" aria-hidden="true" />
        </div>
        <p className={styles.closing} data-ap="final">
          {c.body}
        </p>
        <div className={styles.cue} data-ap="icon">
          <ScrollCue onClick={() => scrollToId('work')} />
        </div>

        {/* ---- footer row ------------------------------------------------- */}
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

      {/* ---- mobile / tablet composition ------------------------------------ */}
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

        <div className={styles.mCollage}>
          <div className={styles.mFrame} style={{ gridArea: 'a' }} data-ap="frame">
            <span className={styles.mask} data-ap="mask">
              <img src={asset('/assets/approach/eye-tight.jpg')} width={227} height={305} alt={FRAMES[0].alt} loading="lazy" decoding="async" data-ap="img" draggable={false} />
            </span>
          </div>
          <div className={styles.mFrame} style={{ gridArea: 'b' }} data-ap="frame">
            <span className={styles.mask} data-ap="mask">
              <img src={asset('/assets/approach/set.jpg')} width={429} height={204} alt={FRAMES[2].alt} loading="lazy" decoding="async" data-ap="img" draggable={false} />
            </span>
          </div>
          <Labels lines={c.labelA} className={styles.mLabelA} style={{ gridArea: 'c' }} data-ap="label" />
          <div className={styles.mFrame} style={{ gridArea: 'd' }} data-ap="frame">
            <span className={styles.mask} data-ap="mask">
              <img src={asset('/assets/approach/profile.jpg')} width={175} height={177} alt={FRAMES[1].alt} loading="lazy" decoding="async" data-ap="img" draggable={false} />
            </span>
          </div>
        </div>

        <div className={styles.mGiant} aria-hidden="true">
          <svg viewBox="0 0 780 100" preserveAspectRatio="none" data-ap="giant">
            <text x="0" y="98" textLength="780" lengthAdjust="spacingAndGlyphs">
              {c.giant[0]}
            </text>
          </svg>
          <svg viewBox="0 0 1425 104" preserveAspectRatio="none" data-ap="giant">
            <text x="0" y="102" textLength="1425" lengthAdjust="spacingAndGlyphs">
              {c.giant[1]}
            </text>
          </svg>
        </div>

        <ol className={styles.mSteps}>
          {c.steps.map((s, i) => (
            <li key={s.n} className={styles.mStep} data-ap="icon">
              <div className={styles.mStepMedia}>
                <span className={styles.mask} data-ap="mask">
                  <img
                    src={[asset('/assets/approach/portrait.jpg'), asset('/assets/approach/mountains.jpg'), asset('/assets/approach/hands.jpg'), asset('/assets/approach/lighttable.jpg')][i]}
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
