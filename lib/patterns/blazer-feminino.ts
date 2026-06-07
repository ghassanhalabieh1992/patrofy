// Blazer Feminino — 5 peças: Frente, Costas, Manga Superior, Manga Inferior, Gola
// Modelagem plana industrial com pence lateral e modelagem do quadril

import { type Measurements, type PatternData, type PatternPiece, type PathCmd, type DartInfo, pt } from './types'

const SA = 1.5
const HA = 4.0

// ── Frente ────────────────────────────────────────────────────────────────────
function buildFrente(B: number, W: number, Q: number, L: number): PatternPiece {
  const bW  = B / 4 + 4.5
  const wW  = W / 4 + 3.5
  const hW  = Q / 4 + 3.5
  const ext = 2.0
  const nW  = B / 12 + 1.0
  const nD  = B / 10 + 1.0
  const ahD = B / 8 + 4.0

  const bustY = L * 0.36
  const hipY  = L * 0.62

  const dartW = Math.max(0.5, bW - ext - wW - 0.5)
  const dartX = bW - ext - dartW * 0.9

  const seamPath: PathCmd[] = [
    { t: 'M', x: ext,             y: nD },
    { t: 'Q', cx: ext, cy: 0,     x: nW + ext, y: 0 },
    { t: 'L', x: bW,              y: 0 },
    { t: 'Q', cx: bW + 2,         cy: ahD * 0.5, x: bW, y: ahD },
    { t: 'Q', cx: bW,             cy: bustY + (hipY - bustY) * 0.35, x: wW + ext, y: hipY },
    { t: 'Q', cx: hW + ext,       cy: hipY + (L - hipY) * 0.5, x: hW + ext, y: L },
    { t: 'L', x: ext,             y: L },
    { t: 'Z' },
  ]

  const cutPath: PathCmd[] = [
    { t: 'M', x: 0,                y: nD + SA },
    { t: 'Q', cx: 0, cy: SA,       x: nW + ext + SA, y: SA },
    { t: 'L', x: bW + SA,          y: SA },
    { t: 'Q', cx: bW + SA + 2,     cy: ahD * 0.5, x: bW + SA, y: ahD },
    { t: 'Q', cx: bW + SA,         cy: bustY + (hipY - bustY) * 0.35, x: wW + ext + SA, y: hipY },
    { t: 'Q', cx: hW + ext + SA,   cy: hipY + (L - hipY) * 0.5, x: hW + ext + SA, y: L },
    { t: 'L', x: hW + ext + SA,    y: L + HA },
    { t: 'L', x: 0,                y: L + HA },
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
      { pt: pt(bW, ahD),   angle: 0  },
      { pt: pt(ext, bustY * 0.9), angle: 90 },
    ],
    grainLine: [pt(ext + 2, L * 0.25), pt(ext + 2, L * 0.75)],
    bbox: { x: 0, y: 0, w: bW + SA + 2, h: L + HA + nD },
  }
}

// ── Costas ────────────────────────────────────────────────────────────────────
function buildCostas(B: number, W: number, Q: number, L: number): PatternPiece {
  const bW  = B / 4 + 2.5
  const wW  = W / 4 + 2.5
  const hW  = Q / 4 + 2.5
  const nW  = B / 12 + 0.5
  const nD  = 2.5
  const ahD = B / 8 + 4.0
  const hipY = L * 0.62

  const dartW = Math.max(0.5, (bW - wW) * 0.9)
  const dartX = bW * 0.44
  const dartD = 13

  const seamPath: PathCmd[] = [
    { t: 'M', x: 0,         y: nD },
    { t: 'Q', cx: 0, cy: 0, x: nW, y: 0 },
    { t: 'L', x: bW,        y: 0 },
    { t: 'Q', cx: bW + 2,   cy: ahD * 0.5, x: bW, y: ahD },
    { t: 'Q', cx: bW,       cy: ahD + (hipY - ahD) * 0.5, x: wW, y: hipY },
    { t: 'Q', cx: hW,       cy: hipY + (L - hipY) * 0.5, x: hW, y: L },
    { t: 'L', x: 0,         y: L },
    { t: 'Z' },
  ]

  const cutPath: PathCmd[] = [
    { t: 'M', x: 0,           y: nD + SA },
    { t: 'Q', cx: 0, cy: SA,  x: nW + SA, y: SA },
    { t: 'L', x: bW + SA,     y: SA },
    { t: 'Q', cx: bW + SA + 2, cy: ahD * 0.5, x: bW + SA, y: ahD },
    { t: 'Q', cx: bW + SA,    cy: ahD + (hipY - ahD) * 0.5, x: wW + SA, y: hipY },
    { t: 'Q', cx: hW + SA,    cy: hipY + (L - hipY) * 0.5, x: hW + SA, y: L },
    { t: 'L', x: hW + SA,     y: L + HA },
    { t: 'L', x: 0,           y: L + HA },
    { t: 'Z' },
  ]

  return {
    id: 'costas',
    name: 'Costas',
    cutInfo: 'Cortar 1x no dobro',
    onFold: true,
    cutPath, seamPath,
    darts: [{
      leg1: pt(dartX - dartW / 2, 0),
      tip:  pt(dartX, dartD),
      leg2: pt(dartX + dartW / 2, 0),
    }],
    notches: [{ pt: pt(bW, ahD), angle: 0 }],
    grainLine: [pt(bW * 0.1, L * 0.25), pt(bW * 0.1, L * 0.75)],
    foldEdge: [pt(0, nD + SA), pt(0, L + HA)],
    bbox: { x: 0, y: 0, w: bW + SA + 2, h: L + HA + nD },
  }
}

