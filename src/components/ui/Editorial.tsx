import type { CSSProperties, ReactNode } from 'react'
import { ArrowDown } from './Icons'
import { cta } from '../../data/content'
import styles from './Editorial.module.css'

/** Stack of short uppercase labels ("IDEAS / PEOPLE / STORIES"). */
export function Labels({
  lines,
  className,
  style,
  rule = true,
  mono = false,
  strong,
  align = 'left',
  ...rest
}: {
  lines: readonly string[]
  className?: string
  style?: CSSProperties
  rule?: boolean
  mono?: boolean
  /** index of a line rendered at full strength (others muted) */
  strong?: number
  align?: 'left' | 'right'
} & Record<`data-${string}`, string | boolean | undefined>) {
  return (
    <div className={[styles.labels, mono ? 't-mono' : 't-label', className].filter(Boolean).join(' ')} style={{ textAlign: align, ...style }} {...rest}>
      {lines.map((l, i) => (
        <span key={i} className={strong !== undefined && i !== strong ? styles.muted : undefined}>
          {l}
        </span>
      ))}
      {rule && <span className={`rule ${styles.rule}`} style={align === 'right' ? { marginLeft: 'auto' } : undefined} />}
    </div>
  )
}

/** "02 / SERVICES" chapter label. */
export function SectionLabel({
  children,
  className,
  line,
  style,
  ...rest
}: { children: ReactNode; className?: string; line?: boolean; style?: CSSProperties } & Record<`data-${string}`, string | boolean | undefined>) {
  return (
    <p className={[styles.sectionLabel, 't-mono', className].filter(Boolean).join(' ')} style={style} {...rest}>
      {line && <span className={styles.sectionLine} aria-hidden="true" />}
      {children}
    </p>
  )
}

/** "+" editorial grid marker */
export function Crosshair({
  style,
  className,
  size = 22,
  ...rest
}: { style?: CSSProperties; className?: string; size?: number } & Record<`data-${string}`, string | boolean | undefined>) {
  return (
    <svg
      className={[styles.cross, className].filter(Boolean).join(' ')}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 22 22"
      aria-hidden="true"
      data-cross
      {...rest}
    >
      <path d="M11 1v20M1 11h20" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

/** Circle-arrow scroll cue with the "SCROLL / TO EXPLORE" label. */
export function ScrollCue({
  onClick,
  className,
  style,
  side = 'right',
  tone = 'dark',
}: {
  onClick?: () => void
  className?: string
  style?: CSSProperties
  side?: 'left' | 'right'
  tone?: 'dark' | 'light'
}) {
  return (
    <button
      type="button"
      className={[styles.cue, side === 'left' ? styles.cueLeft : '', tone === 'light' ? styles.cueLight : '', className].filter(Boolean).join(' ')}
      style={style}
      onClick={onClick}
      aria-label="Scroll to explore"
    >
      <span className={styles.cueRing}>
        <ArrowDown size={16} />
      </span>
      <span className={`${styles.cueText} t-label`}>
        {cta.scrollToExplore[0]}
        <br />
        {cta.scrollToExplore[1]}
      </span>
    </button>
  )
}

/** thin vertical divider */
export function VRule({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span className={[styles.vrule, className].filter(Boolean).join(' ')} style={style} aria-hidden="true" />
}
