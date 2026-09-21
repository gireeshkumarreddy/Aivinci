import { forwardRef, type CSSProperties } from 'react'
import { brand } from '../../data/content'
import styles from './LogoLockup.module.css'
import { asset } from '../../lib/assets'

/** Mark geometry (from the HD production asset) */
export const MARK_RATIO = 651 / 412

export type LockupTone = 'ink' | 'white'

interface Props {
  /** mark height in px — every other dimension of the lockup follows it */
  markHeight?: number
  /** lettering colour: ink over light chapters, white over dark ones */
  tone?: LockupTone
  /** hide the wordmark (mark only) */
  wordmark?: boolean
  className?: string
  style?: CSSProperties
  /** the intro renders the same lockup and moves it into place */
  id?: string
}

/**
 * The Aivinci brand lockup, as supplied by the studio: the metallic mark (three physical
 * pieces) beside the "Aivinci" lettering with CREATIVE STUDIOS underneath. The lettering is the
 * logo's own artwork, shipped as plain images in two colourings (ink / white) so it renders the
 * same in every browser and at every deployment path. The header and the opening animation
 * share this exact component so the logo that travels *is* the logo that stays.
 */
export const LogoLockup = forwardRef<HTMLDivElement, Props>(function LogoLockup(
  { markHeight = 50, tone = 'ink', wordmark = true, className, style, id },
  ref,
) {
  const markW = Math.round(markHeight * MARK_RATIO)
  return (
    <div
      ref={ref}
      id={id}
      className={[styles.lockup, className].filter(Boolean).join(' ')}
      data-tone={tone}
      style={{ '--mark-h': `${markHeight}px`, '--mark-w': `${markW}px`, ...style } as CSSProperties}
    >
      <span className={styles.mark} data-lockup-mark aria-hidden="true">
        <img className={styles.piece} src={asset('/assets/logo/mark-tri.png')} alt="" width={651} height={412} data-piece="tri" draggable={false} />
        <img className={styles.piece} src={asset('/assets/logo/mark-slab.png')} alt="" width={651} height={412} data-piece="slab" draggable={false} />
        <img className={styles.piece} src={asset('/assets/logo/mark-sphere.png')} alt="" width={651} height={412} data-piece="sphere" draggable={false} />
      </span>
      {wordmark && (
        <span className={styles.word} data-lockup-word aria-hidden="true">
          <span className={styles.wordA}>
            <img src={asset('/assets/logo/word-aivinci-ink.png')} width={595} height={125} alt="" draggable={false} data-tone="ink" />
            <img src={asset('/assets/logo/word-aivinci-white.png')} width={595} height={125} alt="" draggable={false} data-tone="white" />
          </span>
          <span className={styles.wordB}>
            <img src={asset('/assets/logo/word-studios-ink.png')} width={545} height={33} alt="" draggable={false} data-tone="ink" />
            <img src={asset('/assets/logo/word-studios-white.png')} width={545} height={33} alt="" draggable={false} data-tone="white" />
          </span>
        </span>
      )}
      <span className="sr-only">{brand.name}</span>
    </div>
  )
})