// ── Manga Superior ────────────────────────────────────────────────────────────
function buildMangaSuperior(B: number, SL: number): PatternPiece {
  const sw   = B / 4 + 3.5
  const wW   = 12
  const capH = B / 10 + 3.0

  const seamPath: PathCmd[] = [
    { t: 'M', x: sw / 2,             y: 0 },
    { t: 'Q', cx: sw + 1.5,           cy: capH * 0.6, x: sw, y: capH },
    { t: 'L', x: sw * 0.55 + wW / 2, y: SL },
    { t: 'L', x: sw * 0.55 - wW / 2, y: SL },
    { t: 'L', x: 0,                  y: capH },
    { t: 'Q', cx: -1.5, cy: capH * 0.6, x: sw / 2, y: 0 },
    { t: 'Z' },
  ]

  const cutPath: PathCmd[] = [
    { t: 'M', x: sw / 2,                  y: -SA },
    { t: 'Q', cx: sw + SA + 1.5,           cy: capH * 0.6, x: sw + SA, y: capH },
    { t: 'L', x: sw * 0.55 + wW / 2 + SA, y: SL },
    { t: 'L', x: sw * 0.55 + wW / 2 + SA, y: SL + HA },
    { t: 'L', x: sw * 0.55 - wW / 2 - SA, y: SL + HA },
    { t: 'L', x: sw * 0.55 - wW / 2 - SA, y: SL },
    { t: 'L', x: -SA,                     y: capH },
    { t: 'Q', cx: -SA - 1.5, cy: capH * 0.6, x: sw / 2, y: -SA },
    { t: 'Z' },
  ]

  return {
    id: 'manga-superior',
    name: 'Manga Superior',
    cutInfo: 'Cortar 2x espelhado',
    onFold: false,
    cutPath, seamPath, darts: [],
    notches: [
      { pt: pt(sw / 2, 0), angle: 90 },
      { pt: pt(sw, capH),  angle: 0  },
      { pt: pt(0, capH),   angle: 0  },
    ],
    grainLine: [pt(sw / 2, SL * 0.2), pt(sw / 2, SL * 0.8)],
    bbox: { x: 0, y: 0, w: sw + SA * 2 + 2, h: SL + SA + HA },
  }
}

// ── Manga Inferior ────────────────────────────────────────────────────────────
function buildMangaInferior(B: number, SL: number): PatternPiece {
  const sw   = B / 4 + 1.0
  const wW   = 8
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
  const neckH = B / 4 + B / 12 - 0.5
  const colW  = 6.5
  const colL  = neckH * 1.9

  const seamPath: PathCmd[] = [
    { t: 'M', x: 0,     y: 0 },
    { t: 'L', x: colL,  y: 0 },
    { t: 'Q', cx: colL, cy: colW * 0.5, x: colL - 1.5, y: colW },
    { t: 'L', x: 1.5,   y: colW },
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
  if (B <= 80)  return 'PP (34–36)'
  if (B <= 88)  return 'P (38–40)'
  if (B <= 96)  return 'M (42–44)'
  if (B <= 104) return 'G (46–48)'
  return 'GG (50+)'
}

// ── Main export ───────────────────────────────────────────────────────────────
export function generateBlazerFeminino(m: Measurements): PatternData {
  const B  = m.busto ?? 92
  const W  = m.cintura
  const Q  = m.quadril > 0 ? m.quadril : W * 1.12
  const L  = m.comprimento
  const SL = m.mangas ?? 58

  return {
    garment: 'Blazer Feminino',
    sizeName: getSizeName(B),
    measurements: m,
    seamAllowance: SA,
    hemAllowance:  HA,
    pieces: [
      buildFrente(B, W, Q, L),
      buildCostas(B, W, Q, L),
      buildMangaSuperior(B, SL),
      buildMangaInferior(B, SL),
      buildGola(B),
    ],
  }
}
