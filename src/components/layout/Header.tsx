import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LogoLockup } from './LogoLockup'
import { Button } from '../ui/Button'
import { ArrowUpRight, Close, Menu, Search } from '../ui/Icons'
import { brand, cta, nav } from '../../data/content'
import { EASE, beat, gsap, scrollToId, useMedia, useReducedMotion } from '../../lib/motion'
import styles from './Header.module.css'

interface Props {
  /** the opening animation has locked the logo into place (3500 ms) */
  locked: boolean
  /** the homepage handoff happened — the header sequence may run (4000 ms) */
  ready: boolean
}

const SEARCH_INDEX: { id: string; title: string; hint: string }[] = [
  { id: 'home', title: 'Home', hint: 'We create what’s next' },
  { id: 'services', title: 'Services', hint: 'AI filmmaking, brand, social, creative technology, digital experiences, product development, VFX, audio' },
  { id: 'approach', title: 'Our Approach', hint: 'Human creativity. Intelligent technology. Discover, create, build, refine' },
  { id: 'work', title: 'Work', hint: 'The Next You, Beyond Limits, Urban Pulse, Living Spaces' },
  { id: 'ai-video-story', title: 'AI Video Story', hint: 'Idea → prompt → frame → motion → story' },
  { id: 'products', title: 'Products', hint: 'Zynnect — AI-powered stock research platform' },
  { id: 'product-system', title: 'Product System', hint: 'Stock screening, market intelligence, stock research, AI-assisted analysis' },
  { id: 'contact', title: 'Contact', hint: 'Have an idea? Let’s build it' },
]

