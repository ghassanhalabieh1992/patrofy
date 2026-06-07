// Parametric Basic Pants (Calça Básica)
// Simplified Müller-method for Brazilian pattern making

import { type Measurements, type PatternData, type PatternPiece, type PathCmd, type DartInfo, bboxOfPath, pt } from './types'

const SA   = 1.5   // side seam / inseam allowance
const WA   = 1.5   // waist allowance
const HA   = 3.5   // hem allowance
const HR   = 27    // pants hip rise (waist to hip)
const EASE_H = 4   // hip ease (total, so +1 per quarter)

function buildFrontLeg(C: number, Q: number, L: number): PatternPiece {
  // Quarter widths
  const wW = C / 4 + 0.5          // waist per quarter + ease
  const wH = Q / 4 + EASE_H / 4   // hip per quarter + ease

  // Crotch extension (front = narrower)
  const crotch = Q / 16 + 1.0     // ~7-8cm for standard sizing

  // Key x positions
  const x_cf   = crotch           // CF at crotch level (measured from inseam)
  const x_side  = x_cf + wH        // side seam at hip

  // Key y positions (top = waistline)
  const y_waist = 0
  const y_hip   = HR
  const y_knee  = HR + (L - HR) * 0.5
  const y_hem   = HR + L

  // Waist: CF is at x_cf (not centered), side seam at x_side
  const waist_cf   = x_cf - 0.5    // CF tapers slightly inward at waist
  const waist_side = x_cf + wW

  // Dart at front waist (small, ~1cm)
  const dart_w = Math.min(wH - wW + 0.5, 1.5)
  const dart_x = (waist_cf + waist_side) / 2
  const dart_d = 8

  // ── Seam line ──────────────────────────────────────────────────
  const seamPath: PathCmd[] = [
    // Start at CF/waist
    { t: 'M', x: waist_cf,          y: y_waist },
    // Waistline with small dart
    { t: 'L', x: dart_x - dart_w / 2, y: y_waist },
    { t: 'L', x: dart_x,             y: dart_d },
    { t: 'L', x: dart_x + dart_w / 2, y: y_waist },
    { t: 'L', x: waist_side,          y: y_waist },
    // Side seam: straight to hip, then to knee, then to hem (slight taper)
    { t: 'Q', cx: x_side, cy: HR * 0.4, x: x_side, y: y_hip },
    { t: 'L', x: x_side - 1,          y: y_knee },
    { t: 'L', x: x_side - 2,          y: y_hem },
    // Hemline
    { t: 'L', x: crotch - 0.5,        y: y_hem },
    // Inseam: hem to crotch
    { t: 'L', x: crotch - 0.5,        y: y_hip + 2 },
    // Crotch curve (characteristic front crotch)
    { t: 'Q', cx: 0, cy: y_hip + 2,   x: 0, y: y_hip + 4 },
    { t: 'L', x: 0,                    y: y_waist + 1 },
    // CF line up to waist
    { t: 'L', x: waist_cf,            y: y_waist },
    { t: 'Z' },
  ]

  // ── Cut line (outer boundary + allowances) ────────────────────
  const cutPath: PathCmd[] = [
    { t: 'M', x: waist_cf - SA,       y: -WA },
    { t: 'L', x: waist_side + SA,     y: -WA },
    { t: 'Q', cx: x_side + SA, cy: HR * 0.4, x: x_side + SA, y: y_hip },
    { t: 'L', x: x_side + SA - 1,     y: y_knee },
    { t: 'L', x: x_side + SA - 2,     y: y_hem },
    { t: 'L', x: x_side + SA - 2,     y: y_hem + HA },
    { t: 'L', x: crotch - 0.5 - SA,   y: y_hem + HA },
    { t: 'L', x: crotch - 0.5 - SA,   y: y_hem },
    { t: 'L', x: crotch - 0.5 - SA,   y: y_hip + 2 },
    { t: 'Q', cx: -SA, cy: y_hip + 2, x: -SA, y: y_hip + 4 },
    { t: 'L', x: -SA,                  y: y_waist + 1 },
    { t: 'L', x: waist_cf - SA,        y: -WA },
    { t: 'Z' },
  ]

  const darts: DartInfo[] = [{
    leg1: pt(dart_x - dart_w / 2, 0),
    tip:  pt(dart_x, dart_d),
    leg2: pt(dart_x + dart_w / 2, 0),
  }]

  return {
    id: 'frente',
    name: 'Frente',
    cutInfo: 'Cortar 2x espelhado',
    onFold: false,
    cutPath,
    seamPath,
    darts,
    notches: [
      { pt: pt(x_side, y_hip), angle: 0 },
      { pt: pt(crotch - 0.5, y_hip + 2), angle: 45 },
    ],
    grainLine: [
      pt((waist_cf + x_side) / 2, y_hem * 0.25),
      pt((waist_cf + x_side) / 2, y_hem * 0.75),
    ],
    bbox: { x: 0, y: 0, w: x_side + SA + 2, h: y_hem + WA + HA },
  }
}

