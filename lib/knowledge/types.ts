// Types for the Knowledge Platform (Expert Portal) — mirrors supabase_schema_knowledge.sql

export type PatternStatus = "draft" | "pending_review" | "approved" | "rejected"
export type UserRole = "user" | "expert" | "admin"
export type ExpressionType = "point_x" | "point_y" | "distance" | "angle"
export type ReferenceFileType = "image" | "pdf" | "dxf" | "ads" | "amk" | "adsx" | "amkx"

export interface Profile {
  id: string
  role: UserRole
  name: string | null
  created_at: string
}

export interface ProfileWithEmail {
  id: string
  email: string
  name: string | null
  role: UserRole
  created_at: string
}

export interface PatternType {
  id: string
  name: string
  category: string
  description: string | null
  status: PatternStatus
  created_by: string
  reviewed_by: string | null
  approved_at: string | null
  created_at: string
}

export interface PatternComponent {
  id: string
  pattern_type_id: string
  name: string
  order_index: number
}

export interface Measurement {
  id: string
  code: string
  label_pt: string
  unit: string
}

export interface PatternTypeMeasurement {
  id: string
  pattern_type_id: string
  measurement_id: string
  is_required: boolean
}

export interface Formula {
  id: string
  pattern_component_id: string
  point_name: string
  expression: string
  expression_type: ExpressionType
  order_index: number
}

export interface ConstructionRule {
  id: string
  pattern_type_id: string
  condition_expression: string
  adjustment_formula: string
  priority: number
}

export interface EaseRule {
  id: string
  pattern_component_id: string
  fabric_type: string | null
  ease_cm: number
  notes: string | null
}

export interface ValidationRule {
  id: string
  pattern_type_id: string
  rule_type: string
  expression: string
  error_message: string
}

export interface PatternReferenceFile {
  id: string
  pattern_component_id: string
  file_url: string
  file_type: ReferenceFileType
  uploaded_by: string
  notes: string | null
  created_at: string
}

export interface PatternPoint {
  id: string
  pattern_component_id: string
  reference_file_id: string | null
  label: string
  x_cm: number
  y_cm: number
  linked_formula_id: string | null
}

export interface ExpertNote {
  id: string
  entity_type: string
  entity_id: string
  note_text: string
  created_by: string
  created_at: string
}

export const STATUS_LABELS: Record<PatternStatus, string> = {
  draft: "Rascunho",
  pending_review: "Em revisão",
  approved: "Aprovado",
  rejected: "Rejeitado",
}

export const STATUS_COLORS: Record<PatternStatus, string> = {
  draft: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  pending_review: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  approved: "bg-green-500/20 text-green-300 border-green-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
}
