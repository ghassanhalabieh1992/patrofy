"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type {
  PatternType, PatternComponent, Measurement, PatternTypeMeasurement,
  Formula, ConstructionRule, EaseRule, ValidationRule,
  PatternReferenceFile, PatternPoint, PatternSizeValue, ExpertNote, UserRole, ExpressionType, ReferenceFileType,
} from "@/lib/knowledge/types";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/knowledge/types";

// Supabase Storage rejects keys with non-ASCII characters (accents, Arabic, etc.)
// — strip the original filename down to something storage-safe, keeping the extension.
function safeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot > 0 ? name.slice(dot) : "";
  const base = name
    .slice(0, dot > 0 ? dot : name.length)
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return (base || "arquivo") + ext;
}

type Tab = "info" | "components" | "measurements" | "sizes" | "formulas" | "rules" | "files" | "points" | "notes";

const TABS: { id: Tab; label: string }[] = [
  { id: "info", label: "Dados básicos" },
  { id: "components", label: "Peças" },
  { id: "measurements", label: "Medidas" },
  { id: "sizes", label: "Tabela de Tamanhos" },
  { id: "formulas", label: "Fórmulas" },
  { id: "rules", label: "Regras" },
  { id: "files", label: "Arquivos de referência" },
  { id: "points", label: "Pontos (A,B,C)" },
  { id: "notes", label: "Notas" },
];

