// Blazer Masculino — 5 peças: Frente, Costas, Manga Superior, Manga Inferior, Gola
// Proporções baseadas no sistema de modelagem plana industrial (escala cm)

import { type Measurements, type PatternData, type PatternPiece, type PathCmd, type DartInfo, pt } from './types'

const SA = 1.5   // margem de costura
const HA = 4.0   // bainha

// ── Frente ────────────────────────────────────────────────────────────────────
function buildFrente(B: number, W: number, L: number): PatternPiece {
  const bW   = B / 4 + 5.5   // pechera + folga + sobreposição botões
  const wW   = W / 4 + 5.0
  const ext  = 2.5            // prolongamento para botões (além da CF)
  const nW   = B / 12 + 1.5  // largura do decote
  const nD   = B / 10 + 1.5  // profundidade do decote
  const ahD  = B / 8  + 5.5  // profundidade da cava
  const bustY = L * 0.38

  const dartW = Math.max(0.5, bW - ext - wW - 1)
  const dartX = bW - ext - dartW * 0.9

  const seamPath: PathCmd[] = [
    { t: 'M', x: ext,           y: nD },
    { t: 'Q', cx: ext, cy: 0,   x: nW + ext, y: 0 },
    { t: 'L', x: bW,            y: 0 },
    { t: 'Q', cx: bW + 2,       cy: ahD * 0.5, x: bW, y: ahD },
    { t: 'Q', cx: bW - (bW - ext - wW), cy: bustY + (L - bustY) * 0.35, x: wW + ext, y: L },
    { t: 'L', x: ext,           y: L },
    { t: 'Z' },
  ]

  const cutPath: PathCmd[] = [
    { t: 'M', x: 0,             y: nD + SA },
    { t: 'Q', cx: 0, cy: SA,    x: nW + ext + SA, y: SA },
    { t: 'L', x: bW + SA,       y: SA },
    { t: 'Q', cx: bW + SA + 2,  cy: ahD * 0.5, x: bW + SA, y: ahD },
    { t: 'Q', cx: bW + SA - (bW - ext - wW), cy: bustY + (L - bustY) * 0.35, x: wW + ext + SA, y: L },
    { t: 'L', x: wW + ext + SA, y: L + HA },
    { t: 'L', x: 0,             y: L + HA },
    { t: 'Z' },
  ]

  const darts: DartInfo[] = [{
    leg1: pt(bW, bustY - dartW / 2),
    tip:  pt(dartX, bustY),
    leg2: pt(bW, bustY + dartW / 2),
    label: `${dartW.toFixed(1)}cm`,
  }]

  return {
    id: 'frente',
    name: 'Frente',
    cutInfo: 'Cortar 2x espelhado',
    onFold: false,
    cutPath, seamPath, darts,
    notches: [
      { pt: pt(bW, ahD),     angle: 0  },
      { pt: pt(ext, bustY),  angle: 90 },
    ],
    grainLine: [pt(ext + 2, L * 0.25), pt(ext + 2, L * 0.75)],
    bbox: { x: 0, y: 0, w: bW + SA + 2, h: L + HA + nD },
  }
}

