import { forwardRef, type CSSProperties } from 'react'
import { brand } from '../../data/content'
import styles from './LogoLockup.module.css'
import { asset } from '../../lib/assets'

/** Mark geometry (from the HD production asset) */
export const MARK_RATIO = 651 / 412

interface Props {
  /** mark height in px — every other dimension of the lockup follows it */
  markHeight?: number
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
 * logo's own artwork, carried as alpha masks so it takes the colour of its surroundings (ink on
 * paper, white over dark chapters). The header and the opening animation share this exact
 * component so the logo that travels *is* the logo that stays.
 */
export const LogoLockup = forwardRef<HTMLDivElement, Props>(function LogoLockup({ markHeight = 50, wordmark = true, className, style, id }, ref) {
  const markW = Math.round(markHeight * MARK_RATIO)
  return (
    <div
      ref={ref}
      id={id}
      className={[styles.lockup, className].filter(Boolean).join(' ')}
      style={
        {
          '--mark-h': `${markHeight}px`,
          '--mark-w': `${markW}px`,
          '--word-a': `url(${asset('/assets/logo/word-aivinci.png')})`,
          '--word-b': `url(${asset('/assets/logo/word-studios.png')})`,
          ...style,
        } as CSSProperties
      }
    >
      <span className={styles.mark} data-lockup-mark aria-hidden="true">
        <img className={styles.piece} src={asset('/assets/logo/mark-tri.png')} alt="" width={651} height={412} data-piece="tri" draggable={false} />
        <img className={styles.piece} src={asset('/assets/logo/mark-slab.png')} alt="" width={651} height={412} data-piece="slab" draggable={false} />
        <img className={styles.piece} src={asset('/assets/logo/mark-sphere.png')} alt="" width={651} height={412} data-piece="sphere" draggable={false} />
      </span>
      {wordmark && (
        <span className={styles.word} data-lockup-word aria-hidden="true">
          <span className={styles.wordA} />
          <span className={styles.wordB} />
        </span>
      )}
      <span className="sr-only">{brand.name}</span>
    </div>
  )
})
