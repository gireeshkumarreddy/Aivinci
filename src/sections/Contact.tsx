import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button, IconButton } from '../components/ui/Button'
import { Crosshair, Labels, SectionLabel } from '../components/ui/Editorial'
import { ArrowRight, Facebook, Instagram, Plus, Threads, YouTube } from '../components/ui/Icons'
import { Handwriting, handwritingBeat } from '../components/ui/Handwriting'
import { brand, contact as c, cta } from '../data/content'
import { EASE, beat, gsap, isTouchDevice, useReducedMotion, useSectionReveal } from '../lib/motion'
import styles from './Contact.module.css'
import { asset } from '../lib/assets'

/** the scene's perspective (Contact.module.css) and the screen's resting depth behind the editorial plane */
const PERSPECTIVE = 1800
const SCREEN_REST_Z = -40

const SOCIAL_ICON = { youtube: YouTube, instagram: Instagram, threads: Threads, facebook: Facebook } as const

const CROSSES: [number, number][] = [
  [1.6, 2.6], [29.1, 2.6], [70.9, 2.6], [98.4, 2.6], [20.7, 24.6], [49.9, 24.6], [86.3, 24.6],
  [1.6, 55.3], [20.7, 55.3], [29.1, 55.3], [49.9, 55.3], [98.4, 55.3], [20.7, 84.2], [79.2, 99.2], [98.4, 99.2],
]

