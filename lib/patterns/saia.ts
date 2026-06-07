// Parametric Straight Skirt (Saia Reta)
// Based on Brazilian industrial pattern drafting (Modelagem Industrial Brasileira)

import { type Measurements, type PatternData, type PatternPiece, type PathCmd, type DartInfo, bboxOfPath, pt } from './types'

const SA  = 1.5  // side seam allowance (cm)
const WA  = 1.5  // waist allowance
const HA  = 4.0  // hem allowance
const HR  = 20   // hip rise (waist to fullest hip point)

function buildFrontPiece(C: number, Q: number, L: number): PatternPiece {
  // Quarter widths with ease
  const fw = C / 4 + 1.0   // front waist width (per quarter + ease)
  const fh = Q / 4 + 2.0   // front hip width (per quarter + ease)

  // Dart: takes up the excess between waist and hip
  const rawDart = fh - fw
  const dart_w = Math.min(Math.max(rawDart, 0.5), 2.5)  // clamp 0.5–2.5cm
  const dart_x = fw * 0.42   // 42% from CF
  const dart_d = 12           // dart depth

  // ── Seam line (stitch line) ──────────────────────────────────
  // Starts at CF/waist, goes clockwise
  const seamPath: PathCmd[] = [
    { t: 'M', x: 0,                    y: 0 },
    // waistline: CF → dart left leg
    { t: 'L', x: dart_x - dart_w / 2,  y: 0 },
    // dart
    { t: 'L', x: dart_x,               y: dart_d },
    { t: 'L', x: dart_x + dart_w / 2,  y: 0 },
    // continue waistline → side seam
    { t: 'L', x: fw,                    y: 0 },
    // side seam: curved from waist to hip (quadratic bezier)
    { t: 'Q', cx: fh, cy: HR * 0.5,    x: fh, y: HR },
    // hip to hem: straight
    { t: 'L', x: fh,                    y: L },
    // hemline: back to CF
    { t: 'L', x: 0,                     y: L },
    { t: 'Z' },
  ]

  // ── Cut line (outer boundary with all allowances) ─────────────
  const cutPath: PathCmd[] = [
    { t: 'M', x: 0,           y: -WA },           // top-left  (CF + waist SA)
    { t: 'L', x: fw + SA,     y: -WA },            // top-right (waist SA + side SA)
    { t: 'Q', cx: fh + SA,    cy: HR * 0.5,        x: fh + SA, y: HR },  // side seam + SA
    { t: 'L', x: fh + SA,     y: L },              // side seam at hem
    { t: 'L', x: fh + SA,     y: L + HA },         // hem allowance corner
    { t: 'L', x: 0,           y: L + HA },         // hem allowance at CF fold
    { t: 'Z' },
  ]

  const darts: DartInfo[] = [{
    leg1: pt(dart_x - dart_w / 2, 0),
    tip:  pt(dart_x,               dart_d),
    leg2: pt(dart_x + dart_w / 2, 0),
    label: `${dart_w.toFixed(1)}cm`,
  }]

  const bbox = bboxOfPath(cutPath)
  // Adjust bbox to start at 0,0 by offsetting (cut line starts at x=0, y=-WA)
  const normBbox = { x: 0, y: 0, w: bbox.w, h: bbox.h }

  return {
    id: 'frente',
    name: 'Frente',
    cutInfo: 'Cortar 1x no dobro (dobrar ao longo do fio)',
    onFold: true,
    cutPath,
    seamPath,
    darts,
    notches: [
      { pt: pt(fh, HR), angle: 0 },      // notch at hip level on side seam
    ],
    grainLine: [pt(fw * 0.15, L * 0.25), pt(fw * 0.15, L * 0.75)],
    foldEdge: [pt(0, -WA), pt(0, L + HA)],
    bbox: { x: 0, y: 0, w: fh + SA, h: L + WA + HA },
  }
}

