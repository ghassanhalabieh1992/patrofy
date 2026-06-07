export type { Measurements, PatternData, PatternPiece, PathCmd, DartInfo, Notch, Pt } from './types'
export { pathToSVG, bboxOfPath, pt } from './types'
export { generateSaiaReta } from './saia'
export { generateCalca }    from './calca'
export { generateBlusa }    from './blusa'

import type { Measurements, PatternData } from './types'
import { generateSaiaReta } from './saia'
import { generateCalca }    from './calca'
import { generateBlusa }    from './blusa'

export type GarmentType = 'saia' | 'calca' | 'blusa'

// Detect garment from user description text
export function detectGarment(text: string): GarmentType | null {
  const t = text.toLowerCase()
  if (/(saia|skirt|jupe)/.test(t)) return 'saia'
  if (/(cal[çc]a|pant|jean|trouser)/.test(t)) return 'calca'
  if (/(blusa|camisa|top|bodice|shirt|blouse)/.test(t)) return 'blusa'
  return null
}

export const GARMENT_LABELS: Record<GarmentType, string> = {
  saia:  'Saia Reta',
  calca: 'Calça Básica',
  blusa: 'Blusa Básica',
}

// Required measurement fields per garment type
export const REQUIRED_FIELDS: Record<GarmentType, Array<keyof Measurements>> = {
  saia:  ['cintura', 'quadril', 'comprimento'],
  calca: ['cintura', 'quadril', 'comprimento'],
  blusa: ['busto', 'cintura', 'comprimento'],
}

export const FIELD_LABELS: Partial<Record<keyof Measurements, string>> = {
  cintura:     'Cintura',
  quadril:     'Quadril',
  busto:       'Busto',
  comprimento: 'Comprimento',
  altura:      'Altura',
  mangas:      'Comprimento da Manga',
}

export function generatePattern(type: GarmentType, m: Measurements): PatternData {
  switch (type) {
    case 'saia':  return generateSaiaReta(m)
    case 'calca': return generateCalca(m)
    case 'blusa': return generateBlusa(m)
  }
}