function buildBackLeg(C: number, Q: number, L: number): PatternPiece {
  const wW = C / 4 + 0.5
  const wH = Q / 4 + EASE_H / 4

  // Back crotch is wider than front
  const crotch = Q / 8 + 2.5

  const x_cf    = crotch
  const x_side  = x_cf + wH + 1.5   // back is wider at hip

  const y_hip   = HR
  const y_knee  = HR + (L - HR) * 0.5
  const y_hem   = HR + L

  const waist_cb   = x_cf - 1.5      // back CB tapers more inward
  const waist_side = x_cf + wW + 2   // back waist extends more at side

  // Back dart is larger (takes up more fabric for the seat)
  const dart_w = Math.min(wH - wW + 2.0, 3.5)
  const dart_x = (waist_cb + waist_side) / 2
  const dart_d = 13  // back dart is deeper

  const seamPath: PathCmd[] = [
    { t: 'M', x: waist_cb,             y: 0 },
    { t: 'L', x: dart_x - dart_w / 2,  y: 0 },
    { t: 'L', x: dart_x,               y: dart_d },
    { t: 'L', x: dart_x + dart_w / 2,  y: 0 },
    { t: 'L', x: waist_side,            y: 0 },
    { t: 'Q', cx: x_side, cy: HR * 0.3, x: x_side, y: y_hip },
    { t: 'L', x: x_side - 1,            y: y_knee },
    { t: 'L', x: x_side - 2,            y: y_hem },
    { t: 'L', x: crotch - 0.5,          y: y_hem },
    { t: 'L', x: crotch - 0.5,          y: y_hip + 4 },
    // Back crotch curve (wider/deeper than front)
    { t: 'Q', cx: -2, cy: y_hip + 4,   x: -2, y: y_hip + 6 },
    { t: 'L', x: -2,                    y: 4 },
    { t: 'L', x: waist_cb,              y: 0 },
    { t: 'Z' },
  ]

  const cutPath: PathCmd[] = [
    { t: 'M', x: waist_cb - SA,       y: -WA },
    { t: 'L', x: waist_side + SA,     y: -WA },
    { t: 'Q', cx: x_side + SA, cy: HR * 0.3, x: x_side + SA, y: y_hip },
    { t: 'L', x: x_side + SA - 1,     y: y_knee },
    { t: 'L', x: x_side + SA - 2,     y: y_hem },
    { t: 'L', x: x_side + SA - 2,     y: y_hem + HA },
    { t: 'L', x: crotch - 0.5 - SA,   y: y_hem + HA },
    { t: 'L', x: crotch - 0.5 - SA,   y: y_hip + 4 },
    { t: 'Q', cx: -2 - SA, cy: y_hip + 4, x: -2 - SA, y: y_hip + 6 },
    { t: 'L', x: -2 - SA,              y: 4 },
    { t: 'L', x: waist_cb - SA,        y: -WA },
    { t: 'Z' },
  ]

  return {
    id: 'costas',
    name: 'Costas',
    cutInfo: 'Cortar 2x espelhado',
    onFold: false,
    cutPath,
    seamPath,
    darts: [{
      leg1: pt(dart_x - dart_w / 2, 0),
      tip:  pt(dart_x, dart_d),
      leg2: pt(dart_x + dart_w / 2, 0),
    }],
    notches: [
      { pt: pt(x_side, y_hip), angle: 0 },
    ],
    grainLine: [
      pt((waist_cb + x_side) / 2, y_hem * 0.25),
      pt((waist_cb + x_side) / 2, y_hem * 0.75),
    ],
    bbox: { x: 0, y: 0, w: x_side + SA + 2, h: y_hem + WA + HA },
  }
}

function buildCos(C: number): PatternPiece {
  const cosW = C / 2 + 4   // half + overlap
  const cosH = 4             // finished height

  const seamPath: PathCmd[] = [
    { t: 'M', x: 0,     y: 0 },
    { t: 'L', x: cosW,  y: 0 },
    { t: 'L', x: cosW,  y: cosH },
    { t: 'L', x: 0,     y: cosH },
    { t: 'Z' },
  ]
  const cutPath: PathCmd[] = [
    { t: 'M', x: -SA,       y: -WA },
    { t: 'L', x: cosW + SA, y: -WA },
    { t: 'L', x: cosW + SA, y: cosH + SA },
    { t: 'L', x: -SA,       y: cosH + SA },
    { t: 'Z' },
  ]

  return {
    id: 'cos',
    name: 'Cós',
    cutInfo: 'Cortar 2x (frente e costas)',
    onFold: false,
    cutPath,
    seamPath,
    darts: [],
    notches: [{ pt: pt(C / 2 + 1.5, 0), angle: 90 }],
    grainLine: [pt(cosW * 0.2, cosH / 2), pt(cosW * 0.8, cosH / 2)],
    bbox: { x: 0, y: 0, w: cosW + SA * 2, h: cosH + WA + SA },
  }
}

function getSizeName(C: number, Q: number): string {
  if (C <= 66 && Q <= 92)  return 'P (38)'
  if (C <= 70 && Q <= 96)  return 'M (40)'
  if (C <= 74 && Q <= 100) return 'G (42)'
  if (C <= 78 && Q <= 104) return 'GG (44)'
  return 'XG (46+)'
}

export function generateCalca(m: Measurements): PatternData {
  return {
    garment: 'Calça Básica',
    sizeName: getSizeName(m.cintura, m.quadril),
    measurements: m,
    seamAllowance: SA,
    hemAllowance: HA,
    pieces: [
      buildFrontLeg(m.cintura, m.quadril, m.comprimento),
      buildBackLeg(m.cintura, m.quadril, m.comprimento),
      buildCos(m.cintura),
    ],
  }
}
