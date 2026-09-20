import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

const base = (size: number, p: P) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
  ...p,
})

export const ArrowUpRight = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M7 17 17 7" />
    <path d="M9 7h8v8" />
  </svg>
)

export const ArrowRight = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M4 12h15" />
    <path d="m13 6 6 6-6 6" />
  </svg>
)

export const ArrowLeft = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M20 12H5" />
    <path d="m11 6-6 6 6 6" />
  </svg>
)

export const ArrowDown = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M12 4v15" />
    <path d="m6 13 6 6 6-6" />
  </svg>
)

export const Play = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)} fill="currentColor" stroke="none">
    <path d="M8 5.5v13l10-6.5z" />
  </svg>
)

export const Search = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={2}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.3-4.3" />
  </svg>
)

export const Plus = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
)

export const Close = ({ size = 18, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="m6 6 12 12" />
    <path d="m18 6-12 12" />
  </svg>
)

export const Menu = ({ size = 20, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M4 8h16" />
    <path d="M4 16h16" />
  </svg>
)

export const Disc = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={1.6}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
  </svg>
)

export const YouTube = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={1.6}>
    <rect x="2.75" y="5.75" width="18.5" height="12.5" rx="3.6" />
    <path d="M10.2 9.3v5.4l4.6-2.7z" fill="currentColor" stroke="none" />
  </svg>
)

export const Instagram = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={1.6}>
    <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="4.8" />
    <circle cx="12" cy="12" r="3.9" />
    <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
  </svg>
)

export const Threads = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={1.6}>
    <path d="M18.4 8.3c-1.1-2.9-3.4-4.4-6.3-4.4C7.9 3.9 5.2 6.9 5.2 12s2.7 8.1 6.9 8.1c3.6 0 6.2-2 6.2-5 0-2.3-1.6-3.8-4.1-3.8-2.5 0-4.1 1.2-4.1 2.9 0 1.3 1.2 2.2 3 2.2 2.3 0 3.4-1.6 3.4-4.6 0-2.9-1.1-4.7-3.4-4.7-1.5 0-2.6.7-3.2 1.9" />
  </svg>
)

export const Facebook = ({ size = 16, ...p }: P) => (
  <svg {...base(size, p)} strokeWidth={1.6}>
    <path d="M14.4 20.5v-7.3h2.5l.4-3h-2.9V8.4c0-.9.3-1.5 1.6-1.5h1.5V4.2c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2h-2.6v3h2.6v7.3" />
  </svg>
)

export const Rings = ({ size = 40, ...p }: P) => (
  <svg {...base(size, p)} viewBox="0 0 48 24" strokeWidth={1.2}>
    <circle cx="16" cy="12" r="10" />
    <circle cx="32" cy="12" r="10" />
  </svg>
)
