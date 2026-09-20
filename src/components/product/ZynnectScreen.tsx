import { ArrowRight, Menu } from '../ui/Icons'
import { products } from '../../data/content'
import styles from './ZynnectScreen.module.css'

/**
 * Zynnect — live product UI rendered as real HTML on the phone screen.
 * Copy is the approved product content; modules are named after the four
 * approved capabilities. No invented market data.
 */
export function ZynnectScreen({ onExplore }: { onExplore?: () => void }) {
  const p = products.product
  return (
    <div className={styles.screen} aria-label={`${p.name} — ${p.category}`}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.orb} aria-hidden="true" />
      <div className={styles.body}>
      <header className={styles.top}>
        <span className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true" />
          {p.name}
        </span>
        <span className={styles.menu} aria-hidden="true">
          <Menu size={14} />
        </span>
      </header>

      <div className={styles.hero}>
        <p className={styles.eyebrow}>{p.category}</p>
        <h4 className={styles.headline}>
          {p.uiText.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </h4>
        <p className={styles.sub}>{p.uiSub}</p>
      </div>

      <div className={styles.module} aria-hidden="true">
        <div className={styles.moduleHead}>
          <span>{p.features[1].name}</span>
          <span className={styles.live}>
            <i /> AI
          </span>
        </div>
        <svg className={styles.chart} viewBox="0 0 200 64" preserveAspectRatio="none">
          <defs>
            <linearGradient id="zy-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#7fb2ff" stopOpacity="0.35" />
              <stop offset="1" stopColor="#7fb2ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 50 C 20 46, 30 40, 45 42 S 70 30, 85 32 S 110 20, 125 24 S 150 14, 165 12 S 190 8, 200 6 V64 H0 Z" fill="url(#zy-fill)" />
          <path d="M0 50 C 20 46, 30 40, 45 42 S 70 30, 85 32 S 110 20, 125 24 S 150 14, 165 12 S 190 8, 200 6" fill="none" stroke="#9cc2ff" strokeWidth="1.6" data-zy-line pathLength={1} />
        </svg>
        <div className={styles.chips}>
          {[p.features[0], p.features[2], p.features[3]].map((f) => (
            <span key={f.n} className={styles.chip}>
              {f.name}
            </span>
          ))}
        </div>
      </div>

      <button type="button" className={styles.cta} onClick={onExplore} tabIndex={-1} aria-hidden="true">
        Explore {p.name}
        <ArrowRight size={12} />
      </button>
      <span className={styles.homeBar} aria-hidden="true" />
      </div>
    </div>
  )
}