export default function PatternEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>("user");
  const [tab, setTab] = useState<Tab>("info");
  const [loading, setLoading] = useState(true);

  const [pattern, setPattern] = useState<PatternType | null>(null);
  const [components, setComponents] = useState<PatternComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);

  const [measurementsDict, setMeasurementsDict] = useState<Measurement[]>([]);
  const [patternMeasurements, setPatternMeasurements] = useState<PatternTypeMeasurement[]>([]);
  const [sizeValues, setSizeValues] = useState<PatternSizeValue[]>([]);

  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [constructionRules, setConstructionRules] = useState<ConstructionRule[]>([]);
  const [easeRules, setEaseRules] = useState<EaseRule[]>([]);
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [referenceFiles, setReferenceFiles] = useState<PatternReferenceFile[]>([]);
  const [patternLevelFiles, setPatternLevelFiles] = useState<PatternReferenceFile[]>([]);
  const [points, setPoints] = useState<PatternPoint[]>([]);
  const [notes, setNotes] = useState<ExpertNote[]>([]);

  const [error, setError] = useState("");

  const isOwner = !!userId && pattern?.created_by === userId;
  const isAdmin = role === "admin";
  const canEdit = isAdmin || (isOwner && pattern?.status !== "approved");

  // ── Load everything ──────────────────────────────────────────────
  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUserId(user.id);

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    setRole((profile?.role as UserRole) ?? "user");

    const { data: pt, error: ptErr } = await supabase.from("pattern_types").select("*").eq("id", id).single();
    if (ptErr || !pt) { setError("Padrão não encontrado ou você não tem permissão de acesso."); setLoading(false); return; }
    setPattern(pt as PatternType);

    const { data: comps } = await supabase.from("pattern_components").select("*").eq("pattern_type_id", id).order("order_index");
    setComponents((comps as PatternComponent[]) ?? []);
    if (comps && comps.length > 0) setSelectedComponentId((prev) => prev ?? comps[0].id);

    const { data: mDict } = await supabase.from("measurements").select("*").order("code");
    setMeasurementsDict((mDict as Measurement[]) ?? []);

    const { data: pm } = await supabase.from("pattern_type_measurements").select("*").eq("pattern_type_id", id);
    setPatternMeasurements((pm as PatternTypeMeasurement[]) ?? []);

    const { data: sv } = await supabase.from("pattern_size_values").select("*").eq("pattern_type_id", id);
    setSizeValues((sv as PatternSizeValue[]) ?? []);

    const { data: cr } = await supabase.from("construction_rules").select("*").eq("pattern_type_id", id);
    setConstructionRules((cr as ConstructionRule[]) ?? []);

    const { data: vr } = await supabase.from("validation_rules").select("*").eq("pattern_type_id", id);
    setValidationRules((vr as ValidationRule[]) ?? []);

    const { data: nt } = await supabase.from("expert_notes").select("*").eq("entity_type", "pattern_type").eq("entity_id", id).order("created_at", { ascending: false });
    setNotes((nt as ExpertNote[]) ?? []);

    const { data: plf } = await supabase.from("pattern_reference_files").select("*").eq("pattern_type_id", id).order("created_at", { ascending: false });
    setPatternLevelFiles((plf as PatternReferenceFile[]) ?? []);

    setLoading(false);
  }, [id, router, supabase]);

  useEffect(() => { load(); }, [load]);

  // ── Load per-component data when selection changes ──────────────
  const loadComponentData = useCallback(async (componentId: string) => {
    const { data: f } = await supabase.from("formulas").select("*").eq("pattern_component_id", componentId).order("order_index");
    setFormulas((f as Formula[]) ?? []);

    const { data: e } = await supabase.from("ease_rules").select("*").eq("pattern_component_id", componentId);
    setEaseRules((e as EaseRule[]) ?? []);

    const { data: rf } = await supabase.from("pattern_reference_files").select("*").eq("pattern_component_id", componentId).order("created_at", { ascending: false });
    setReferenceFiles((rf as PatternReferenceFile[]) ?? []);

    const { data: pts } = await supabase.from("pattern_points").select("*").eq("pattern_component_id", componentId);
    setPoints((pts as PatternPoint[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    if (selectedComponentId) loadComponentData(selectedComponentId);
  }, [selectedComponentId, loadComponentData]);

  // ── Actions ───────────────────────────────────────────────────────
  async function updateBasicInfo(name: string, category: string, description: string) {
    await supabase.from("pattern_types").update({ name, category, description }).eq("id", id);
    load();
  }

  async function submitForReview() {
    await supabase.from("pattern_types").update({ status: "pending_review" }).eq("id", id);
    load();
  }

  async function deletePattern() {
    if (!confirm(`Excluir o padrão "${pattern?.name}" e tudo dentro dele (peças, fórmulas, regras, arquivos)? Essa ação não pode ser desfeita.`)) return;

    const { data: componentFiles } = await supabase
      .from("pattern_reference_files")
      .select("file_url, pattern_components!inner(pattern_type_id)")
      .eq("pattern_components.pattern_type_id", id);
    const { data: patternFiles } = await supabase
      .from("pattern_reference_files")
      .select("file_url")
      .eq("pattern_type_id", id);
    const paths = [
      ...((componentFiles as unknown as { file_url: string }[]) ?? []),
      ...((patternFiles as unknown as { file_url: string }[]) ?? []),
    ].map((f) => f.file_url);
    if (paths.length > 0) await supabase.storage.from("pattern-references").remove(paths);

    await supabase.from("expert_notes").delete().eq("entity_type", "pattern_type").eq("entity_id", id);
    await supabase.from("pattern_types").delete().eq("id", id);
    router.push("/expert");
  }

  async function reviewDecision(decision: "approved" | "rejected") {
    if (!userId) return;
    await supabase.from("pattern_types").update({
      status: decision,
      reviewed_by: userId,
      approved_at: decision === "approved" ? new Date().toISOString() : null,
    }).eq("id", id);
    load();
  }

  async function addComponent(name: string) {
    await supabase.from("pattern_components").insert({ pattern_type_id: id, name, order_index: components.length });
    load();
  }

  async function deleteComponent(componentId: string) {
    await supabase.from("pattern_components").delete().eq("id", componentId);
    if (selectedComponentId === componentId) setSelectedComponentId(null);
    load();
  }

  async function addMeasurement(code: string, label_pt: string, unit: string) {
    const { data, error: insErr } = await supabase
      .from("measurements")
      .insert({ code, label_pt, unit })
      .select()
      .single();
    if (insErr) { setError(insErr.message); return; }
    setMeasurementsDict((prev) => [...prev, data as Measurement].sort((a, b) => a.code.localeCompare(b.code)));
  }

  async function toggleMeasurement(measurementId: string, assigned: boolean, isRequired: boolean) {
    if (assigned) {
      await supabase.from("pattern_type_measurements").delete().eq("pattern_type_id", id).eq("measurement_id", measurementId);
    } else {
      await supabase.from("pattern_type_measurements").insert({ pattern_type_id: id, measurement_id: measurementId, is_required: isRequired });
    }
    const { data: pm } = await supabase.from("pattern_type_measurements").select("*").eq("pattern_type_id", id);
    setPatternMeasurements((pm as PatternTypeMeasurement[]) ?? []);
  }

  async function setSizeValue(sizeLabel: string, measurementId: string, valueCm: number | null) {
    if (valueCm === null) {
      await supabase.from("pattern_size_values").delete()
        .eq("pattern_type_id", id).eq("size_label", sizeLabel).eq("measurement_id", measurementId);
    } else {
      await supabase.from("pattern_size_values").upsert(
        { pattern_type_id: id, size_label: sizeLabel, measurement_id: measurementId, value_cm: valueCm },
        { onConflict: "pattern_type_id,size_label,measurement_id" }
      );
    }
    const { data: sv } = await supabase.from("pattern_size_values").select("*").eq("pattern_type_id", id);
    setSizeValues((sv as PatternSizeValue[]) ?? []);
  }

  async function removeSize(sizeLabel: string) {
    await supabase.from("pattern_size_values").delete().eq("pattern_type_id", id).eq("size_label", sizeLabel);
    const { data: sv } = await supabase.from("pattern_size_values").select("*").eq("pattern_type_id", id);
    setSizeValues((sv as PatternSizeValue[]) ?? []);
  }

  async function addFormula(point_name: string, expression: string, expression_type: ExpressionType) {
    if (!selectedComponentId) return;
    await supabase.from("formulas").insert({ pattern_component_id: selectedComponentId, point_name, expression, expression_type, order_index: formulas.length });
    loadComponentData(selectedComponentId);
  }

  async function deleteFormula(formulaId: string) {
    await supabase.from("formulas").delete().eq("id", formulaId);
    if (selectedComponentId) loadComponentData(selectedComponentId);
  }

  async function addConstructionRule(condition_expression: string, adjustment_formula: string, priority: number) {
    await supabase.from("construction_rules").insert({ pattern_type_id: id, condition_expression, adjustment_formula, priority });
    const { data: cr } = await supabase.from("construction_rules").select("*").eq("pattern_type_id", id);
    setConstructionRules((cr as ConstructionRule[]) ?? []);
  }

  async function deleteConstructionRule(ruleId: string) {
    await supabase.from("construction_rules").delete().eq("id", ruleId);
    const { data: cr } = await supabase.from("construction_rules").select("*").eq("pattern_type_id", id);
    setConstructionRules((cr as ConstructionRule[]) ?? []);
  }

  async function addEaseRule(fabric_type: string, ease_cm: number, notesText: string) {
    if (!selectedComponentId) return;
    await supabase.from("ease_rules").insert({ pattern_component_id: selectedComponentId, fabric_type, ease_cm, notes: notesText });
    loadComponentData(selectedComponentId);
  }

  async function deleteEaseRule(ruleId: string) {
    await supabase.from("ease_rules").delete().eq("id", ruleId);
    if (selectedComponentId) loadComponentData(selectedComponentId);
  }

  async function addValidationRule(rule_type: string, expression: string, error_message: string) {
    await supabase.from("validation_rules").insert({ pattern_type_id: id, rule_type, expression, error_message });
    const { data: vr } = await supabase.from("validation_rules").select("*").eq("pattern_type_id", id);
    setValidationRules((vr as ValidationRule[]) ?? []);
  }

  async function deleteValidationRule(ruleId: string) {
    await supabase.from("validation_rules").delete().eq("id", ruleId);
    const { data: vr } = await supabase.from("validation_rules").select("*").eq("pattern_type_id", id);
    setValidationRules((vr as ValidationRule[]) ?? []);
  }

  async function uploadReferenceFile(file: File, fileType: ReferenceFileType, notesText: string) {
    if (!selectedComponentId || !userId) return;
    const path = `${userId}/${id}/${selectedComponentId}/${Date.now()}-${safeFileName(file.name)}`;
    const { error: upErr } = await supabase.storage.from("pattern-references").upload(path, file);
    if (upErr) { setError(upErr.message); return; }
    await supabase.from("pattern_reference_files").insert({
      pattern_component_id: selectedComponentId, file_url: path, file_type: fileType, uploaded_by: userId, notes: notesText,
    });
    loadComponentData(selectedComponentId);
  }

  async function uploadPatternLevelFile(file: File, fileType: ReferenceFileType, notesText: string) {
    if (!userId) return;
    const path = `${userId}/${id}/_padrao-completo/${Date.now()}-${safeFileName(file.name)}`;
    const { error: upErr } = await supabase.storage.from("pattern-references").upload(path, file);
    if (upErr) { setError(upErr.message); return; }
    await supabase.from("pattern_reference_files").insert({
      pattern_type_id: id, file_url: path, file_type: fileType, uploaded_by: userId, notes: notesText,
    });
    const { data: plf } = await supabase.from("pattern_reference_files").select("*").eq("pattern_type_id", id).order("created_at", { ascending: false });
    setPatternLevelFiles((plf as PatternReferenceFile[]) ?? []);
  }

  async function deleteReferenceFile(fileId: string, fileUrl: string) {
    await supabase.storage.from("pattern-references").remove([fileUrl]);
    await supabase.from("pattern_reference_files").delete().eq("id", fileId);
    if (selectedComponentId) loadComponentData(selectedComponentId);
    const { data: plf } = await supabase.from("pattern_reference_files").select("*").eq("pattern_type_id", id).order("created_at", { ascending: false });
    setPatternLevelFiles((plf as PatternReferenceFile[]) ?? []);
  }

  async function addPoint(label: string, x_cm: number, y_cm: number) {
    if (!selectedComponentId) return;
    await supabase.from("pattern_points").insert({ pattern_component_id: selectedComponentId, label, x_cm, y_cm });
    loadComponentData(selectedComponentId);
  }

  async function deletePoint(pointId: string) {
    await supabase.from("pattern_points").delete().eq("id", pointId);
    if (selectedComponentId) loadComponentData(selectedComponentId);
  }

  async function addNote(text: string) {
    if (!userId) return;
    await supabase.from("expert_notes").insert({ entity_type: "pattern_type", entity_id: id, note_text: text, created_by: userId });
    const { data: nt } = await supabase.from("expert_notes").select("*").eq("entity_type", "pattern_type").eq("entity_id", id).order("created_at", { ascending: false });
    setNotes((nt as ExpertNote[]) ?? []);
  }

  // ── Render ────────────────────────────────────────────────────────
  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-slate-500">Carregando...</div>;
  if (error && !pattern) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-red-400">{error}</div>;
  if (!pattern) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
        <Link href="/expert" className="text-sm text-slate-400 hover:text-white transition-colors">← Portal do Especialista</Link>
        <h1 className="text-lg font-bold">{pattern.name}</h1>
        <span className={`text-xs px-3 py-1 rounded-full border ${STATUS_COLORS[pattern.status]}`}>{STATUS_LABELS[pattern.status]}</span>

        <div className="ml-auto flex gap-2">
          {isOwner && pattern.status === "draft" && (
            <button onClick={submitForReview} className="bg-purple-600 hover:bg-purple-500 transition-colors px-4 py-2 rounded-xl text-sm font-medium">
              Enviar para revisão
            </button>
          )}
          {isAdmin && pattern.status === "pending_review" && (
            <>
              <button onClick={() => reviewDecision("approved")} className="bg-green-600 hover:bg-green-500 transition-colors px-4 py-2 rounded-xl text-sm font-medium">
                Aprovar
              </button>
              <button onClick={() => reviewDecision("rejected")} className="bg-red-600 hover:bg-red-500 transition-colors px-4 py-2 rounded-xl text-sm font-medium">
                Rejeitar
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex">
        {/* Tabs */}
        <nav className="w-52 flex-shrink-0 border-r border-white/10 p-3 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full text-right px-3 py-2.5 rounded-xl text-sm transition-colors ${
                tab === t.id ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <main className="flex-1 p-6 max-w-3xl">
          {!canEdit && (
            <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 mb-4">
              Este padrão está aprovado ou você não tem permissão para editá-lo — somente leitura.
            </p>
          )}
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          {tab === "info" && <InfoTab pattern={pattern} canEdit={canEdit} onSave={updateBasicInfo} onDelete={deletePattern} />}

          {tab === "components" && (
            <ComponentsTab
              components={components}
              selectedId={selectedComponentId}
              canEdit={canEdit}
              onSelect={setSelectedComponentId}
              onAdd={addComponent}
              onDelete={deleteComponent}
            />
          )}

          {tab === "measurements" && (
            <MeasurementsTab
              dict={measurementsDict}
              assigned={patternMeasurements}
              canEdit={canEdit}
              onToggle={toggleMeasurement}
              onAddMeasurement={addMeasurement}
            />
          )}

          {tab === "sizes" && (
            <SizesTab
              dict={measurementsDict}
              assigned={patternMeasurements}
              values={sizeValues}
              canEdit={canEdit}
              onSetValue={setSizeValue}
              onRemoveSize={removeSize}
            />
          )}

          {tab === "formulas" && (
            <FormulasTab
              components={components}
              selectedComponentId={selectedComponentId}
              onSelectComponent={setSelectedComponentId}
              formulas={formulas}
              canEdit={canEdit}
              onAdd={addFormula}
              onDelete={deleteFormula}
            />
          )}

          {tab === "rules" && (
            <RulesTab
              components={components}
              selectedComponentId={selectedComponentId}
              onSelectComponent={setSelectedComponentId}
              constructionRules={constructionRules}
              easeRules={easeRules}
              validationRules={validationRules}
              canEdit={canEdit}
              onAddConstruction={addConstructionRule}
              onDeleteConstruction={deleteConstructionRule}
              onAddEase={addEaseRule}
              onDeleteEase={deleteEaseRule}
              onAddValidation={addValidationRule}
              onDeleteValidation={deleteValidationRule}
            />
          )}

          {tab === "files" && (
            <FilesTab
              components={components}
              selectedComponentId={selectedComponentId}
              onSelectComponent={setSelectedComponentId}
              files={referenceFiles}
              patternLevelFiles={patternLevelFiles}
              canEdit={canEdit}
              onUpload={uploadReferenceFile}
              onUploadPatternLevel={uploadPatternLevelFile}
              onDelete={deleteReferenceFile}
            />
          )}

          {tab === "points" && (
            <PointsTab
              components={components}
              selectedComponentId={selectedComponentId}
              onSelectComponent={setSelectedComponentId}
              points={points}
              canEdit={canEdit}
              onAdd={addPoint}
              onDelete={deletePoint}
            />
          )}

          {tab === "notes" && <NotesTab notes={notes} onAdd={addNote} />}
        </main>
      </div>
    </div>
  );
}

// ── Shared small components ────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-slate-300">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400";
const btnCls = "bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-colors px-4 py-2 rounded-xl text-sm font-medium";

// ── Tabs ──────────────────────────────────────────────────────────

function InfoTab({ pattern, canEdit, onSave, onDelete }: {
  pattern: PatternType; canEdit: boolean; onSave: (name: string, category: string, description: string) => void; onDelete: () => void;
}) {
  const [name, setName] = useState(pattern.name);
  const [category, setCategory] = useState(pattern.category);
  const [description, setDescription] = useState(pattern.description ?? "");
  return (
    <div className="flex flex-col gap-8 max-w-md">
      <form onSubmit={(e) => { e.preventDefault(); onSave(name, category, description); }} className="flex flex-col gap-4">
        <Field label="Nome do padrão">
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} className={inputCls} />
        </Field>
        <Field label="Categoria">
          <input value={category} onChange={(e) => setCategory(e.target.value)} disabled={!canEdit} className={inputCls} />
        </Field>
        <Field label="Descrição do modelo">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canEdit}
            rows={4}
            placeholder="Detalhes do modelo: gola, mangas, pences, caimento, público-alvo..."
            className={inputCls + " w-full resize-none"}
          />
        </Field>
        {canEdit && <button type="submit" className={btnCls}>Salvar</button>}
      </form>

      {canEdit && (
        <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-4">
          <p className="text-sm text-red-300 font-medium mb-1">Zona de risco</p>
          <p className="text-xs text-slate-400 mb-3">
            Exclui o padrão inteiro e tudo dentro dele (peças, fórmulas, regras, arquivos). Não pode ser desfeito.
          </p>
          <button
            onClick={onDelete}
            className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 transition-colors px-4 py-2 rounded-xl text-sm font-medium"
          >
            Excluir padrão
          </button>
        </div>
      )}
    </div>
  );
}

function ComponentsTab({ components, selectedId, canEdit, onSelect, onAdd, onDelete }: {
  components: PatternComponent[]; selectedId: string | null; canEdit: boolean;
  onSelect: (id: string) => void; onAdd: (name: string) => void; onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  return (
    <div className="flex flex-col gap-4">
      {canEdit && (
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) { onAdd(name); setName(""); } }} className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Frente / Costas / Manga..." className={inputCls + " flex-1"} />
          <button type="submit" className={btnCls}>Adicionar</button>
        </form>
      )}
      <div className="grid gap-2">
        {components.map((c) => (
          <div key={c.id} onClick={() => onSelect(c.id)} className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
            selectedId === c.id ? "bg-purple-600/20 border-purple-500/40" : "bg-white/5 border-white/10 hover:bg-white/10"
          }`}>
            <span>{c.name}</span>
            {canEdit && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="text-red-400 hover:text-red-300 text-xs">Excluir</button>
            )}
          </div>
        ))}
        {components.length === 0 && <p className="text-slate-500 text-sm">Nenhuma peça ainda.</p>}
      </div>
    </div>
  );
}

function MeasurementsTab({ dict, assigned, canEdit, onToggle, onAddMeasurement }: {
  dict: Measurement[]; assigned: PatternTypeMeasurement[]; canEdit: boolean;
  onToggle: (measurementId: string, assigned: boolean, isRequired: boolean) => void;
  onAddMeasurement: (code: string, label_pt: string, unit: string) => void;
}) {
  const [showNew, setShowNew] = useState(false);
  const [code, setCode] = useState("");
  const [labelPt, setLabelPt] = useState("");
  const [unit, setUnit] = useState("cm");

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2">
        {dict.map((m) => {
          const a = assigned.find((x) => x.measurement_id === m.id);
          return (
            <label key={m.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <input
                type="checkbox"
                checked={!!a}
                disabled={!canEdit}
                onChange={() => onToggle(m.id, !!a, true)}
                className="w-4 h-4"
              />
              <span className="flex-1">{m.label_pt}</span>
              <span className="text-xs text-slate-500">{m.code} ({m.unit})</span>
            </label>
          );
        })}
      </div>

      {canEdit && (
        showNew ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim() && labelPt.trim()) {
                onAddMeasurement(code.trim(), labelPt.trim(), unit.trim() || "cm");
                setCode(""); setLabelPt(""); setUnit("cm"); setShowNew(false);
              }
            }}
            className="flex flex-col gap-2 p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <p className="text-sm text-slate-300 mb-1">Nova medida (quando nenhuma das 17 acima serve)</p>
            <div className="flex gap-2">
              <Field label="Código (sem espaços/acentos)">
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="circAbdomen" className={inputCls + " w-full"} />
              </Field>
              <Field label="Nome exibido">
                <input value={labelPt} onChange={(e) => setLabelPt(e.target.value)} placeholder="Circunferência do abdômen" className={inputCls + " w-full"} />
              </Field>
              <Field label="Unidade">
                <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="cm" className={inputCls + " w-20"} />
              </Field>
            </div>
            <div className="flex gap-2">
              <button type="submit" className={btnCls}>Adicionar medida</button>
              <button type="button" onClick={() => setShowNew(false)} className="text-slate-400 hover:text-white text-sm px-4 py-2">Cancelar</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowNew(true)} className="text-sm text-purple-300 hover:text-purple-200 transition-colors self-start">
            + Adicionar nova medida
          </button>
        )
      )}
    </div>
  );
}

function SizesTab({ dict, assigned, values, canEdit, onSetValue, onRemoveSize }: {
  dict: Measurement[]; assigned: PatternTypeMeasurement[]; values: PatternSizeValue[]; canEdit: boolean;
  onSetValue: (sizeLabel: string, measurementId: string, valueCm: number | null) => void;
  onRemoveSize: (sizeLabel: string) => void;
}) {
  const [newSize, setNewSize] = useState("");
  const [pendingSizes, setPendingSizes] = useState<string[]>([]);

  const activeMeasurements = dict.filter((m) => assigned.some((a) => a.measurement_id === m.id));
  const sizes = Array.from(new Set([...values.map((v) => v.size_label), ...pendingSizes]));

  if (activeMeasurements.length === 0) {
    return <p className="text-slate-500 text-sm max-w-md">Marque pelo menos uma medida na aba &quot;Medidas&quot; antes de montar a tabela de tamanhos.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-slate-500 max-w-lg">
        Tabela de referência (P, M, G, GG...) só para consulta e conferência sua — não afeta o que é gerado para o cliente, que sempre usa as medidas reais dele nas fórmulas.
      </p>

      {canEdit && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const label = newSize.trim().toUpperCase();
            if (label && !sizes.includes(label)) setPendingSizes((prev) => [...prev, label]);
            setNewSize("");
          }}
          className="flex gap-2"
        >
          <input value={newSize} onChange={(e) => setNewSize(e.target.value)} placeholder="GG" className={inputCls + " w-28"} />
          <button type="submit" className={btnCls}>+ Tamanho</button>
        </form>
      )}

      {sizes.length === 0 ? (
        <p className="text-slate-500 text-sm">Nenhum tamanho adicionado ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-slate-400">
                <th className="py-2 pr-4 font-medium">Medida</th>
                {sizes.map((size) => (
                  <th key={size} className="py-2 px-2 font-medium text-center">
                    <div className="flex items-center gap-1 justify-center">
                      {size}
                      {canEdit && (
                        <button
                          onClick={() => { onRemoveSize(size); setPendingSizes((prev) => prev.filter((s) => s !== size)); }}
                          className="text-red-400 hover:text-red-300"
                          title="Remover tamanho"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeMeasurements.map((m) => (
                <tr key={m.id} className="border-b border-white/5">
                  <td className="py-2 pr-4 text-slate-300 whitespace-nowrap">{m.label_pt}</td>
                  {sizes.map((size) => {
                    const v = values.find((x) => x.size_label === size && x.measurement_id === m.id);
                    return (
                      <td key={size} className="py-1.5 px-2">
                        <input
                          type="number"
                          step="0.1"
                          defaultValue={v?.value_cm ?? ""}
                          disabled={!canEdit}
                          onBlur={(e) => {
                            const raw = e.target.value.trim();
                            onSetValue(size, m.id, raw === "" ? null : parseFloat(raw));
                          }}
                          className={inputCls + " w-20 text-center"}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ComponentPicker({ components, selectedComponentId, onSelectComponent }: {
  components: PatternComponent[]; selectedComponentId: string | null; onSelectComponent: (id: string) => void;
}) {
  if (components.length === 0) return <p className="text-slate-500 text-sm mb-4">Adicione uma peça primeiro na aba &quot;Peças&quot;.</p>;
  return (
    <select value={selectedComponentId ?? ""} onChange={(e) => onSelectComponent(e.target.value)} className={inputCls + " mb-4"}>
      {components.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  );
}

function FormulasTab({ components, selectedComponentId, onSelectComponent, formulas, canEdit, onAdd, onDelete }: {
  components: PatternComponent[]; selectedComponentId: string | null; onSelectComponent: (id: string) => void;
  formulas: Formula[]; canEdit: boolean;
  onAdd: (pointName: string, expression: string, type: ExpressionType) => void; onDelete: (id: string) => void;
}) {
  const [pointName, setPointName] = useState("");
  const [expression, setExpression] = useState("");
  const [type, setType] = useState<ExpressionType>("point_x");

  return (
    <div>
      <ComponentPicker components={components} selectedComponentId={selectedComponentId} onSelectComponent={onSelectComponent} />
      {selectedComponentId && (
        <>
          <div className="text-xs text-slate-400 mb-4 max-w-lg bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
            <p>
              <strong className="text-slate-300">Nome</strong> é só um rótulo para identificar a fórmula — o sistema não entende nada sobre ela a partir do nome. <strong className="text-slate-300">Tipo</strong> é o que diz o que aquele número representa geometricamente:
            </p>
            <ul className="list-disc pr-4 space-y-0.5">
              <li><span className="font-mono text-purple-300">point_x</span> — coordenada horizontal de um ponto</li>
              <li><span className="font-mono text-purple-300">point_y</span> — coordenada vertical de um ponto</li>
              <li><span className="font-mono text-purple-300">distance</span> — um comprimento isolado (ex: profundidade de um pence)</li>
              <li><span className="font-mono text-purple-300">angle</span> — um ângulo em graus</li>
            </ul>
            <p>
              Um ponto completo (com X e Y) precisa de <strong className="text-slate-300">duas linhas com o mesmo nome</strong>, uma de cada tipo:
            </p>
            <p className="font-mono bg-slate-900/60 rounded-lg p-2 leading-relaxed">
              P1_cintura | point_x | cintura / 4 + 1<br/>
              P1_cintura | point_y | altura_gancho
            </p>
          </div>
          {canEdit && (
            <form onSubmit={(e) => { e.preventDefault(); if (pointName && expression) { onAdd(pointName, expression, type); setPointName(""); setExpression(""); } }} className="flex flex-col gap-3 mb-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Field label="Nome do ponto">
                    <input value={pointName} onChange={(e) => setPointName(e.target.value)} placeholder="P1_cintura" className={inputCls + " w-full"} />
                  </Field>
                </div>
                <Field label="Tipo">
                  <select value={type} onChange={(e) => setType(e.target.value as ExpressionType)} className={inputCls}>
                    <option value="point_x">point_x — Coordenada X (horizontal)</option>
                    <option value="point_y">point_y — Coordenada Y (vertical)</option>
                    <option value="distance">distance — Distância / comprimento</option>
                    <option value="angle">angle — Ângulo (graus)</option>
                  </select>
                </Field>
              </div>
              <Field label="Fórmula — apenas a expressão, sem o nome do ponto e sem sinal de igual (=)">
                <input value={expression} onChange={(e) => setExpression(e.target.value)} placeholder="cintura / 4 + 1" className={inputCls + " w-full font-mono"} />
              </Field>
              <button type="submit" className={btnCls + " self-start"}>Adicionar fórmula</button>
            </form>
          )}
          <div className="grid gap-2">
            {formulas.map((f) => (
              <div key={f.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <span className="font-mono text-purple-300">{f.point_name}</span>
                  <span className="text-slate-500 mx-2">=</span>
                  <span className="font-mono">{f.expression}</span>
                  <span className="text-xs text-slate-500 mr-2">({f.expression_type})</span>
                </div>
                {canEdit && <button onClick={() => onDelete(f.id)} className="text-red-400 hover:text-red-300 text-xs">Excluir</button>}
              </div>
            ))}
            {formulas.length === 0 && <p className="text-slate-500 text-sm">Nenhuma fórmula ainda para esta peça.</p>}
          </div>
        </>
      )}
    </div>
  );
}

function RulesTab({ components, selectedComponentId, onSelectComponent, constructionRules, easeRules, validationRules, canEdit,
  onAddConstruction, onDeleteConstruction, onAddEase, onDeleteEase, onAddValidation, onDeleteValidation }: {
  components: PatternComponent[]; selectedComponentId: string | null; onSelectComponent: (id: string) => void;
  constructionRules: ConstructionRule[]; easeRules: EaseRule[]; validationRules: ValidationRule[]; canEdit: boolean;
  onAddConstruction: (cond: string, adj: string, priority: number) => void; onDeleteConstruction: (id: string) => void;
  onAddEase: (fabric: string, ease: number, notes: string) => void; onDeleteEase: (id: string) => void;
  onAddValidation: (type: string, expr: string, msg: string) => void; onDeleteValidation: (id: string) => void;
}) {
  const [cond, setCond] = useState(""); const [adj, setAdj] = useState("");
  const [fabric, setFabric] = useState(""); const [ease, setEase] = useState("");
  const [vType, setVType] = useState(""); const [vExpr, setVExpr] = useState(""); const [vMsg, setVMsg] = useState("");

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="font-semibold mb-3">Regras de construção (nível do padrão)</h3>
        {canEdit && (
          <form onSubmit={(e) => { e.preventDefault(); if (cond && adj) { onAddConstruction(cond, adj, 0); setCond(""); setAdj(""); } }} className="flex gap-2 mb-3">
            <input value={cond} onChange={(e) => setCond(e.target.value)} placeholder="Condição: quadril - cintura > 12" className={inputCls + " flex-1"} />
            <input value={adj} onChange={(e) => setAdj(e.target.value)} placeholder="Ajuste: +1.5" className={inputCls + " flex-1"} />
            <button type="submit" className={btnCls}>Adicionar</button>
          </form>
        )}
        <div className="grid gap-2">
          {constructionRules.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <span className="font-mono text-sm">Se ({r.condition_expression}) → {r.adjustment_formula}</span>
              {canEdit && <button onClick={() => onDeleteConstruction(r.id)} className="text-red-400 hover:text-red-300 text-xs">Excluir</button>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-3">Regras de folga (por peça)</h3>
        <ComponentPicker components={components} selectedComponentId={selectedComponentId} onSelectComponent={onSelectComponent} />
        {selectedComponentId && (
          <>
            {canEdit && (
              <form onSubmit={(e) => { e.preventDefault(); if (ease) { onAddEase(fabric, parseFloat(ease), ""); setFabric(""); setEase(""); } }} className="flex gap-2 mb-3">
                <input value={fabric} onChange={(e) => setFabric(e.target.value)} placeholder="Tipo de tecido (algodão)" className={inputCls + " flex-1"} />
                <input value={ease} onChange={(e) => setEase(e.target.value)} type="number" step="0.1" placeholder="cm" className={inputCls + " w-28"} />
                <button type="submit" className={btnCls}>Adicionar</button>
              </form>
            )}
            <div className="grid gap-2">
              {easeRules.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                  <span>{r.fabric_type ?? "Geral"} — {r.ease_cm} cm</span>
                  {canEdit && <button onClick={() => onDeleteEase(r.id)} className="text-red-400 hover:text-red-300 text-xs">Excluir</button>}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section>
        <h3 className="font-semibold mb-3">Regras de validação geométrica (nível do padrão)</h3>
        {canEdit && (
          <form onSubmit={(e) => { e.preventDefault(); if (vExpr && vMsg) { onAddValidation(vType || "geometry", vExpr, vMsg); setVType(""); setVExpr(""); setVMsg(""); } }} className="flex flex-col gap-2 mb-3">
            <div className="flex gap-2">
              <input value={vType} onChange={(e) => setVType(e.target.value)} placeholder="Tipo (geometry)" className={inputCls + " w-40"} />
              <input value={vExpr} onChange={(e) => setVExpr(e.target.value)} placeholder="Condição" className={inputCls + " flex-1"} />
            </div>
            <input value={vMsg} onChange={(e) => setVMsg(e.target.value)} placeholder="Mensagem de erro" className={inputCls} />
            <button type="submit" className={btnCls + " self-start"}>Adicionar</button>
          </form>
        )}
        <div className="grid gap-2">
          {validationRules.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-sm"><span className="text-slate-500">[{r.rule_type}]</span> {r.expression} — {r.error_message}</span>
              {canEdit && <button onClick={() => onDeleteValidation(r.id)} className="text-red-400 hover:text-red-300 text-xs">Excluir</button>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FileUploadForm({ canEdit, onUpload }: {
  canEdit: boolean;
  onUpload: (file: File, type: ReferenceFileType, notes: string) => void;
}) {
  const [fileType, setFileType] = useState<ReferenceFileType>("image");
  const [notesText, setNotesText] = useState("");
  const [pending, setPending] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!canEdit) return null;

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (pending) { onUpload(pending, fileType, notesText); setPending(null); setNotesText(""); } }} className="flex flex-col gap-2 mb-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf,.dxf,.ads,.amk,.adsx,.amkx"
        onChange={(e) => setPending(e.target.files?.[0] ?? null)}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="self-start text-sm bg-white/10 hover:bg-white/15 border border-white/20 text-white px-4 py-2 rounded-xl transition-colors"
      >
        {pending ? pending.name : "Escolher arquivo"}
      </button>
      <div className="flex gap-2">
        <select value={fileType} onChange={(e) => setFileType(e.target.value as ReferenceFileType)} className={inputCls}>
          <option value="image">Imagem</option>
          <option value="pdf">PDF</option>
          <option value="dxf">DXF</option>
          <option value="ads">ADS (Audaces)</option>
          <option value="amk">AMK (Audaces)</option>
          <option value="adsx">ADSX (Audaces)</option>
          <option value="amkx">AMKX (Audaces)</option>
        </select>
        <input value={notesText} onChange={(e) => setNotesText(e.target.value)} placeholder="Notas" className={inputCls + " flex-1"} />
      </div>
      <button type="submit" disabled={!pending} className={btnCls + " self-start"}>Enviar arquivo</button>
    </form>
  );
}

function FileList({ files, canEdit, onDelete, emptyMessage }: {
  files: PatternReferenceFile[]; canEdit: boolean; onDelete: (id: string, url: string) => void; emptyMessage: string;
}) {
  return (
    <div className="grid gap-2">
      {files.map((f) => (
        <div key={f.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
          <span className="text-sm">[{f.file_type}] {f.file_url.split("/").pop()} {f.notes && `— ${f.notes}`}</span>
          {canEdit && <button onClick={() => onDelete(f.id, f.file_url)} className="text-red-400 hover:text-red-300 text-xs">Excluir</button>}
        </div>
      ))}
      {files.length === 0 && <p className="text-slate-500 text-sm">{emptyMessage}</p>}
    </div>
  );
}

function FilesTab({ components, selectedComponentId, onSelectComponent, files, patternLevelFiles, canEdit, onUpload, onUploadPatternLevel, onDelete }: {
  components: PatternComponent[]; selectedComponentId: string | null; onSelectComponent: (id: string) => void;
  files: PatternReferenceFile[]; patternLevelFiles: PatternReferenceFile[]; canEdit: boolean;
  onUpload: (file: File, type: ReferenceFileType, notes: string) => void;
  onUploadPatternLevel: (file: File, type: ReferenceFileType, notes: string) => void;
  onDelete: (id: string, url: string) => void;
}) {
  const [scope, setScope] = useState<"component" | "pattern">("component");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex bg-white/10 rounded-xl p-1 max-w-md">
        <button
          onClick={() => setScope("component")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${scope === "component" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
        >
          Arquivo de uma peça específica
        </button>
        <button
          onClick={() => setScope("pattern")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${scope === "pattern" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
        >
          Arquivo do padrão completo
        </button>
      </div>

      {scope === "component" ? (
        <div>
          <ComponentPicker components={components} selectedComponentId={selectedComponentId} onSelectComponent={onSelectComponent} />
          {selectedComponentId && (
            <>
              <FileUploadForm canEdit={canEdit} onUpload={onUpload} />
              <FileList files={files} canEdit={canEdit} onDelete={onDelete} emptyMessage="Nenhum arquivo enviado para esta peça." />
            </>
          )}
        </div>
      ) : (
        <div>
          <p className="text-xs text-slate-500 mb-4 max-w-md">
            Use esta opção para um arquivo que representa o padrão inteiro (todas as peças juntas), tipo o desenho técnico completo — não fica preso a uma peça específica.
          </p>
          <FileUploadForm canEdit={canEdit} onUpload={onUploadPatternLevel} />
          <FileList files={patternLevelFiles} canEdit={canEdit} onDelete={onDelete} emptyMessage="Nenhum arquivo do padrão completo enviado ainda." />
        </div>
      )}
    </div>
  );
}

function PointsTab({ components, selectedComponentId, onSelectComponent, points, canEdit, onAdd, onDelete }: {
  components: PatternComponent[]; selectedComponentId: string | null; onSelectComponent: (id: string) => void;
  points: PatternPoint[]; canEdit: boolean;
  onAdd: (label: string, x: number, y: number) => void; onDelete: (id: string) => void;
}) {
  const [label, setLabel] = useState(""); const [x, setX] = useState(""); const [y, setY] = useState("");

  return (
    <div>
      <ComponentPicker components={components} selectedComponentId={selectedComponentId} onSelectComponent={onSelectComponent} />
      {selectedComponentId && (
        <>
          <div className="text-xs text-slate-400 mb-4 max-w-lg bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
            <p>
              Marque aqui os pontos que você mediu manualmente (com régua) direto no desenho original — não são calculados por fórmula. Servem para conferir depois se a fórmula da aba &quot;Fórmulas&quot; bate com o desenho real.
            </p>
            <p>
              <strong className="text-slate-300">Antes de começar:</strong> escolha um ponto fixo no desenho para ser a &quot;origem&quot; (0,0) — por exemplo o canto superior esquerdo da peça. Todas as distâncias X e Y abaixo são medidas a partir desse mesmo ponto de origem, sempre.
            </p>
          </div>
          {canEdit && (
            <form onSubmit={(e) => { e.preventDefault(); if (label && x && y) { onAdd(label, parseFloat(x), parseFloat(y)); setLabel(""); setX(""); setY(""); } }} className="flex gap-2 mb-4">
              <Field label="Letra do ponto no desenho (A, B, C...)">
                <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="A" className={inputCls + " w-full"} />
              </Field>
              <Field label="Distância X a partir da origem — horizontal (cm)">
                <input value={x} onChange={(e) => setX(e.target.value)} type="number" step="0.1" placeholder="0" className={inputCls + " w-full"} />
              </Field>
              <Field label="Distância Y a partir da origem — vertical (cm)">
                <input value={y} onChange={(e) => setY(e.target.value)} type="number" step="0.1" placeholder="0" className={inputCls + " w-full"} />
              </Field>
              <div className="self-end">
                <button type="submit" className={btnCls}>Adicionar ponto</button>
              </div>
            </form>
          )}

          {points.length === 0 ? (
            <p className="text-slate-500 text-sm">Nenhum ponto registrado para esta peça ainda.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-slate-400">
                  <th className="py-2 font-medium">Ponto</th>
                  <th className="py-2 font-medium">X — horizontal (cm)</th>
                  <th className="py-2 font-medium">Y — vertical (cm)</th>
                  {canEdit && <th className="py-2"></th>}
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.id} className="border-b border-white/5">
                    <td className="py-2 font-mono text-purple-300">{p.label}</td>
                    <td className="py-2 font-mono">{p.x_cm}</td>
                    <td className="py-2 font-mono">{p.y_cm}</td>
                    {canEdit && (
                      <td className="py-2 text-right">
                        <button onClick={() => onDelete(p.id)} className="text-red-400 hover:text-red-300 text-xs">Excluir</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

function NotesTab({ notes, onAdd }: { notes: ExpertNote[]; onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onAdd(text); setText(""); } }} className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Nota..." className={inputCls + " flex-1"} />
        <button type="submit" className={btnCls}>Adicionar</button>
      </form>
      <div className="grid gap-2">
        {notes.map((n) => (
          <div key={n.id} className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm">
            {n.note_text}
            <p className="text-xs text-slate-500 mt-1">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
          </div>
        ))}
        {notes.length === 0 && <p className="text-slate-500 text-sm">Nenhuma nota ainda.</p>}
      </div>
    </div>
  );
}