export function Header({ locked, ready }: Props) {
  const root = useRef<HTMLElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const indicator = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState<string>('home')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchInput = useRef<HTMLInputElement>(null)
  const isMobile = useMedia('(max-width: 900px)')
  const isNarrowDesktop = useMedia('(max-width: 1180px)')
  const reduced = useReducedMotion()

  // ---- 01 / GLOBAL HEADER sequence (relative to the header's own clock) ----
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    if (!ready) {
      gsap.set(el.querySelectorAll('[data-hdr]'), { opacity: 0 })
      return
    }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: EASE.cine } })
      // Logo 0–350: already positioned from the intro — no second fly-in.
      beat(tl, el.querySelector('[data-hdr="nav"]'), { at: [250, 700], dir: 'fade' })
      beat(tl, el.querySelectorAll('[data-hdr="nav"] a'), { at: [250, 700], dir: 'bottom', amount: 0.25, stagger: 0.05 })
      beat(tl, el.querySelector('[data-hdr="nav-pill"]'), { at: [250, 700], dir: 'fade' })
      beat(tl, el.querySelectorAll('[data-hdr="control"]'), { at: [350, 800], dir: 'right', amount: 0.5, stagger: 0.06 })
      beat(tl, el.querySelector('[data-hdr="cta"]'), { at: [450, 850], dir: 'right', amount: 0.6 })
      if (reduced) tl.progress(1)
    }, el)
    return () => ctx.revert()
  }, [ready, reduced, isMobile])

  // ---- active section + header theme (which chapter sits under the header) ----
  useEffect(() => {
    let timer = 0
    const update = () => {
      timer = 0
      const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'))
      const probe = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 88) * 0.6
      // the deepest / last matching region wins (chapters can carry light sub-areas)
      let current: HTMLElement | null = null
      for (const s of sections) {
        const r = s.getBoundingClientRect()
        if (r.top <= probe && r.bottom > probe) current = s
      }
      if (current) {
        setTheme(current.dataset.theme === 'dark' ? 'dark' : 'light')
        setActive(current.dataset.nav || current.id)
      }
    }
    // a timer (not rAF) so the header stays correct even while the tab is in the background
    const onScroll = () => {
      if (!timer) timer = window.setTimeout(update, 50)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  // ---- sliding active pill ----
  useEffect(() => {
    const n = navRef.current
    const ind = indicator.current
    if (!n || !ind) return
    const link = n.querySelector<HTMLElement>(`[data-nav-id="${active}"]`)
    if (!link) return
    const place = () => {
      const nr = n.getBoundingClientRect()
      const lr = link.getBoundingClientRect()
      gsap.to(ind, { x: lr.left - nr.left, width: lr.width, duration: reduced ? 0 : 0.55, ease: EASE.cine, overwrite: true })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [active, reduced, ready])

  // ---- body lock for overlays ----
  useEffect(() => {
    document.body.classList.toggle('is-locked', menuOpen || searchOpen)
    if (searchOpen) window.setTimeout(() => searchInput.current?.focus(), 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen, searchOpen])

  const go = (id: string) => {
    setMenuOpen(false)
    setSearchOpen(false)
    scrollToId(id)
  }

  const results = SEARCH_INDEX.filter((r) => {
    const q = query.trim().toLowerCase()
    return !q || r.title.toLowerCase().includes(q) || r.hint.toLowerCase().includes(q)
  })

  return (
    <header
      ref={root}
      className={styles.header}
      data-theme={theme}
      data-locked={locked ? 'true' : 'false'}
      data-ready={ready ? 'true' : 'false'}
      data-menu={menuOpen ? 'open' : 'closed'}
    >
      <div className={styles.inner}>
        <a
          href="#home"
          className={styles.brand}
          data-header-brand
          onClick={(e) => {
            e.preventDefault()
            go('home')
          }}
          aria-label={`${brand.name} — home`}
        >
          <LogoLockup markHeight={isMobile ? 34 : isNarrowDesktop ? 42 : 50} tagline={!isMobile} />
        </a>

        <nav ref={navRef} className={styles.nav} data-hdr="nav" aria-label="Primary">
          <span className={styles.navPill} data-hdr="nav-pill" aria-hidden="true" />
          <span ref={indicator} className={styles.indicator} aria-hidden="true" />
          {nav.map((n) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              data-nav-id={n.id}
              className={styles.link}
              aria-current={active === n.id ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault()
                go(n.id)
              }}
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className={styles.controls}>
          <button type="button" className={styles.search} data-hdr="control" aria-label="Search the site" onClick={() => setSearchOpen(true)}>
            <Search size={18} />
          </button>
          <span className={styles.divider} data-hdr="control" aria-hidden="true" />
          <span data-hdr="cta" className={styles.ctaWrap}>
            <Button size={isMobile ? 'sm' : 'md'} icon={<ArrowUpRight size={15} />} onClick={() => go('contact')}>
              {cta.startProject}
            </Button>
          </span>
          <button
            type="button"
            className={styles.menuBtn}
            data-hdr="control"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <Close size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* overlays are portaled to <body>: the header's backdrop-filter would otherwise
          become the containing block of these fixed layers */}
      {createPortal(
        <>
      {/* ---- mobile menu ------------------------------------------------ */}
      <div id="mobile-menu" className={styles.menu} data-open={menuOpen ? 'true' : 'false'} aria-hidden={!menuOpen} inert={!menuOpen}>
        <nav className={styles.menuNav} aria-label="Mobile">
          {nav.map((n, i) => (
            <a
              key={n.id}
              href={`#${n.id}`}
              className={styles.menuLink}
              style={{ transitionDelay: menuOpen ? `${80 + i * 45}ms` : '0ms' }}
              aria-current={active === n.id ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault()
                go(n.id)
              }}
            >
              <span className="t-mono">0{i + 1}</span>
              <span>{n.label}</span>
            </a>
          ))}
        </nav>
        <div className={styles.menuFoot}>
          <Button variant="inverse" size="lg" icon={<ArrowUpRight size={16} />} onClick={() => go('contact')}>
            {cta.startProject}
          </Button>
          <p className={`${styles.menuTag} t-label-wide`}>{brand.tagline.join('  ·  ')}</p>
        </div>
      </div>

      {/* ---- search ------------------------------------------------------ */}
      <div className={styles.searchLayer} data-open={searchOpen ? 'true' : 'false'} aria-hidden={!searchOpen} inert={!searchOpen} role="dialog" aria-label="Search">
        <button type="button" className={styles.searchBackdrop} aria-label="Close search" onClick={() => setSearchOpen(false)} />
        <div className={styles.searchPanel}>
          <div className={styles.searchRow}>
            <Search size={18} />
            <input
              ref={searchInput}
              className={styles.searchInput}
              type="search"
              placeholder="Search Aivinci — services, work, products…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results[0]) go(results[0].id)
              }}
              aria-label="Search"
            />
            <button type="button" className={styles.searchClose} onClick={() => setSearchOpen(false)} aria-label="Close search">
              <Close size={18} />
            </button>
          </div>
          <ul className={styles.results} role="listbox">
            {results.map((r) => (
              <li key={r.id}>
                <button type="button" className={styles.result} onClick={() => go(r.id)} role="option" aria-selected={false}>
                  <span className={styles.resultTitle}>{r.title}</span>
                  <span className={`${styles.resultHint} t-mono-sm`}>{r.hint}</span>
                </button>
              </li>
            ))}
            {!results.length && <li className={`${styles.noResult} t-mono`}>No matching chapter</li>}
          </ul>
        </div>
      </div>
        </>,
        document.body,
      )}
    </header>
  )
}
