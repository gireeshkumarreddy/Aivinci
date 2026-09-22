import { forwardRef, type CSSProperties } from 'react'
import { brand } from '../../data/content'
import styles from './LogoLockup.module.css'
import { asset } from '../../lib/assets'

/** The logo artwork's own proportions (width / height of the cut-out lockup). */
export const LOCKUP_RATIO = 1144 / 382

export type LockupTone = 'ink' | 'white'

interface Props {
  /** lockup height in px — the artwork keeps its own proportions */
  height?: number
  /** CREATIVE STUDIOS in ink (light chapters) or white (dark ones); the mark and the metal never change */
  tone?: LockupTone
  className?: string
  style?: CSSProperties
  /** the intro renders the same lockup and moves it into place */
  id?: string
  /** load immediately (the header and the opening animation) */
  eager?: boolean
}

/**
 * The Aivinci logo, exactly as the studio supplied it: the red mark, the metallic "ivinci"
 * lettering and the CREATIVE STUDIOS line are one piece of artwork, never sliced. The header,
 * the opening animation and the footer all render this same component, so the logo that travels
 * during the intro *is* the logo that stays in the header.
 */
export const LogoLockup = forwardRef<HTMLDivElement, Props>(function LogoLockup(
  { height = 56, tone = 'ink', className, style, id, eager }: Props,
  ref,
) {
  const width = Math.round(height * LOCKUP_RATIO)
  return (
    <div
      ref={ref}
      id={id}
      className={[styles.lockup, className].filter(Boolean).join(' ')}
      data-tone={tone}
      data-lockup
      style={{ '--lockup-h': `${height}px`, '--lockup-w': `${width}px`, ...style } as CSSProperties}
    >
      <img
        className={styles.art}
        src={asset(tone === 'white' ? '/assets/logo/lockup-white.png' : '/assets/logo/lockup.png')}
        width={1144}
        height={382}
        alt={brand.name}
        draggable={false}
        decoding="async"
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
      />
    </div>
  )
})
