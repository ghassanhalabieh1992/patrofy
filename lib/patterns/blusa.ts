// Parametric Basic Bodice (Blusa Básica Manga Curta)
// Simplified construction based on bust/waist/shoulder measurements

import { type Measurements, type PatternData, type PatternPiece, type PathCmd, type DartInfo, pt } from './types'

const SA   = 1.5
const WA   = 1.5
const HA   = 2.5   // hem (bottom of blouse)

function buildFrontBodice(B: number, W: number, L: number): PatternPiece {
  // Quarter widths
  const bW = B / 4 + 1.5   // front bust quarter + ease
  const wW = W / 4 + 0.5   // front waist quarter + ease

  // Bust dart (side dart)
  const bustY = L * 0.38   // bust level from shoulder
  const dart_w = (bW - wW) * 1.2
  const dart_d = bW * 0.5   // dart points toward bust apex

  // Neckline depth and width
  const neck_w = B / 10 + 1  // neckline width
  const neck_d = B / 12 + 1  // front neckline depth

  // Armhole depth
  const ah_d = B / 10 + B / 16 + 2.5  // ~10-12cm

  const seamPath: PathCmd[] = [
    // Start at CF/neck
    { t: 'M', x: 0,         y: neck_d },
    // Neckline curve (front scoop)
    { t: 'Q', cx: 0, cy: 0, x: neck_w, y: 0 },
    // Shoulder line to armhole
    { t: 'L', x: bW,        y: 0 },
    // Armhole curve
    { t: 'Q', cx: bW + 2, cy: ah_d * 0.5, x: bW, y: ah_d },
    // Side seam (straight from armhole to hem, with waist shaping)
    { t: 'Q', cx: bW - (bW - wW), cy: bustY + (L - bustY) * 0.3, x: wW, y: L },
    // Hemline to CF
    { t: 'L', x: 0,         y: L },
    // CF line back up (fold line)
    { t: 'Z' },
  ]

  const cutPath: PathCmd[] = [
    { t: 'M', x: 0,           y: neck_d + WA },    // neck opening + SA
    { t: 'Q', cx: 0, cy: SA,  x: neck_w + SA, y: SA },
    { t: 'L', x: bW + SA,     y: SA },
    { t: 'Q', cx: bW + SA + 2, cy: ah_d * 0.5, x: bW + SA, y: ah_d },
    { t: 'Q', cx: bW + SA - (bW - wW), cy: bustY + (L - bustY) * 0.3, x: wW + SA, y: L },
    { t: 'L', x: wW + SA,     y: L + HA },
    { t: 'L', x: 0,           y: L + HA },
    { t: 'Z' },
  ]

  // Side bust dart
  const darts: DartInfo[] = [{
    leg1: pt(bW, bustY - dart_w / 2),
    tip:  pt(dart_d, bustY),
    leg2: pt(bW, bustY + dart_w / 2),
    label: `${dart_w.toFixed(1)}cm`,
  }]

  return {
    id: 'frente',
    name: 'Frente',
    cutInfo: 'Cortar 1x no dobro',
    onFold: true,
    cutPath,
    seamPath,
    darts,
    notches: [
      { pt: pt(bW, ah_d), angle: 0 },
    ],
    grainLine: [pt(bW * 0.1, L * 0.3), pt(bW * 0.1, L * 0.7)],
    foldEdge: [pt(0, neck_d + WA), pt(0, L + HA)],
    bbox: { x: 0, y: 0, w: bW + SA + 2, h: L + WA + HA + neck_d },
  }
}

