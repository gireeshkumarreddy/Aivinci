import { useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react'
import { matrix3dFromHomography, quadHomography, type Pt } from '../../lib/homography'
import { usePointerTilt } from '../../lib/motion'
import { ZynnectScreen } from './ZynnectScreen'
import styles from './PhoneInHand.module.css'
import { asset } from '../../lib/assets'

/** Geometry of the photographed hand/phone block (px, from the asset pipeline). */
export const HAND = {
  w: 530,
  h: 586,
  bandTop: 41,
  screen: [
    [156, 34],
    [388, 26],
    [342, 539],
    [107, 519],
  ] as [Pt, Pt, Pt, Pt],
}
const UI_W = 232
const UI_H = 513

/**
 * The physical product interaction: the photographed hand holds a photographed
 * device; the live Zynnect UI is seated on the screen through a projective map,
 * and the lit finger rims are re-composited above it so the grip stays real.
 * Layers are separate so the device can rise into the hand.
 */
export function PhoneInHand({ className, onExplore }: { className?: string; onExplore?: () => void }) {
  const outer = useRef<HTMLDivElement>(null)
  const matrix = useMemo(() => matrix3dFromHomography(quadHomography(UI_W, UI_H, HAND.screen)), [])
  usePointerTilt(outer, { maxTilt: 2.5, maxShift: 6, perspective: 1600, layers: '[data-depth]' })

  // fallback scale for browsers without CSS trig/container units: measured synchronously
  // before the first paint, then kept in step with every resize
  useLayoutEffect(() => {
    const el = outer.current
    if (!el) return
    const fit = () => el.style.setProperty('--s', String(el.clientWidth / HAND.w))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    window.addEventListener('resize', fit)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', fit)
    }
  }, [])

  return (
    <div
      ref={outer}
      className={[styles.outer, className].filter(Boolean).join(' ')}
      style={{ aspectRatio: `${HAND.w} / ${HAND.h}`, '--native-w': `${HAND.w}px` } as CSSProperties}
    >
      <div className={styles.box} style={{ width: HAND.w, height: HAND.h }}>
        {/* device (raster bezel + glass) with the live screen seated on it */}
        <div className={styles.phone} data-ph="phone" data-depth="0.6">
          <picture>
            <source type="image/webp" srcSet={asset('/assets/products/phone.webp')} />
            <img src={asset('/assets/products/phone.png')} width={HAND.w} height={HAND.h} alt="" draggable={false} loading="lazy" decoding="async" />
          </picture>
          <div className={styles.screen} style={{ width: UI_W, height: UI_H, transform: matrix }}>
            <ZynnectScreen onExplore={onExplore} />
          </div>
          <span className={styles.glass} aria-hidden="true" style={{ width: UI_W, height: UI_H, transform: matrix }} />
        </div>
        {/* the hand, with the lit finger rims that overlap the device edge */}
        <div className={styles.hand} data-ph="hand" data-depth="1">
          <picture>
            <source type="image/webp" srcSet={asset('/assets/products/hand.webp')} />
            <img src={asset('/assets/products/hand.png')} width={HAND.w} height={HAND.h} alt="A hand holding a phone running Zynnect" draggable={false} loading="lazy" decoding="async" />
          </picture>
          <picture className={styles.fingers}>
            <source type="image/webp" srcSet={asset('/assets/products/fingers.webp')} />
            <img src={asset('/assets/products/fingers.png')} width={HAND.w} height={HAND.h} alt="" draggable={false} loading="lazy" decoding="async" />
          </picture>
        </div>
      </div>
    </div>
  )
}