// ── Costas ────────────────────────────────────────────────────────────────────
function buildCostas(B: number, W: number, L: number): PatternPiece {
  const bW  = B / 4 + 3.5
  const wW  = W / 4 + 3.5
  const nW  = B / 12 + 0.5
  const nD  = 2.5
  const ahD = B / 8 + 5.5

  const dartW = Math.max(0.5, (bW - wW) * 0.85)
  const dartX = bW * 0.44
  const dartD = 15

  const seamPath: PathCmd[] = [
    { t: 'M', x: 0,         y: nD },
    { t: 'Q', cx: 0, cy: 0, x: nW, y: 0 },
    { t: 'L', x: bW,        y: 0 },
    { t: 'Q', cx: bW + 2,   cy: ahD * 0.5, x: bW, y: ahD },
    { t: 'Q', cx: bW - (bW - wW), cy: ahD + (L - ahD) * 0.4, x: wW, y: L },
    { t: 'L', x: 0,         y: L },
    { t: 'Z' },
  ]

  const cutPath: PathCmd[] = [
    { t: 'M', x: 0,           y: nD + SA },
    { t: 'Q', cx: 0, cy: SA,  x: nW + SA, y: SA },
    { t: 'L', x: bW + SA,     y: SA },
    { t: 'Q', cx: bW + SA + 2, cy: ahD * 0.5, x: bW + SA, y: ahD },
    { t: 'Q', cx: bW + SA - (bW - wW), cy: ahD + (L - ahD) * 0.4, x: wW + SA, y: L },
    { t: 'L', x: wW + SA,     y: L + HA },
    { t: 'L', x: 0,           y: L + HA },
    { t: 'Z' },
  ]

  return {
    id: 'costas',
    name: 'Costas',
    cutInfo: 'Cortar 2x (costura central)',
    onFold: false,
    cutPath, seamPath,
    darts: [{
      leg1: pt(dartX - dartW / 2, 0),
      tip:  pt(dartX, dartD),
      leg2: pt(dartX + dartW / 2, 0),
    }],
    notches: [{ pt: pt(bW, ahD), angle: 0 }],
    grainLine: [pt(bW * 0.15, L * 0.25), pt(bW * 0.15, L * 0.75)],
    bbox: { x: 0, y: 0, w: bW + SA + 2, h: L + HA + nD },
  }
}

// ── Manga Superior ────────────────────────────────────────────────────────────
function buildMangaSuperior(B: number, SL: number): PatternPiece {
  const sw   = B / 4 + 4.5
  const wW   = 14
  const capH = B / 10 + 3.5

  const seamPath: PathCmd[] = [
    { t: 'M', x: sw / 2,         y: 0 },
    { t: 'Q', cx: sw + 2,         cy: capH * 0.6, x: sw, y: capH },
    { t: 'L', x: sw * 0.55 + wW / 2, y: SL },
    { t: 'L', x: sw * 0.55 - wW / 2, y: SL },
    { t: 'L', x: 0,              y: capH },
    { t: 'Q', cx: -2, cy: capH * 0.6, x: sw / 2, y: 0 },
    { t: 'Z' },
  ]

  const cutPath: PathCmd[] = [
    { t: 'M', x: sw / 2,              y: -SA },
    { t: 'Q', cx: sw + SA + 2,         cy: capH * 0.6, x: sw + SA, y: capH },
    { t: 'L', x: sw * 0.55 + wW / 2 + SA, y: SL },
    { t: 'L', x: sw * 0.55 + wW / 2 + SA, y: SL + HA },
    { t: 'L', x: sw * 0.55 - wW / 2 - SA, y: SL + HA },
    { t: 'L', x: sw * 0.55 - wW / 2 - SA, y: SL },
    { t: 'L', x: -SA,             y: capH },
    { t: 'Q', cx: -SA - 2, cy: capH * 0.6, x: sw / 2, y: -SA },
    { t: 'Z' },
  ]

  return {
    id: 'manga-superior',
    name: 'Manga Superior',
    cutInfo: 'Cortar 2x espelhado',
    onFold: false,
    cutPath, seamPath, darts: [],
    notches: [
      { pt: pt(sw / 2, 0),  angle: 90 },
      { pt: pt(sw, capH),   angle: 0  },
      { pt: pt(0, capH),    angle: 0  },
    ],
    grainLine: [pt(sw / 2, SL * 0.2), pt(sw / 2, SL * 0.8)],
    bbox: { x: 0, y: 0, w: sw + SA * 2 + 2, h: SL + SA + HA },
  }
}

