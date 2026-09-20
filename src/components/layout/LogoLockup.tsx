import { forwardRef, type CSSProperties } from 'react'
import { brand } from '../../data/content'
import styles from './LogoLockup.module.css'
import { asset } from '../../lib/assets'

/** Mark geometry (from the HD production asset) */
export const MARK_RATIO = 651 / 412

interface Props {
  /** mark height in px */
  markHeight?: number
  /** show the letter-spaced tagline under the wordmark */
  tagline?: boolean
  /** hide the wordmark (mark only) */
  wordmark?: boolean
  /** "Creative Studio" on its own line under "Aivinci" (compact header widths) */
  stacked?: boolean
  className?: string
  style?: CSSProperties
  /** the intro renders the same lockup and moves it into place */
  id?: string
}

/**
 * The Aivinci brand lockup: the metallic mark (three physical pieces) beside the
 * wordmark. The header and the opening animation share this exact component so
 * the logo that travels *is* the logo that stays.
 */
export const LogoLockup = forwardRef<HTMLDivElement, Props>(function LogoLockup(
  { markHeight = 50, tagline = true, wordmark = true, stacked = false, className, style, id },
  ref,
) {
  const markW = Math.round(markHeight * MARK_RATIO)
  return (
    <div
      ref={ref}
      id={id}
      className={[styles.lockup, className].filter(Boolean).join(' ')}
      style={{ '--mark-h': `${markHeight}px`, '--mark-w': `${markW}px`, ...style } as CSSProperties}
    >
      <span className={styles.mark} data-lockup-mark aria-hidden="true">
        <img className={styles.piece} src={asset('/assets/logo/mark-tri.png')} alt="" width={651} height={412} data-piece="tri" draggable={false} />
        <img className={styles.piece} src={asset('/assets/logo/mark-slab.png')} alt="" width={651} height={412} data-piece="slab" draggable={false} />
        <img className={styles.piece} src={asset('/assets/logo/mark-sphere.png')} alt="" width={651} height={412} data-piece="sphere" draggable={false} />
      </span>
      {wordmark && (
        <span className={styles.word} data-lockup-word>
          <span className={[styles.name, stacked ? styles.stacked : ''].filter(Boolean).join(' ')}>
            <span className={styles.nameA}>{brand.nameA}</span> <span className={styles.nameB}>{brand.nameB}</span>
          </span>
          {tagline && (
            <span className={styles.tagline} data-lockup-tagline>
              {brand.tagline.map((t, i) => (
                <span key={t}>
                  {i > 0 && <span className={styles.dot}>·</span>}
                  {t}
                </span>
              ))}
            </span>
          )}
        </span>
      )}
      <span className="sr-only">{brand.name}</span>
    </div>
  )
})