function buildBackPiece(C: number, Q: number, L: number): PatternPiece {
  const bw = C / 4 + 1.0
  const bh = Q / 4 + 2.5   // back is slightly wider (+0.5)

  const rawDart = bh - bw
  const dart_w = Math.min(Math.max(rawDart, 0.5), 3.0)
  const dart_x = bw * 0.50   // 50% from CB
  const dart_d = 14           // back dart is deeper

  const seamPath: PathCmd[] = [
    { t: 'M', x: 0,                    y: 0 },
    { t: 'L', x: dart_x - dart_w / 2,  y: 0 },
    { t: 'L', x: dart_x,               y: dart_d },
    { t: 'L', x: dart_x + dart_w / 2,  y: 0 },
    { t: 'L', x: bw,                    y: 0 },
    { t: 'Q', cx: bh, cy: HR * 0.5,    x: bh, y: HR },
    { t: 'L', x: bh,                    y: L },
    { t: 'L', x: 0,                     y: L },
    { t: 'Z' },
  ]

  const cutPath: PathCmd[] = [
    { t: 'M', x: 0,           y: -WA },
    { t: 'L', x: bw + SA,     y: -WA },
    { t: 'Q', cx: bh + SA,    cy: HR * 0.5, x: bh + SA, y: HR },
    { t: 'L', x: bh + SA,     y: L },
    { t: 'L', x: bh + SA,     y: L + HA },
    { t: 'L', x: 0,           y: L + HA },
    { t: 'Z' },
  ]

  return {
    id: 'costas',
    name: 'Costas',
    cutInfo: 'Cortar 1x no dobro (dobrar ao longo do fio)',
    onFold: true,
    cutPath,
    seamPath,
    darts: [{
      leg1: pt(dart_x - dart_w / 2, 0),
      tip:  pt(dart_x,               dart_d),
      leg2: pt(dart_x + dart_w / 2, 0),
      label: `${dart_w.toFixed(1)}cm`,
    }],
    notches: [
      { pt: pt(bh, HR), angle: 0 },
    ],
    grainLine: [pt(bw * 0.15, L * 0.25), pt(bw * 0.15, L * 0.75)],
    foldEdge: [pt(0, -WA), pt(0, L + HA)],
    bbox: { x: 0, y: 0, w: bh + SA, h: L + WA + HA },
  }
}

function buildCos(C: number): PatternPiece {
  const cosW = C / 2 + 3.5  // half circum + overlap (3cm) + SA
  const cosH = 8             // folded height (4cm finished)

  const seamPath: PathCmd[] = [
    { t: 'M', x: 0,     y: 0 },
    { t: 'L', x: cosW,  y: 0 },
    { t: 'L', x: cosW,  y: cosH / 2 },
    { t: 'L', x: 0,     y: cosH / 2 },
    { t: 'Z' },
  ]

  const cutPath: PathCmd[] = [
    { t: 'M', x: -SA,         y: -SA },
    { t: 'L', x: cosW + SA,   y: -SA },
    { t: 'L', x: cosW + SA,   y: cosH / 2 },  // fold line — no SA at fold
    { t: 'L', x: -SA,         y: cosH / 2 },
    { t: 'Z' },
  ]

  // Notches: mark button overlap limit
  const overlapX = C / 2 + 1.5

  return {
    id: 'cos',
    name: 'Cós',
    cutInfo: 'Cortar 1x no dobro (dobrar ao longo do comprimento)',
    onFold: true,
    cutPath,
    seamPath,
    darts: [],
    notches: [
      { pt: pt(overlapX, 0), angle: 90 },    // overlap start mark
    ],
    grainLine: [pt(cosW * 0.3, cosH * 0.3), pt(cosW * 0.7, cosH * 0.3)],
    foldEdge: [pt(-SA, cosH / 2), pt(cosW + SA, cosH / 2)],
    bbox: { x: 0, y: 0, w: cosW + SA * 2, h: cosH / 2 + SA },
  }
}

function getSizeName(C: number, Q: number): string {
  if (C <= 62 && Q <= 88)  return 'PP (36)'
  if (C <= 66 && Q <= 92)  return 'P (38)'
  if (C <= 70 && Q <= 96)  return 'M (40)'
  if (C <= 74 && Q <= 100) return 'G (42)'
  if (C <= 78 && Q <= 104) return 'GG (44)'
  return 'XG (46+)'
}

export function generateSaiaReta(m: Measurements): PatternData {
  const C = m.cintura
  const Q = m.quadril
  const L = m.comprimento

  return {
    garment: 'Saia Reta',
    sizeName: getSizeName(C, Q),
    measurements: m,
    seamAllowance: SA,
    hemAllowance: HA,
    pieces: [
      buildFrontPiece(C, Q, L),
      buildBackPiece(C, Q, L),
      buildCos(C),
    ],
  }
}