// ── Manga Inferior ────────────────────────────────────────────────────────────
function buildMangaInferior(B: number, SL: number): PatternPiece {
  const sw   = B / 4 + 1.5
  const wW   = 9
  const capH = B / 10 + 1.0

  const seamPath: PathCmd[] = [
    { t: 'M', x: sw / 2,             y: capH * 0.3 },
    { t: 'L', x: sw,                 y: capH },
    { t: 'L', x: sw * 0.55 + wW / 2, y: SL },
    { t: 'L', x: sw * 0.55 - wW / 2, y: SL },
    { t: 'L', x: 0,                  y: capH },
    { t: 'Z' },
  ]

  const cutPath: PathCmd[] = [
    { t: 'M', x: sw / 2,                  y: capH * 0.3 - SA },
    { t: 'L', x: sw + SA,                 y: capH },
    { t: 'L', x: sw * 0.55 + wW / 2 + SA, y: SL },
    { t: 'L', x: sw * 0.55 + wW / 2 + SA, y: SL + HA },
    { t: 'L', x: sw * 0.55 - wW / 2 - SA, y: SL + HA },
    { t: 'L', x: sw * 0.55 - wW / 2 - SA, y: SL },
    { t: 'L', x: -SA,                     y: capH },
    { t: 'Z' },
  ]

  return {
    id: 'manga-inferior',
    name: 'Manga Inferior',
    cutInfo: 'Cortar 2x espelhado',
    onFold: false,
    cutPath, seamPath, darts: [],
    notches: [{ pt: pt(sw, capH), angle: 0 }],
    grainLine: [pt(sw / 2, SL * 0.2), pt(sw / 2, SL * 0.8)],
    bbox: { x: 0, y: 0, w: sw + SA * 2 + 2, h: SL + SA + HA },
  }
}

// ── Gola / Lapela ─────────────────────────────────────────────────────────────
function buildGola(B: number): PatternPiece {
  const neckH = B / 4 + B / 12    // meia circunferência do decote
  const colW  = 7.5
  const colL  = neckH * 2.0

  const seamPath: PathCmd[] = [
    { t: 'M', x: 0,     y: 0 },
    { t: 'L', x: colL,  y: 0 },
    { t: 'Q', cx: colL, cy: colW * 0.5, x: colL - 2, y: colW },
    { t: 'L', x: 2,     y: colW },
    { t: 'Q', cx: 0,    cy: colW * 0.5, x: 0, y: 0 },
    { t: 'Z' },
  ]

  const cutPath: PathCmd[] = [
    { t: 'M', x: -SA,       y: -SA },
    { t: 'L', x: colL + SA, y: -SA },
    { t: 'L', x: colL + SA, y: colW + SA },
    { t: 'L', x: -SA,       y: colW + SA },
    { t: 'Z' },
  ]

  return {
    id: 'gola',
    name: 'Gola / Lapela',
    cutInfo: 'Cortar 1x + entretela',
    onFold: false,
    cutPath, seamPath, darts: [],
    notches: [{ pt: pt(colL / 2, 0), angle: 90 }],
    grainLine: [pt(colL * 0.2, colW / 2), pt(colL * 0.8, colW / 2)],
    bbox: { x: 0, y: 0, w: colL + SA * 2, h: colW + SA * 2 },
  }
}

// ── Size name ─────────────────────────────────────────────────────────────────
function getSizeName(B: number): string {
  if (B <= 88)  return 'PP (36–38)'
  if (B <= 96)  return 'P (40–42)'
  if (B <= 104) return 'M (44–46)'
  if (B <= 112) return 'G (48–50)'
  return 'GG (52+)'
}

// ── Main export ───────────────────────────────────────────────────────────────
export function generateBlazerMasculino(m: Measurements): PatternData {
  const B  = m.busto ?? 100
  const W  = m.cintura
  const L  = m.comprimento
  const SL = m.mangas ?? 62

  return {
    garment: 'Blazer Masculino',
    sizeName: getSizeName(B),
    measurements: m,
    seamAllowance: SA,
    hemAllowance:  HA,
    pieces: [
      buildFrente(B, W, L),
      buildCostas(B, W, L),
      buildMangaSuperior(B, SL),
      buildMangaInferior(B, SL),
      buildGola(B),
    ],
  }
}
