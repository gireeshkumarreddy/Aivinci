import { useRef } from 'react'
import { IconButton } from '../components/ui/Button'
import { Labels, ScrollCue, SectionLabel } from '../components/ui/Editorial'
import { ArrowLeft, ArrowRight } from '../components/ui/Icons'
import { MediaSlot } from '../components/ui/MediaSlot'
import { aiVideo as c, brand } from '../data/content'
import { EASE, beat, scrollToId, useMedia, useSectionReveal } from '../lib/motion'
import manifest from '../data/video-manifest.json'
import styles from './AiVideoStory.module.css'
import { asset } from '../lib/assets'

/** renditions written by the asset pipeline (a 1440p tier exists where a 4K master was supplied) */
const renditions = (role: string): string[] => (manifest as Record<string, { renditions: string[] }>)[role]?.renditions ?? ['1080', '720']
const src = (role: string) => ({
  mobile: asset(`/video/${role}-720.mp4`),
  desktop: asset(`/video/${role}-1080.mp4`),
  large: renditions(role).includes('1440') ? asset(`/video/${role}-1440.mp4`) : undefined,
})
const poster = (role: string) => asset(`/video/${role}-poster.jpg`)
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

/** 06A / AI VIDEO STORY — idea → creation → real video. Four autoplaying production videos. */
export function AiVideoStory() {
  const top = useRef<HTMLElement>(null)
  const bottom = useRef<HTMLDivElement>(null)
  const [v1, v2, v3, v4] = c.videos
  const phone = useMedia('(max-width: 599px)')
  const tablet = useMedia('(min-width: 600px) and (max-width: 900px)')
  const wide = phone ? '4 / 5' : tablet ? '16 / 10' : '21 / 9'

  useSectionReveal(
    top,
    (tl, el) => {
      const q = (s: string) => el.querySelectorAll(s)
      // Section frame 0–350: stable cinematic field, no layout shift
      beat(tl, q('[data-av="frame"]'), { at: [0, 350], dir: 'fade', ease: EASE.soft })
      // Headline / supporting copy 250–800: depth → final plane
      beat(tl, q('[data-av="copy"]'), { at: [250, 800], dir: 'depth', amount: 0.5, stagger: 0.08, ease: EASE.settle })
      // VIDEO 01 350–1100: DEPTH → FOREGROUND
      beat(tl, q('[data-av="v1"]'), { at: [350, 1100], dir: 'depth', amount: 1, ease: EASE.settle })
      beat(tl, q('[data-av="v1-copy"]'), { at: [600, 1200], dir: 'depth', amount: 0.4, stagger: 0.06, ease: EASE.settle })
      // VIDEO 02 550–1250 and VIDEO 03 650–1350: BOTTOM → TOP / depth, staggered
      beat(tl, q('[data-av="v2"]'), { at: [550, 1250], dir: 'bottom', from: { scale: 0.96 }, to: { scale: 1 } })
      beat(tl, q('[data-av="statement"]'), { at: [600, 1300], dir: 'bottom', amount: 0.6, from: { scale: 0.97 }, to: { scale: 1 } })
      beat(tl, q('[data-av="v3"]'), { at: [650, 1350], dir: 'bottom', from: { scale: 0.96 }, to: { scale: 1 } })
      // Process labels 850–1450: LEFT → RIGHT, one editorial system
      beat(tl, q('[data-av="process-line"]'), { at: [850, 1250], dir: 'fade' })
      beat(tl, q('[data-av="process"]'), { at: [850, 1450], dir: 'left', amount: 0.5, stagger: 0.07 })
    },
    { start: 'top 70%' },
  )

  useSectionReveal(bottom, (tl, el) => {
    const q = (s: string) => el.querySelectorAll(s)
    beat(tl, q('[data-av="chapter"]'), { at: [0, 500], dir: 'depth', amount: 0.4, stagger: 0.08, ease: EASE.settle })
    // VIDEO 04 1000–1600: DEPTH → FOREGROUND; final settle 1600–2000 — minimal depth, no bounce
    beat(tl, q('[data-av="v4"]'), { at: [150, 750], dir: 'depth', amount: 1, ease: EASE.settle })
    beat(tl, q('[data-av="v4-copy"]'), { at: [500, 1000], dir: 'bottom', amount: 0.3, stagger: 0.08 })
  })

  const jump = (n: number) => scrollToId(c.videos[(n + 4) % 4].id)

  return (
    <section ref={top} id="ai-video-story" className={styles.section} data-section data-theme="dark" data-nav="work" aria-labelledby="aivideo-heading">
      <div className={styles.inner}>
        <div className={styles.topRow}>
          <SectionLabel data-av="copy">{c.label}</SectionLabel>
        </div>

        {/* ---- VIDEO 01 — first Hero video ------------------------------ */}
        <div id={v1.id} className={styles.heroBox} data-av="v1">
          <MediaSlot
            src={src(v1.role)}
            poster={poster(v1.role)}
            autoplay
            aspect={wide}
            radius={18}
            playSize={80}
            preview={false}
            className={styles.heroMedia}
            alt={`${v1.name} — ${v1.title}. ${v1.sub}`}
            labelledBy="aivideo-heading"
          />
          <span className={styles.heroShade} aria-hidden="true" />
          <Labels lines={c.labelsLeft} className={styles.heroLabelsL} data-av="frame" />
          <Labels lines={c.labelsRight} className={styles.heroLabelsR} align="right" data-av="frame" />
          <h2 id="aivideo-heading" className={`${styles.primary} t-display`} data-av="v1-copy">
            <span>{c.primary[0]}</span>
            <span>{c.primary[1]}</span>
          </h2>
          <p className={`${styles.counter} t-mono`} data-av="frame">
            01 <span className={styles.counterMuted}>/ 04</span>
          </p>
          <div className={styles.heroCue} data-av="frame">
            <ScrollCue tone="light" onClick={() => jump(1)} />
          </div>
          <span className={`${styles.videoTag} t-mono-sm`} data-av="frame">
            {v1.name} · {v1.title} · {mmss(v1.seconds)}
          </span>
        </div>

        {/* ---- supporting message ---------------------------------------- */}
        <p className={`${styles.support} t-headline-light`} data-av="copy">
          {c.support}
        </p>

        {/* ---- VIDEO 02 | statement | VIDEO 03 ---------------------------- */}
        <div className={styles.triple}>
          <figure id={v2.id} className={styles.smallBox} data-av="v2">
            <MediaSlot src={src(v2.role)} poster={poster(v2.role)} autoplay aspect="1 / 1" radius={16} playSize={56} preview={false} alt={`${v2.name} — ${v2.title}. ${v2.sub}`} />
            <figcaption className={styles.smallCap}>
              <span className={styles.smallTitle}>{v2.title}</span>
              <span className={styles.smallSub}>{v2.sub}</span>
              <span className={`${styles.smallTime} t-mono`}>{mmss(v2.seconds)}</span>
            </figcaption>
            <span className={`${styles.videoTag} t-mono-sm`}>{v2.name}</span>
          </figure>

          <div className={styles.statement} data-av="statement">
            <span className={`rule ${styles.statementRule}`} aria-hidden="true" />
            <p className={`${styles.statementText} t-display`}>
              {c.statement.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </p>
            <span className={`${styles.statementBrand} t-mono-sm`}>{brand.name}</span>
          </div>

          <figure id={v3.id} className={styles.smallBox} data-av="v3">
            <MediaSlot src={src(v3.role)} poster={poster(v3.role)} autoplay aspect="1 / 1" radius={16} playSize={56} preview={false} alt={`${v3.name} — ${v3.title}. ${v3.sub}`} />
            <figcaption className={styles.smallCap}>
              <span className={styles.smallTitle}>{v3.title}</span>
              <span className={styles.smallSub}>{v3.sub}</span>
              <span className={`${styles.smallTime} t-mono`}>{mmss(v3.seconds)}</span>
            </figcaption>
            <span className={`${styles.videoTag} t-mono-sm`}>{v3.name}</span>
          </figure>
        </div>

        {/* ---- process --------------------------------------------------- */}
        <ol className={styles.process} aria-label="Process">
          <span className={styles.processLine} data-av="process-line" aria-hidden="true" />
          {c.process.map((p, i) => (
            <li key={p} className={`${styles.processItem} t-label-wide`} data-av="process">
              {i > 0 && <span className={styles.processDot} aria-hidden="true" />}
              {p}
            </li>
          ))}
          <span className={`${styles.processLine} ${styles.processLineBottom}`} data-av="process-line" aria-hidden="true" />
        </ol>

        {/* ---- chapter heading + VIDEO 04 ---------------------------------- */}
        <div ref={bottom} className={styles.bottom}>
          <div className={styles.chapterRow}>
            <h3 className={`${styles.chapter} t-display`} data-av="chapter">
              <span>{c.chapterTitle[0]}</span>
              <span>{c.chapterTitle[1]}</span>
            </h3>
            <p className={styles.chapterSub} data-av="chapter">
              {c.chapterSub}
            </p>
            <div className={styles.chapterNav} data-av="chapter">
              <IconButton tone="outline" size={44} aria-label="Previous video" onClick={() => jump(2)}>
                <ArrowLeft size={16} />
              </IconButton>
              <IconButton tone="outline" size={44} aria-label="Next video" onClick={() => jump(3)}>
                <ArrowRight size={16} />
              </IconButton>
            </div>
          </div>

          <div id={v4.id} className={styles.finalBox} data-av="v4">
            <MediaSlot src={src(v4.role)} poster={poster(v4.role)} autoplay aspect={wide} radius={18} playSize={80} preview={false} alt={`${v4.name} — ${v4.title}. ${v4.sub}`} />
            <span className={styles.finalShade} aria-hidden="true" />
            <Labels lines={[c.bottomLabels[0]]} className={styles.finalLabelL} data-av="v4-copy" />
            <Labels lines={[c.bottomLabels[1]]} className={styles.finalLabelR} rule={false} align="right" data-av="v4-copy" />
            <span className={`${styles.videoTag} t-mono-sm`}>
              {v4.name} · {v4.title} · {mmss(v4.seconds)}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