function buildBackBodice(B: number, W: number, L: number): PatternPiece {
  const bW = B / 4 + 1.0
  const wW = W / 4 + 0.5

  const neck_w = B / 10 + 0.5   // back neck is narrower
  const neck_d = B / 60 + 0.5   // back neck is very shallow
  const ah_d = B / 10 + B / 16 + 2.5

  const dart_w = (bW - wW) * 1.0
  const dart_x = bW * 0.5
  const dart_d = 12

  const seamPath: PathCmd[] = [
    { t: 'M', x: 0,         y: neck_d },
    { t: 'Q', cx: 0, cy: 0, x: neck_w, y: 0 },
    { t: 'L', x: bW,        y: 0 },
    { t: 'Q', cx: bW + 2, cy: ah_d * 0.5, x: bW, y: ah_d },
    { t: 'Q', cx: bW - (bW - wW), cy: ah_d + (L - ah_d) * 0.4, x: wW, y: L },
    { t: 'L', x: 0,         y: L },
    { t: 'Z' },
  ]

  const cutPath: PathCmd[] = [
    { t: 'M', x: 0,           y: neck_d + WA },
    { t: 'Q', cx: 0, cy: SA,  x: neck_w + SA, y: SA },
    { t: 'L', x: bW + SA,     y: SA },
    { t: 'Q', cx: bW + SA + 2, cy: ah_d * 0.5, x: bW + SA, y: ah_d },
    { t: 'Q', cx: bW + SA - (bW - wW), cy: ah_d + (L - ah_d) * 0.4, x: wW + SA, y: L },
    { t: 'L', x: wW + SA,     y: L + HA },
    { t: 'L', x: 0,           y: L + HA },
    { t: 'Z' },
  ]

  return {
    id: 'costas',
    name: 'Costas',
    cutInfo: 'Cortar 1x no dobro',
    onFold: true,
    cutPath,
    seamPath,
    darts: [{
      leg1: pt(dart_x - dart_w / 2, 0),
      tip:  pt(dart_x, dart_d),
      leg2: pt(dart_x + dart_w / 2, 0),
    }],
    notches: [{ pt: pt(bW, ah_d), angle: 0 }],
    grainLine: [pt(bW * 0.1, L * 0.3), pt(bW * 0.1, L * 0.7)],
    foldEdge: [pt(0, neck_d + WA), pt(0, L + HA)],
    bbox: { x: 0, y: 0, w: bW + SA + 2, h: L + WA + HA + neck_d },
  }
}

function buildSleeve(B: number, sleeveL: number): PatternPiece {
  const sw = B / 4 + 2     // sleeve width at armhole
  const wristW = B / 8 + 2  // wrist width

  const capH = B / 10 + 2   // sleeve cap height

  const seamPath: PathCmd[] = [
    // Start at center top (cap peak)
    { t: 'M', x: sw / 2, y: 0 },
    // Right sleeve cap curve
    { t: 'Q', cx: sw + 1, cy: capH * 0.7, x: sw, y: capH },
    // Right side seam to cuff
    { t: 'L', x: sw / 2 + wristW / 2, y: sleeveL },
    // Cuff
    { t: 'L', x: sw / 2 - wristW / 2, y: sleeveL },
    // Left side seam
    { t: 'L', x: 0,       y: capH },
    // Left cap curve
    { t: 'Q', cx: -1, cy: capH * 0.7, x: sw / 2, y: 0 },
    { t: 'Z' },
  ]

  const cutPath: PathCmd[] = [
    { t: 'M', x: sw / 2,            y: -SA },
    { t: 'Q', cx: sw + SA + 1, cy: capH * 0.7, x: sw + SA, y: capH },
    { t: 'L', x: sw / 2 + wristW / 2 + SA, y: sleeveL },
    { t: 'L', x: sw / 2 + wristW / 2 + SA, y: sleeveL + HA },
    { t: 'L', x: sw / 2 - wristW / 2 - SA, y: sleeveL + HA },
    { t: 'L', x: sw / 2 - wristW / 2 - SA, y: sleeveL },
    { t: 'L', x: -SA,               y: capH },
    { t: 'Q', cx: -SA - 1, cy: capH * 0.7, x: sw / 2, y: -SA },
    { t: 'Z' },
  ]

  return {
    id: 'manga',
    name: 'Manga',
    cutInfo: 'Cortar 2x espelhado',
    onFold: false,
    cutPath,
    seamPath,
    darts: [],
    notches: [
      { pt: pt(sw / 2, 0), angle: 90 },    // cap center mark
      { pt: pt(sw, capH), angle: 0 },      // front armhole notch
      { pt: pt(0, capH), angle: 0 },       // back armhole notch
    ],
    grainLine: [pt(sw / 2, sleeveL * 0.2), pt(sw / 2, sleeveL * 0.8)],
    bbox: { x: 0, y: 0, w: sw + SA * 2 + 2, h: sleeveL + SA + HA },
  }
}

function getSizeName(B: number): string {
  if (B <= 84) return 'PP (36)'
  if (B <= 88) return 'P (38)'
  if (B <= 92) return 'M (40)'
  if (B <= 96) return 'G (42)'
  if (B <= 100) return 'GG (44)'
  return 'XG (46+)'
}

export function generateBlusa(m: Measurements): PatternData {
  const B  = m.busto ?? 92
  const W  = m.cintura
  const L  = m.comprimento   // body length (shoulder to hem)
  const SL = m.mangas ?? 22  // sleeve length (default short sleeve)

  return {
    garment: 'Blusa Básica',
    sizeName: getSizeName(B),
    measurements: m,
    seamAllowance: SA,
    hemAllowance: HA,
    pieces: [
      buildFrontBodice(B, W, L),
      buildBackBodice(B, W, L),
      buildSleeve(B, SL),
    ],
  }
}
