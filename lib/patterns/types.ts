// Core types for the parametric pattern engine (all units in cm)

export interface Measurements {
  cintura: number       // waist circumference
  quadril: number       // hip circumference
  busto?: number        // bust circumference
  comprimento: number   // garment length
  altura?: number       // total body height
  mangas?: number       // sleeve length
}

// 2D point
export type Pt = { x: number; y: number }

// SVG-style path command
export type PathCmd =
  | { t: 'M'; x: number; y: number }
  | { t: 'L'; x: number; y: number }
  | { t: 'Q'; cx: number; cy: number; x: number; y: number }
  | { t: 'Z' }

export interface DartInfo {
  leg1: Pt   // left dart leg on seam
  tip: Pt    // dart apex
  leg2: Pt   // right dart leg on seam
  label?: string
}

export interface Notch {
  pt: Pt
  angle: number  // degrees, perpendicular to edge
}

export interface PatternPiece {
  id: string
  name: string
  cutInfo: string      // e.g. "Cortar 2x espelhado"
  onFold: boolean      // true = left edge on fabric fold
  // All paths in cm, origin = top-left of bounding box
  cutPath: PathCmd[]   // cut line (includes seam allowances)
  seamPath: PathCmd[]  // seam line (actual stitch line)
  darts: DartInfo[]
  notches: Notch[]
  grainLine: [Pt, Pt]
  foldEdge?: [Pt, Pt]  // position of fold line (left edge)
  bbox: { x: number; y: number; w: number; h: number }  // bounding box of cut path
}

export interface PatternData {
  garment: string
  sizeName: string
  measurements: Measurements
  seamAllowance: number
  hemAllowance: number
  pieces: PatternPiece[]
}

// Helpers
export function pt(x: number, y: number): Pt { return { x, y } }

export function pathToSVG(cmds: PathCmd[], scale = 1): string {
  return cmds.map(c => {
    if (c.t === 'M') return `M ${(c.x * scale).toFixed(2)},${(c.y * scale).toFixed(2)}`
    if (c.t === 'L') return `L ${(c.x * scale).toFixed(2)},${(c.y * scale).toFixed(2)}`
    if (c.t === 'Q') return `Q ${(c.cx * scale).toFixed(2)},${(c.cy * scale).toFixed(2)} ${(c.x * scale).toFixed(2)},${(c.y * scale).toFixed(2)}`
    return 'Z'
  }).join(' ')
}

export function bboxOfPath(cmds: PathCmd[]): { x: number; y: number; w: number; h: number } {
  const xs: number[] = [], ys: number[] = []
  cmds.forEach(c => {
    if (c.t === 'Z') return
    xs.push(c.x); ys.push(c.y)
    if (c.t === 'Q') { xs.push(c.cx); ys.push(c.cy) }
  })
  const minX = Math.min(...xs), minY = Math.min(...ys)
  return { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY }
}
