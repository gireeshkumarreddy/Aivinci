import { forwardRef, type ButtonHTMLAttributes, type AnchorHTMLAttributes, type ReactNode } from 'react'
import styles from './Button.module.css'

type Variant = 'solid' | 'inverse' | 'outline' | 'ghost' | 'text'
type Size = 'sm' | 'md' | 'lg'

interface Common {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  iconLeft?: ReactNode
  className?: string
  children: ReactNode
}

type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }
type AnchorProps = Common & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

function cls(variant: Variant, size: Size, className?: string) {
  return [styles.btn, styles[variant], styles[size], className].filter(Boolean).join(' ')
}

/** Pill button — the single button primitive used across the site. */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps | AnchorProps>(function Button(
  { variant = 'solid', size = 'md', icon, iconLeft, className, children, ...rest },
  ref,
) {
  const inner = (
    <>
      {iconLeft && <span className={styles.iconLeft}>{iconLeft}</span>}
      <span className={styles.label}>{children}</span>
      {icon && <span className={styles.icon}>{icon}</span>}
    </>
  )
  if ('href' in rest && rest.href !== undefined) {
    return (
      <a ref={ref as never} className={cls(variant, size, className)} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {inner}
      </a>
    )
  }
  return (
    <button ref={ref as never} type="button" className={cls(variant, size, className)} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {inner}
    </button>
  )
})

/** Circular icon button (the arrows on cards, scroll cues, players). */
export function IconButton({
  children,
  className,
  tone = 'dark',
  size = 44,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'dark' | 'light' | 'outline' | 'glass'; size?: number; children: ReactNode }) {
  return (
    <button
      type="button"
      className={[styles.iconBtn, styles[`tone-${tone}`], className].filter(Boolean).join(' ')}
      style={{ width: size, height: size }}
      {...rest}
    >
      {children}
    </button>
  )
}
