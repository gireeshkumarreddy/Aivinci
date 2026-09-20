import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Play } from './Icons'
import { useReducedMotion } from '../../lib/motion'
import styles from './MediaSlot.module.css'

export interface VideoSource {
  /** rendition for narrow viewports */
  mobile: string
  desktop: string
  /** optional higher rendition (1440p) for large / high-density screens */
  large?: string
}

export interface MediaSlotProps {
  /** still frame shown before/without playback */
  poster?: string
  /** real production video (when present the slot is a live video element) */
  src?: VideoSource
  /** muted, looping, inline autoplay driven by viewport visibility */
  autoplay?: boolean
  /** css aspect ratio, e.g. "16 / 9" */
  aspect?: string
  /** rounded corner radius */
  radius?: number | string
  /** small mono tag in the corner (shown only on a live video) */
  tag?: string
  /** decorative number/caption slots */
  children?: ReactNode
  /** show the round play control */
  playControl?: boolean
  playSize?: number
  /** where the play control sits (defaults to the centre) */
  playPos?: { x: string; y: string }
  /** hover/tap preview motion on the poster (subtle scale drift) */
  preview?: boolean
  /** called on activation when there is nothing to play (e.g. open a case study) */
  onActivate?: () => void
  className?: string
  style?: CSSProperties
  alt?: string
  /** object-position of the poster/video */
  focus?: string
  /** loading priority for the poster */
  eager?: boolean
  /** id for aria labelling */
  labelledBy?: string
}

const isNarrow = () => typeof window !== 'undefined' && window.innerWidth < 900
/** a large or high-density desktop screen that is not asking to save data */
const wantsLarge = () => {
  if (typeof window === 'undefined') return false
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
  if (nav.connection?.saveData) return false
  return window.innerWidth >= 1200 && window.innerWidth * window.devicePixelRatio >= 2200
}

/**
 * Video-ready media container. Reserves its dimensions, lazy-loads real
 * footage, and stays an honest placeholder when production video is pending.
 */
export function MediaSlot({
  poster,
  src,
  autoplay,
  aspect = '16 / 9',
  radius = 6,
  tag,
  children,
  playControl = true,
  playSize = 44,
  playPos,
  preview = true,
  onActivate,
  className,
  style,
  alt = '',
  focus = 'center',
  eager,
  labelledBy,
}: MediaSlotProps) {
  const root = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [visible, setVisible] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const reduced = useReducedMotion()
  const hasVideo = !!src

  // lazy attach + viewport-driven playback
  useEffect(() => {
    const el = root.current
    if (!el || !hasVideo) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) setVisible(true)
          const v = videoRef.current
          if (!v || !autoplay) return
          if (en.intersectionRatio > 0.15) {
            v.play().catch(() => {})
          } else {
            v.pause()
          }
        })
      },
      { threshold: [0, 0.15, 0.5], rootMargin: '200px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasVideo, autoplay])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const on = () => setPlaying(true)
    const off = () => setPlaying(false)
    v.addEventListener('playing', on)
    v.addEventListener('pause', off)
    v.addEventListener('ended', off)
    return () => {
      v.removeEventListener('playing', on)
      v.removeEventListener('pause', off)
      v.removeEventListener('ended', off)
    }
  }, [visible])

  const activate = () => {
    if (hasVideo) {
      const v = videoRef.current
      if (!v) return
      if (v.paused) v.play().catch(() => {})
      else if (!autoplay) v.pause()
      return
    }
    if (onActivate) {
      onActivate()
      return
    }
    // an image with nothing to open: a short preview drift on tap
    setPreviewing(true)
    window.setTimeout(() => setPreviewing(false), 2400)
  }
  // without footage the slot is an image: no player affordance, no tag
  const showPlay = hasVideo && playControl && !(playing && autoplay)

  const videoSrc = src ? (isNarrow() ? src.mobile : src.large && wantsLarge() ? src.large : src.desktop) : undefined

  return (
    <div
      ref={root}
      className={[styles.slot, preview && !reduced ? styles.preview : '', previewing ? styles.previewing : '', playing ? styles.playing : '', className]
        .filter(Boolean)
        .join(' ')}
      style={{ aspectRatio: aspect, borderRadius: radius, ...style }}
      data-video={hasVideo ? 'live' : 'image'}
    >
      {poster ? (
        <img
          className={styles.poster}
          src={poster}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          style={{ objectPosition: focus }}
          draggable={false}
        />
      ) : (
        <div className={styles.slate} aria-hidden="true">
          <span className={styles.slateGrid} />
        </div>
      )}
      {hasVideo && visible && (
        <video
          ref={videoRef}
          className={styles.video}
          src={videoSrc}
          poster={poster}
          muted
          loop={autoplay}
          playsInline
          autoPlay={autoplay}
          preload="metadata"
          style={{ objectPosition: focus }}
          aria-labelledby={labelledBy}
        />
      )}
      {showPlay && (
        <button
          type="button"
          className={styles.play}
          data-play
          style={{ width: playSize, height: playSize, left: playPos?.x, top: playPos?.y }}
          onClick={activate}
          aria-label={playing ? 'Pause video' : 'Play video'}
        >
          <Play size={Math.round(playSize * 0.42)} />
        </button>
      )}
      {!hasVideo && onActivate && <button type="button" className={styles.hit} onClick={activate} aria-label="Open" />}
      {hasVideo && !playControl && <button type="button" className={styles.hit} onClick={activate} aria-label={playing ? 'Pause video' : 'Play video'} />}
      {hasVideo && tag && <span className={`${styles.tag} t-mono-sm`}>{tag}</span>}
      {children}
    </div>
  )
}
