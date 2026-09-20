import type { CSSProperties } from 'react'
import styles from './Handwriting.module.css'

type Props = {
  lines: string[]
  className?: string
  style?: CSSProperties
  /** show the double underline flourish used in the hero */
  underline?: boolean
  size?: string
  align?: 'left' | 'center' | 'right'
  rotate?: number
} & Record<`data-${string}`, string | boolean | undefined>

/**
 * Real, selectable handwritten copy (Caveat) that is *written* on screen: each
 * line is revealed by a soft-edged mask travelling along the writing direction
 * at a hand-like pace, with a pen tip leading the ink.
 */
export function Handwriting({ lines, className, style, underline, size, align = 'left', rotate, ...rest }: Props) {
  return (
    <div
      className={[styles.hand, 't-hand', className].filter(Boolean).join(' ')}
      style={{ fontSize: size, textAlign: align, transform: rotate ? `rotate(${rotate}deg)` : undefined, ...style }}
      data-handwriting
      {...rest}
    >
      {lines.map((l, i) => (
        <span key={i} className={styles.line} data-hand-line>
          <span className={styles.ink}>{l}</span>
          <span className={styles.pen} aria-hidden="true" />
        </span>
      ))}
      {underline && (
        <svg className={styles.underline} viewBox="0 0 120 22" data-hand-underline aria-hidden="true">
          <path d="M4 8c30-4 60-5 112-3" pathLength={1} />
          <path d="M14 17c26-4 52-5 96-4" pathLength={1} />
        </svg>
      )}
    </div>
  )
}

/**
 * Sequence the writing of every line inside [start, end] ms on a timeline.
 * Speed is proportional to line length, so long lines take longer — like a hand.
 */
export function handwritingBeat(tl: gsap.core.Timeline, root: Element, at: [number, number]) {
  const lines = Array.from(root.querySelectorAll<HTMLElement>('[data-hand-line]'))
  const underline = root.querySelector<SVGSVGElement>('[data-hand-underline]')
  if (!lines.length) return
  const [s, e] = at
  const total = lines.reduce((a, l) => a + Math.max(l.textContent?.length ?? 1, 4), 0)
  const underlineShare = underline ? 0.16 : 0
  let cursor = s
  const span = (e - s) * (1 - underlineShare)
  lines.forEach((line) => {
    const len = Math.max(line.textContent?.length ?? 1, 4)
    const dur = (span * len) / total
    tl.fromTo(line, { '--p': '-6%' }, { '--p': '108%', duration: dur / 1000, ease: 'power1.inOut' }, cursor / 1000)
    cursor += dur
  })
  if (underline) {
    const paths = underline.querySelectorAll('path')
    tl.fromTo(paths, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: ((e - s) * underlineShare) / 1000, ease: 'power2.out', stagger: 0.05 }, cursor / 1000)
  }
}
