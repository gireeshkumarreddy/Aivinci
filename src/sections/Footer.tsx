import { useRef } from 'react'
import { LogoLockup } from '../components/layout/LogoLockup'
import { Button } from '../components/ui/Button'
import { ArrowUpRight, Facebook, Instagram, Threads, YouTube } from '../components/ui/Icons'
import { brand, cta, footer as c, nav } from '../data/content'
import { EASE, beat, scrollToId, useSectionReveal } from '../lib/motion'
import styles from './Footer.module.css'

const SOCIAL_ICON = { youtube: YouTube, instagram: Instagram, threads: Threads, facebook: Facebook } as const

/** The site footer: brand, the chapters, the ways to reach the studio, the channels. */
export function Footer() {
  const root = useRef<HTMLElement>(null)

  useSectionReveal(
    root,
    (tl, el) => {
      const q = (s: string) => el.querySelectorAll(s)
      beat(tl, q('[data-ft="col"]'), { at: [0, 600], dir: 'bottom', amount: 0.4, stagger: 0.08, ease: EASE.settle })
      beat(tl, q('[data-ft="social"]'), { at: [350, 800], dir: 'bottom', amount: 0.3, stagger: 0.06, ease: EASE.soft })
      beat(tl, q('[data-ft="legal"]'), { at: [500, 900], dir: 'fade', ease: EASE.soft })
    },
    { start: 'top 92%' },
  )

  return (
    <footer ref={root} id="footer" className={styles.footer} data-section data-theme="dark" data-nav="contact" aria-label="Site footer">
      <div className={styles.inner}>
        <div className={styles.brandCol} data-ft="col">
          <a
            href="#home"
            className={styles.brand}
            onClick={(e) => {
              e.preventDefault()
              scrollToId('home')
            }}
            aria-label={`${brand.name} — back to the top`}
          >
            <LogoLockup height={54} tone="white" />
          </a>
          <p className={`${styles.statement} t-headline-light`}>
            <span>{c.statement[0]}</span>
            <span>{c.statement[1]}</span>
          </p>
          <p className={`${styles.keywords} t-mono`}>{c.keywords.join('   /   ')}</p>
        </div>

        <nav className={styles.col} data-ft="col" aria-label="Footer">
          <h2 className={`${styles.colTitle} t-mono`}>{c.navTitle}</h2>
          <ul className={styles.links}>
            {nav.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  className={styles.link}
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToId(n.id)
                  }}
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.col} data-ft="col">
          <h2 className={`${styles.colTitle} t-mono`}>{c.contactTitle}</h2>
          <ul className={styles.links}>
            <li>
              <a className={styles.link} href={`mailto:${brand.email}`}>
                {brand.email}
              </a>
            </li>
            {brand.phone && (
              <li>
                <a className={styles.link} href={`tel:${brand.phone.replace(/[^+\d]/g, '')}`}>
                  {brand.phone}
                </a>
              </li>
            )}
          </ul>
          <Button variant="inverse" size="sm" icon={<ArrowUpRight size={14} />} className={styles.cta} onClick={() => scrollToId('contact')}>
            {cta.startProject}
          </Button>
        </div>

        <div className={styles.col} data-ft="col">
          <h2 className={`${styles.colTitle} t-mono`}>{c.followTitle}</h2>
          <ul className={styles.social} aria-label={`${brand.name} on social media`}>
            {brand.social.map((s) => {
              const Icon = SOCIAL_ICON[s.id]
              return (
                <li key={s.id}>
                  <a className={styles.socialLink} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${brand.name} on ${s.label}`} title={s.label} data-ft="social">
                    <Icon size={16} />
                    <span className={styles.socialName}>{s.label}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className={`${styles.legal} t-mono-sm`} data-ft="legal">
        <span>{c.legal}</span>
        <span className={styles.legalRight}>{brand.tagline.join('  ·  ')}</span>
      </div>
    </footer>
  )
}
