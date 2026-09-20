/**
 * Projective mapping of a w×h rectangle onto an arbitrary quad, expressed as a
 * CSS matrix3d(). Used to seat the live product UI on the photographed phone screen.
 */
export type Pt = [number, number]

function solve(A: number[][], b: number[]): number[] {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let c = 0; c < n; c++) {
    let p = c
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    ;[M[c], M[p]] = [M[p], M[c]]
    const d = M[c][c] || 1e-9
    for (let k = c; k <= n; k++) M[c][k] /= d
    for (let r = 0; r < n; r++) {
      if (r === c) continue
      const f = M[r][c]
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]
    }
  }
  return M.map((row) => row[n])
}

/** Homography h (3×3, row-major, h[8]=1) taking (0,0),(w,0),(w,h),(0,h) to the given quad. */
export function quadHomography(w: number, h: number, quad: [Pt, Pt, Pt, Pt]): number[] {
  const src: Pt[] = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ]
  const A: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i]
    const [u, v] = quad[i]
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y])
    b.push(u)
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y])
    b.push(v)
  }
  const s = solve(A, b)
  return [...s, 1]
}

/** CSS matrix3d string for a homography (2D projective in the x/y plane). */
export function matrix3dFromHomography(H: number[]): string {
  const [a, b, c, d, e, f, g, h, i] = H
  // column-major 4x4: x' = a x + b y + c ; y' = d x + e y + f ; w' = g x + h y + i
  const m = [a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, c, f, 0, i]
  return `matrix3d(${m.map((v) => (Math.abs(v) < 1e-9 ? 0 : +v.toFixed(6))).join(',')})`
}
