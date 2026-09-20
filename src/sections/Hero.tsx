import { useEffect, useLayoutEffect, useRef } from 'react'
import { Button } from '../components/ui/Button'
import { ArrowDown, ArrowUpRight, Disc, Play } from '../components/ui/Icons'
import { Handwriting, handwritingBeat } from '../components/ui/Handwriting'
import { MediaSlot } from '../components/ui/MediaSlot'
import { cta, hero } from '../data/content'
import { EASE, beat, gsap, scrollToId, useMedia, useReducedMotion } from '../lib/motion'
import styles from './Hero.module.css'
import { asset } from '../lib/assets'

interface Props {
  /** the intro handed off — the cinematic hero may begin */
  start: boolean
}

/** 02 / HOMEPAGE — the main cinematic hero. */
export function Hero({ start }: Props) {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const isMobile = useMedia('(max-width: 1023px)')

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    if (!start) {
      gsap.set(el.querySelectorAll('[data-hero]'), { opacity: 0 })
      return
    }
    const ctx = gsap.context(() => {
      const q = (s: string) => el.querySelectorAll(s)
      const tl = gsap.timeline({ defaults: { ease: EASE.cine } })
      // Hero background 0–500: depth / canvas establishes
      beat(tl, q('[data-hero="canvas"]'), { at: [0, 500], dir: 'fade', ease: EASE.soft })
      // Main character 650–1600: BACKGROUND → FOREGROUND
      beat(tl, q('[data-hero="character"]'), { at: [650, 1600], dir: 'depth', amount: 1.4, from: { y: 36 }, to: { y: 0 }, ease: EASE.settle })
      // Character lighting 850–1750: rim light resolves
      beat(tl, q('[data-hero="rim"]'), { at: [850, 1750], dir: 'fade', ease: EASE.soft })
      // Left content 850–1500: LEFT → RIGHT as one group
      beat(tl, q('[data-hero="left"]'), { at: [850, 1500], dir: 'left' })
      beat(tl, q('[data-hero="left"] > *'), { at: [850, 1500], dir: 'left', amount: 0.35, stagger: 0.045 })
      // View Work box 950–1550: LEFT → RIGHT, whole box together
      beat(tl, q('[data-hero="stats"]'), { at: [950, 1550], dir: 'left' })
      // CTA row 1050–1600: LEFT → RIGHT
      beat(tl, q('[data-hero="ctas"]'), { at: [1050, 1600], dir: 'left' })
      // Right controls 900–1550: RIGHT → LEFT
      beat(tl, q('[data-hero="right"]'), { at: [900, 1550], dir: 'right', stagger: 0.09 })
      // Handwriting 1250–2050: stroke draw → text reveal
      const hand = el.querySelector('[data-hero="hand"]')
      if (hand) {
        tl.set(hand, { opacity: 1 }, 1.25)
        handwritingBeat(tl, hand, [1250, 2050])
      }
      // Hero settle 2000–2400: depth settles, no bounce
      tl.fromTo(q('[data-hero="character"]'), { y: 3 }, { y: 0, duration: 0.4, ease: EASE.settle }, 2.0)
      beat(tl, q('[data-hero="vignette"]'), { at: [2000, 2400], dir: 'fade', ease: EASE.soft })
      // Lens light 1900–2300: the glass catches the light — a soft specular settles on the lenses
      beat(tl, q('[data-hero="glint"]'), { at: [1900, 2300], dir: 'fade', ease: EASE.soft })
      if (reduced) tl.progress(1)
    }, el)
    return () => ctx.revert()
  }, [start, reduced, isMobile])

  // The flash on his specs: a bright streak sweeps across the lenses (masked to the glass) — once
  // as the hero settles, then every few seconds while the hero is on screen. Never with reduced motion.
  useEffect(() => {
    const el = root.current
    if (!el || !start || reduced) return
    const streaks = el.querySelectorAll('[data-hero="streak"]')
    if (!streaks.length) return
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 4.6, paused: true, delay: 2.35 })
    tl.fromTo(streaks, { xPercent: -130, opacity: 0 }, { xPercent: 130, opacity: 1, duration: 0.9, ease: 'power3.inOut' })
    tl.to(streaks, { opacity: 0, duration: 0.25, ease: 'power1.out' }, 0.72)
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.pause()), { threshold: 0.2 })
    io.observe(el)
    return () => {
      io.disconnect()
      tl.kill()
    }
  }, [start, reduced, isMobile])

  const handwriting = (
    <div className={styles.hand} data-hero="hand">
      <Handwriting lines={hero.handwriting} underline rotate={-7} />
    </div>
  )

  const character = (
    <figure className={styles.character} data-hero="character">
      {/* the photograph's own box (contain-fitted), so the lens light sits exactly on the glass */}
      <div className={styles.figureBox}>
        <img
          className={styles.person}
          src={isMobile ? asset('/assets/hero/person-sm.png') : asset('/assets/hero/person.png')}
          width={671}
          height={766}
          alt="Aivinci — creative director looking over his shoulder"
          fetchPriority="high"
          decoding="async"
          draggable={false}
        />
        <img className={styles.rim} src={asset('/assets/hero/person-rim.png')} width={671} height={766} alt="" aria-hidden="true" data-hero="rim" draggable={false} />
        <span className={styles.glint} aria-hidden="true" data-hero="glint">
          <span className={`${styles.shine} ${styles.shineNear}`} />
          <span className={`${styles.shine} ${styles.shineFar}`} />
          <span className={styles.streak} data-hero="streak" />
        </span>
      </div>
    </figure>
  )

  return (
    <section ref={root} id="home" className={styles.hero} data-section data-theme="light" aria-label="Aivinci Studios — We create what’s next">
      <div className={styles.canvas} data-hero="canvas" aria-hidden="true" />
      <div className={styles.vignette} data-hero="vignette" aria-hidden="true" />

      <div className={styles.stage}>
        {/* ---- main character: emerges from depth ---------------------- */}
        {!isMobile && character}

        {/* ---- left system --------------------------------------------- */}
        <div className={styles.left} data-hero="left">
          <p className={`${styles.label} t-label`}>{hero.label}</p>
          <h1 className={`${styles.headline} t-display`}>
            <span className={styles.h1a}>{hero.headline[0]}</span>
            <span className={styles.h1b}>
              {hero.headline[1].slice(0, -1)}
              <span className={styles.period}>.</span>
            </span>
          </h1>
          <span className={`rule rule--long ${styles.rule}`} aria-hidden="true" />
          <p className={`${styles.body} t-body`}>{hero.body}</p>
        </div>

        <div className={styles.ctas} data-hero="ctas">
          <Button size={isMobile ? 'md' : 'lg'} iconLeft={<span className={styles.playDot}><Play size={10} /></span>} onClick={() => scrollToId('ai-video-story')}>
            {cta.watchStory}
          </Button>
          <Button variant="text" size={isMobile ? 'md' : 'lg'} icon={<ArrowDown size={16} />} onClick={() => scrollToId('services')}>
            {cta.explore}
          </Button>
        </div>

        {isMobile && (
          <>
            <div className={styles.mobileFigure}>
              {character}
              {handwriting}
            </div>
            <div className={styles.mobileRow}>
              <span className={styles.pill} data-hero="right">
                <Disc size={22} />
                <span>
                  {hero.creativeTech[0]}
                  <br />
                  {hero.creativeTech[1]}
                </span>
              </span>
              <p className={styles.available} data-hero="right">
                {hero.availability[0]}
                <br />
                <span className={styles.dot} /> {hero.availability[1]}
              </p>
            </div>
          </>
        )}

        {/* ---- stats / view work box ------------------------------------ */}
        <div className={styles.stats} data-hero="stats">
          <div className={styles.statDark}>
            <p className={styles.statValue}>{hero.stats[0].value}</p>
            <p className={styles.statLabel}>{hero.stats[0].label}</p>
            <ul className={`${styles.disciplines} t-mono-sm`} aria-label="Disciplines">
              {hero.disciplines.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
            <Button variant="inverse" size="sm" icon={<ArrowUpRight size={13} />} className={styles.viewWork} onClick={() => scrollToId('work')}>
              {cta.viewWork}
            </Button>
          </div>
          <div className={styles.statPhoto}>
            <img src={asset('/assets/hero/stat-portrait.jpg')} width={149} height={182} alt="" loading="lazy" decoding="async" draggable={false} />
            <span className={styles.statArrow} aria-hidden="true">
              <ArrowUpRight size={16} />
            </span>
            <p className={styles.statValue}>{hero.stats[1].value}</p>
            <p className={styles.statLabel}>{hero.stats[1].label}</p>
          </div>
        </div>

        {/* ---- right system ---------------------------------------------- */}
        {!isMobile && (
          <>
            {handwriting}
            <span className={styles.pill} data-hero="right">
              <Disc size={24} />
              <span>
                {hero.creativeTech[0]}
                <br />
                {hero.creativeTech[1]}
              </span>
            </span>
            <p className={styles.available} data-hero="right">
              {hero.availability[0]}
              <br />
              <span className={styles.dot} /> {hero.availability[1]}
            </p>
          </>
        )}

        <div className={styles.featured} data-hero="right">
          <p className={`${styles.featLabel} t-body`}>{hero.featured.label}</p>
          <div className={styles.featHead}>
            <p className={styles.featTitle}>{hero.featured.title}</p>
            <span className={styles.year}>{hero.featured.year}</span>
          </div>
          <p className={`${styles.featType} t-body`}>{hero.featured.type}</p>
          <MediaSlot
            poster={asset('/assets/hero/featured-poster.jpg')}
            aspect="322 / 168"
            radius={8}
            playSize={54}
            playPos={{ x: '59%', y: '54%' }}
            className={styles.featMedia}
            onActivate={() => scrollToId('work')}
            alt="The Next You — AI Film"
            eager
          >
            <span className={styles.progress} aria-hidden="true">
              <span />
            </span>
          </MediaSlot>
        </div>
      </div>
    </section>
  )
}
