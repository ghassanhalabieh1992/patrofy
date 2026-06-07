export type { Measurements, PatternData, PatternPiece, PathCmd, DartInfo, Notch, Pt } from './types'
export { pathToSVG, bboxOfPath, pt } from './types'
export { generateSaiaReta }       from './saia'
export { generateCalca }          from './calca'
export { generateBlusa }          from './blusa'
export { generateBlazerMasculino } from './blazer-masculino'
export { generateBlazerFeminino }  from './blazer-feminino'

import type { Measurements, PatternData } from './types'
import { generateSaiaReta }       from './saia'
import { generateCalca }          from './calca'
import { generateBlusa }          from './blusa'
import { generateBlazerMasculino } from './blazer-masculino'
import { generateBlazerFeminino }  from './blazer-feminino'

export type GarmentType = 'saia' | 'calca' | 'blusa' | 'blazer-masc' | 'blazer-fem'

// ── Detect garment type from free text ────────────────────────────────────────
export function detectGarment(text: string): GarmentType | null {
  const t = text.toLowerCase()

  // Jacket/blazer — check before generic patterns
  if (/(blazer|jaqueta|jacket|veston|paletó|paleto|سترة|جاكيت|بليزر|كوت|كوتة)/.test(t)) {
    const masc = /(masc|homem|hombre|man\b|men\b|رجال|رجالي|masculine)/i.test(t)
    const fem  = /(fem|mulher|mujer|woman|women|نساء|نسائي|feminine)/i.test(t)
    if (masc) return 'blazer-masc'
    if (fem)  return 'blazer-fem'
    return 'blazer-fem' // default to feminine
  }

  if (/(saia|skirt|jupe|falda|تنورة|جيبة)/.test(t))          return 'saia'
  if (/(cal[çc]a|pant|jean|trouser|بنطلون|سروال)/.test(t))    return 'calca'
  if (/(blusa|camisa|top\b|bodice|shirt|blouse|قميص|بلوزة)/.test(t)) return 'blusa'
  return null
}

export const GARMENT_LABELS: Record<GarmentType, string> = {
  saia:         'Saia Reta',
  calca:        'Calça Básica',
  blusa:        'Blusa Básica',
  'blazer-masc': 'Blazer Masculino',
  'blazer-fem':  'Blazer Feminino',
}

// ── Required fields per garment ───────────────────────────────────────────────
export const REQUIRED_FIELDS: Record<GarmentType, Array<keyof Measurements>> = {
  saia:          ['cintura', 'quadril', 'comprimento'],
  calca:         ['cintura', 'quadril', 'comprimento'],
  blusa:         ['busto',   'cintura', 'comprimento'],
  'blazer-masc': ['busto',   'cintura', 'comprimento'],
  'blazer-fem':  ['busto',   'cintura', 'comprimento'],
}

// ── Optional recommended fields per garment ───────────────────────────────────
export const OPTIONAL_FIELDS: Record<GarmentType, Array<keyof Measurements>> = {
  saia:          ['altura'],
  calca:         ['altura', 'entrepernas', 'coxa', 'joelho'],
  blusa:         ['mangas', 'ombros', 'dorsoCostas'],
  'blazer-masc': ['mangas', 'quadril', 'ombros', 'dorsoCostas', 'pescoco', 'punho'],
  'blazer-fem':  ['mangas', 'quadril', 'ombros', 'dorsoCostas', 'pescoco', 'punho'],
}

// ── Human-readable labels ─────────────────────────────────────────────────────
export const FIELD_LABELS: Partial<Record<keyof Measurements, string>> = {
  cintura:      'Cintura',
  quadril:      'Quadril',
  busto:        'Busto / Peitoral',
  comprimento:  'Comprimento',
  altura:       'Altura total',
  mangas:       'Comprimento manga',
  ombros:       'Largura ombros',
  pescoco:      'Pescoço (circ.)',
  dorsoCostas:  'Largura costas',
  profCava:     'Prof. cava',
  punho:        'Punho (circ.)',
  bracoCirc:    'Braço (circ.)',
  entrepernas:  'Entrep. (interno)',
  cava:         'Cava (circ.)',
  coxa:         'Coxa (circ.)',
  joelho:       'Joelho (circ.)',
  tornozelo:    'Tornozelo (circ.)',
}

// ── Generate pattern ──────────────────────────────────────────────────────────
export function generatePattern(type: GarmentType, m: Measurements): PatternData {
  switch (type) {
    case 'saia':         return generateSaiaReta(m)
    case 'calca':        return generateCalca(m)
    case 'blusa':        return generateBlusa(m)
    case 'blazer-masc':  return generateBlazerMasculino(m)
    case 'blazer-fem':   return generateBlazerFeminino(m)
  }
}
