/**
 * URL of a file in /public that honours Vite's `base`, so the site works when deployed at the
 * domain root ("/") and when it is served from a sub-path (built with `vite build --base=/sub/`).
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

export const asset = (path: string) => `${BASE}/${path.replace(/^\//, '')}`