function Field({ label, name, type = 'text', as = 'input', options, required }: { label: string; name: string; type?: string; as?: 'input' | 'select' | 'textarea'; options?: readonly string[]; required?: boolean }) {
  const id = `contact-${name}`
  return (
    <label className={styles.field} htmlFor={id}>
      <span className={`${styles.fieldLabel} t-mono-sm`}>{label}</span>
      {as === 'select' ? (
        <select id={id} name={name} className={styles.input} defaultValue="" required={required}>
          <option value="" disabled>
            Select
          </option>
          {options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : as === 'textarea' ? (
        <textarea id={id} name={name} className={`${styles.input} ${styles.textarea}`} rows={2} required={required} />
      ) : (
        <input id={id} name={name} type={type} className={styles.input} required={required} autoComplete={name === 'email' ? 'email' : name === 'name' ? 'name' : name === 'company' ? 'organization' : 'off'} />
      )}
    </label>
  )
}

/** 10 / CONTACT / REALITY — a cinematic physical installation, not a footer. */
export function Contact() {
  const root = useRef<HTMLElement>(null)
  const screen = useRef<HTMLDivElement>(null)
  const scene = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [sent, setSent] = useState<null | 'ok'>(null)

  useSectionReveal(
    root,
    (tl, el) => {
      const q = (s: string) => el.querySelectorAll(s)
      // Dark / neutral field 0–400: cinematic field establishes (never a flat footer)
      beat(tl, q('[data-ct="grid"]'), { at: [0, 400], dir: 'fade', ease: EASE.soft })
      // 3D screen 300–900: DEPTH → FOREGROUND, a physical object with depth; the screen lights up.
      // It settles a little behind the editorial plane (compensated by scale, so it reads at
      // 1:1): the plane keeps tilting gently later, and must never cut through REALITY, the
      // labels or the audience in front of it.
      tl.fromTo(
        q('[data-ct="screen"]'),
        { z: -520, scale: 0.88, opacity: 0, filter: 'brightness(0.15) blur(10px)' },
        { z: SCREEN_REST_Z, scale: PERSPECTIVE / (PERSPECTIVE + SCREEN_REST_Z), opacity: 1, filter: 'brightness(1) blur(0px)', duration: 0.6, ease: EASE.settle },
        0.3,
      )
      // Screen movement 700–1400: low-amplitude object movement
      tl.fromTo(q('[data-ct="screen"]'), { rotationY: 1.2, rotationX: 0.6 }, { rotationY: 0, rotationX: 0, duration: 0.7, ease: 'sine.inOut' }, 0.7)
      // People / viewing scene 900–1550: BACKGROUND → FOREGROUND, slow reveal
      beat(tl, q('[data-ct="people"]'), { at: [900, 1550], dir: 'depth', amount: 1.1, from: { y: 26 }, to: { y: 0 }, ease: EASE.settle })
      // Reality reveal 1200–1800: focus / depth transition — entering a real space (the word
      // settles on the tracking its layout defines, desktop or mobile)
      q('[data-ct="reality"]').forEach((r) => {
        const spacing = parseFloat(getComputedStyle(r).letterSpacing) || 0
        tl.fromTo(r, { opacity: 0, letterSpacing: `${spacing * 1.65}px`, filter: 'blur(6px)' }, { opacity: 1, letterSpacing: `${spacing}px`, filter: 'blur(0px)', duration: 0.6, ease: EASE.settle, clearProps: 'letterSpacing' }, 1.2)
      })
      beat(tl, q('[data-ct="vignette"]'), { at: [1200, 1800], dir: 'fade', from: { opacity: 1 }, to: { opacity: 0.35 }, ease: EASE.soft })
      beat(tl, q('[data-ct="mark"]'), { at: [1300, 1800], dir: 'fade', stagger: 0.02, ease: EASE.soft })
      // Contact content 1500–2050: normal fade / settle — text stays secondary
      beat(tl, q('[data-ct="copy"]'), { at: [1500, 2050], dir: 'fade', stagger: 0.04, ease: EASE.soft })
      // the studio's channels close the footer: a short rise, one after the other
      beat(tl, q('[data-ct="social"]'), { at: [1750, 2250], dir: 'bottom', amount: 0.3, stagger: 0.06, ease: EASE.soft })
      const hand = el.querySelector('[data-ct="hand"]')
      if (hand) handwritingBeat(tl, hand, [1600, 2300])
    },
    { start: 'top 68%' },
  )

  // Final state 2050 ms+: minimal living depth — slow float, pointer parallax on desktop, paused off-screen
  useEffect(() => {
    const sc = screen.current
    const sn = scene.current
    if (!sc || !sn || reduced) return
    const tl = gsap.timeline({ repeat: -1, yoyo: true, paused: true, delay: 2.05 })
    tl.to(sc, { rotationY: 0.6, rotationX: -0.35, y: -3, duration: 6, ease: 'sine.inOut' })
    tl.to(sc, { rotationY: -0.5, rotationX: 0.3, y: 3, duration: 6, ease: 'sine.inOut' })
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? tl.play() : tl.pause()), { threshold: 0.15 })
    io.observe(sn)
    let raf = 0
    const layers = Array.from(sn.querySelectorAll<HTMLElement>('[data-depth]'))
    const tos = layers.map((l) => ({
      d: parseFloat(l.dataset.depth ?? '0.5'),
      x: gsap.quickTo(l, 'x', { duration: 1.2, ease: 'power3.out' }),
      y: gsap.quickTo(l, 'y', { duration: 1.2, ease: 'power3.out' }),
    }))
    const onMove = (e: PointerEvent) => {
      if (isTouchDevice()) return
      const r = sn.getBoundingClientRect()
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2
      const ny = ((e.clientY - r.top) / r.height - 0.5) * 2
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0
          tos.forEach((t) => {
            t.x(nx * 14 * t.d)
            t.y(ny * 8 * t.d)
          })
        })
    }
    sn.addEventListener('pointermove', onMove)
    return () => {
      io.disconnect()
      tl.kill()
      sn.removeEventListener('pointermove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduced])

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    // mailto is the only honest transport without a backend: it composes the message in the visitor's mail client
    const lines = ['name', 'company', 'email', 'projectType', 'message', 'budget'].map((k) => `${k}: ${String(data.get(k) ?? '')}`)
    const href = `mailto:${brand.email}?subject=${encodeURIComponent('Start a project — ' + String(data.get('name') ?? ''))}&body=${encodeURIComponent(lines.join('\n'))}`
    window.location.href = href
    setSent('ok')
  }

  return (
    <section ref={root} id="contact" className={styles.section} data-section data-theme="dark" data-nav="contact" aria-labelledby="contact-heading">
      <div ref={scene} className={styles.scene}>
        <div className={styles.stage}>
          {/* ---- the installation: a floating screen and the people watching it ---- */}
          <div className={styles.installation}>
          <div className={styles.screenWrap}>
            <div ref={screen} className={styles.screen} data-ct="screen" data-depth="0.35">
              <picture>
                <source media="(max-width: 767px)" srcSet={asset('/assets/contact/environment-sm.jpg')} />
                <img src={asset('/assets/contact/environment-base.jpg')} width={1672} height={941} alt="An immersive curved screen showing a mountain lake at dawn" loading="lazy" decoding="async" draggable={false} />
              </picture>
              <span className={styles.screenGlow} aria-hidden="true" />
            </div>
          </div>
          <div className={styles.people} data-ct="people" data-depth="0.9">
            <picture>
              <source type="image/webp" srcSet={asset('/assets/contact/foreground.webp')} />
              <img src={asset('/assets/contact/foreground.png')} width={1039} height={478} alt="A small audience watching the screen from cinema seats" loading="lazy" decoding="async" draggable={false} />
            </picture>
          </div>
          <span className={styles.vignette} data-ct="vignette" aria-hidden="true" />

          <div className={styles.grid} data-ct="grid" aria-hidden="true">
            {CROSSES.map(([x, y], i) => (
              <Crosshair key={i} className={styles.cross} style={{ left: `${x}%`, top: `${y}%` }} size={20} data-ct="mark" />
            ))}
          </div>

          {/* ---- editorial layer ------------------------------------------ */}
          <Labels lines={c.labelsLeft} className={styles.labelsLeft} data-ct="copy" />
          <div className={styles.hand} data-ct="copy">
            <Handwriting lines={c.handwriting} align="center" rotate={-4} size="clamp(20px, 1.9vw, 30px)" data-ct="hand" />
          </div>
          <Labels lines={c.labelsTopA} className={styles.labelsTopA} data-ct="copy" />
          <Labels lines={c.labelsTopB} className={styles.labelsTopB} data-ct="copy" />

          <p className={styles.reality} data-ct="reality" aria-hidden="true">
            {c.reality}
          </p>
          <p className={`${styles.beyond} t-label`} data-ct="copy">
            <span className={styles.beyondLine} aria-hidden="true" />
            <span>
              A brighter
              <br />
              tomorrow
            </span>
          </p>
          </div>

          {/* ---- contact --------------------------------------------------- */}
          <div className={styles.contact}>
            <SectionLabel data-ct="copy">{c.label}</SectionLabel>
            <h2 id="contact-heading" className={`${styles.heading} t-headline-light`} data-ct="copy">
              <span>{c.heading[0]}</span>
              <span>{c.heading[1]}</span>
            </h2>
            <p className={styles.description} data-ct="copy">
              {c.description}
            </p>
            <form className={styles.form} onSubmit={onSubmit} data-ct="copy" aria-label="Start the conversation">
              <div className={styles.row2}>
                <Field label={c.form.name} name="name" required />
                <Field label={c.form.company} name="company" />
              </div>
              <div className={styles.row2}>
                <Field label={c.form.email} name="email" type="email" required />
                <Field label={c.form.projectType} name="projectType" as="select" options={c.form.projectTypes} />
              </div>
              <Field label={c.form.message} name="message" as="textarea" required />
              <Field label={c.form.budget} name="budget" />
              <div className={styles.formFoot}>
                <Button type="submit" variant="inverse" size="lg" icon={<ArrowRight size={16} />}>
                  {cta.startConversation}
                </Button>
                <a className={`${styles.email} t-mono`} href={`mailto:${brand.email}`}>
                  {brand.email}
                </a>
              </div>
              <p className={`${styles.sent} t-mono-sm`} role="status" aria-live="polite">
                {sent ? 'Your mail app should now be open with the message ready to send.' : ''}
              </p>
            </form>
          </div>

          <div className={styles.together} data-ct="copy">
            <IconButton tone="light" size={56} aria-label="Back to the top" onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })}>
              <Plus size={20} />
            </IconButton>
            <Labels lines={c.together} rule={false} />
          </div>

          {/* ---- footer row --------------------------------------------- */}
          <div className={`${styles.foot} t-label`} data-ct="copy">
            <span className={styles.footLeft}>
              {c.footer.left[0]}
              <br />
              {c.footer.left[1]}
            </span>
            <span className={styles.footLine} aria-hidden="true" />
            <span className={styles.footCenter}>{c.footer.center.join('   /   ')}</span>
            <span className={styles.footLine} aria-hidden="true" />
            <span className={styles.footRight}>{c.footer.right.join('  ·  ')}</span>
            <nav className={styles.social} aria-label={`${brand.name} on social media`}>
              {brand.social.map((s) => {
                const Icon = SOCIAL_ICON[s.id]
                return (
                  <a key={s.id} className={styles.socialLink} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`${brand.name} on ${s.label}`} title={s.label} data-ct="social">
                    <Icon size={16} />
                  </a>
                )
              })}
            </nav>
          </div>
        </div>
      </div>
    </section>
  )
}
