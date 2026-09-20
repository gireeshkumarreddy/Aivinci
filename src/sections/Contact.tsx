import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button, IconButton } from '../components/ui/Button'
import { Crosshair, Labels, SectionLabel } from '../components/ui/Editorial'
import { ArrowRight, Plus } from '../components/ui/Icons'
import { Handwriting, handwritingBeat } from '../components/ui/Handwriting'
import { brand, contact as c, cta } from '../data/content'
import { EASE, beat, gsap, isTouchDevice, useReducedMotion, useSectionReveal } from '../lib/motion'
import styles from './Contact.module.css'
import { asset } from '../lib/assets'

/** the scene's perspective (Contact.module.css) and the screen's resting depth behind the editorial plane */
const PERSPECTIVE = 1800
const SCREEN_REST_Z = -40

const CROSSES: [number, number][] = [
  [1.6, 2.6], [29.1, 2.6], [70.9, 2.6], [98.4, 2.6], [20.7, 24.6], [49.9, 24.6], [86.3, 24.6],
  [1.6, 55.3], [20.7, 55.3], [29.1, 55.3], [49.9, 55.3], [98.4, 55.3], [20.7, 84.2], [79.2, 99.2], [98.4, 99.2],
]

function Field({
  n,
  label,
  name,
  type = 'text',
  as = 'input',
  options,
  required,
  hint,
}: {
  n: string
  label: string
  name: string
  type?: string
  as?: 'input' | 'select' | 'textarea'
  options?: readonly string[]
  required?: boolean
  hint?: string
}) {
  const id = `contact-${name}`
  return (
    <label className={styles.field} htmlFor={id}>
      <span className={`${styles.fieldLabel} t-mono-sm`}>
        <span className={styles.fieldNum}>{n}</span>
        {label}
        {hint && <span className={styles.fieldHint}> — {hint}</span>}
      </span>
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
        <input
          id={id}
          name={name}
          type={type}
          className={styles.input}
          required={required}
          inputMode={type === 'tel' ? 'tel' : undefined}
          autoComplete={name === 'email' ? 'email' : name === 'name' ? 'name' : name === 'company' ? 'organization' : name === 'phone' ? 'tel' : 'off'}
        />
      )}
    </label>
  )
}

/** "What do you need?" — pill checkboxes, as in the client's reference */
function Needs({ n, label, options }: { n: string; label: string; options: readonly string[] }) {
  return (
    <fieldset className={styles.needs}>
      <legend className={`${styles.fieldLabel} t-mono-sm`}>
        <span className={styles.fieldNum}>{n}</span>
        {label}
      </legend>
      <div className={styles.pills}>
        {options.map((o) => (
          <label key={o} className={styles.pill}>
            <input type="checkbox" name="needs" value={o} className={styles.pillInput} />
            <span className={styles.pillBox} aria-hidden="true" />
            <span className={styles.pillText}>{o}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/** 10 / CONTACT / REALITY — a cinematic physical installation, not a footer. */
export function Contact() {
  const root = useRef<HTMLElement>(null)
  const screen = useRef<HTMLDivElement>(null)
  const scene = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'fallback' | 'failed'>('idle')
  const openedAt = useRef(0)
  useEffect(() => {
    openedAt.current = Date.now()
  }, [])

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

  /** the enquiry goes to the studio's mailbox through api/contact.php (PHP on the host); should the
   *  endpoint be unavailable, the visitor's mail app opens with the message composed instead */
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    data.set('ts', String(openedAt.current))
    const lines = ['name', 'company', 'email', 'phone', 'budget'].map((k) => `${k}: ${String(data.get(k) ?? '')}`)
    lines.push(`needs: ${data.getAll('needs').map(String).join(', ')}`)
    lines.push(`message: ${String(data.get('message') ?? '')}`)
    const mailto = `mailto:${brand.email}?subject=${encodeURIComponent('Start a project — ' + String(data.get('name') ?? ''))}&body=${encodeURIComponent(lines.join('\n'))}`
    setStatus('sending')
    try {
      const res = await fetch(asset('/api/contact.php'), { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      const json = (await res.json().catch(() => null)) as { ok?: boolean } | null
      if (res.ok && json?.ok) {
        setStatus('sent')
        form.reset()
        openedAt.current = Date.now()
        return
      }
      if (res.status === 429 || res.status === 422) {
        setStatus('failed')
        return
      }
    } catch {
      /* no endpoint (static preview) — fall through to the mail app */
    }
    window.location.href = mailto
    setStatus('fallback')
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
              {/* honeypot: hidden from people, filled only by bots */}
              <div className={styles.trap} aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>
              <div className={styles.row2}>
                <Field n="01" label={c.form.name} name="name" required />
                <Field n="02" label={c.form.company} name="company" />
              </div>
              <div className={styles.row2}>
                <Field n="03" label={c.form.email} name="email" type="email" required />
                <Field n="04" label={c.form.phone} name="phone" type="tel" hint={c.form.optional} />
              </div>
              <Field n="05" label={c.form.budget} name="budget" as="select" options={c.form.budgets} hint={c.form.budgetHint} />
              <Needs n="06" label={c.form.needs} options={c.form.needOptions} />
              <Field n="07" label={c.form.message} name="message" as="textarea" required />
              <div className={styles.formFoot}>
                <Button type="submit" variant="inverse" size="lg" icon={<ArrowRight size={16} />} disabled={status === 'sending'}>
                  {status === 'sending' ? c.form.sending : cta.startConversation}
                </Button>
                <a className={`${styles.email} t-mono`} href={`mailto:${brand.email}`}>
                  {brand.email}
                </a>
              </div>
              <p className={`${styles.sent} t-mono-sm`} role="status" aria-live="polite" data-status={status}>
                {status === 'sent' && c.form.sent}
                {status === 'fallback' && c.form.fallback}
                {status === 'failed' && (
                  <>
                    {c.form.failed}{' '}
                    <a href={`mailto:${brand.email}`}>{brand.email}</a>
                  </>
                )}
              </p>
            </form>
          </div>

          <div className={styles.together} data-ct="copy">
            <IconButton tone="light" size={56} aria-label="Back to the top" onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })}>
              <Plus size={20} />
            </IconButton>
            <Labels lines={c.together} rule={false} />
          </div>

        </div>
      </div>
    </section>
  )
}
