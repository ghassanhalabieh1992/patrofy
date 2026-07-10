"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type {
  PatternType, PatternComponent, Measurement, PatternTypeMeasurement,
  Formula, ConstructionRule, EaseRule, ValidationRule,
  PatternReferenceFile, PatternPoint, ExpertNote, UserRole, ExpressionType, ReferenceFileType,
} from "@/lib/knowledge/types";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/knowledge/types";

type Tab = "info" | "components" | "measurements" | "formulas" | "rules" | "files" | "points" | "notes";

const TABS: { id: Tab; label: string }[] = [
  { id: "info", label: "Dados básicos" },
  { id: "components", label: "Peças" },
  { id: "measurements", label: "Medidas" },
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

  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [constructionRules, setConstructionRules] = useState<ConstructionRule[]>([]);
  const [easeRules, setEaseRules] = useState<EaseRule[]>([]);
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([]);
  const [referenceFiles, setReferenceFiles] = useState<PatternReferenceFile[]>([]);
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

    const { data: cr } = await supabase.from("construction_rules").select("*").eq("pattern_type_id", id);
    setConstructionRules((cr as ConstructionRule[]) ?? []);

    const { data: vr } = await supabase.from("validation_rules").select("*").eq("pattern_type_id", id);
    setValidationRules((vr as ValidationRule[]) ?? []);

    const { data: nt } = await supabase.from("expert_notes").select("*").eq("entity_type", "pattern_type").eq("entity_id", id).order("created_at", { ascending: false });
    setNotes((nt as ExpertNote[]) ?? []);

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
  async function updateBasicInfo(name: string, category: string) {
    await supabase.from("pattern_types").update({ name, category }).eq("id", id);
    load();
  }

  async function submitForReview() {
    await supabase.from("pattern_types").update({ status: "pending_review" }).eq("id", id);
    load();
  }

  async function deletePattern() {
    if (!confirm(`Excluir o padrão "${pattern?.name}" e tudo dentro dele (peças, fórmulas, regras, arquivos)? Essa ação não pode ser desfeita.`)) return;

    const { data: files } = await supabase
      .from("pattern_reference_files")
      .select("file_url, pattern_components!inner(pattern_type_id)")
      .eq("pattern_components.pattern_type_id", id);
    const paths = ((files as unknown as { file_url: string }[]) ?? []).map((f) => f.file_url);
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
    const path = `${userId}/${id}/${selectedComponentId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("pattern-references").upload(path, file);
    if (upErr) { setError(upErr.message); return; }
    await supabase.from("pattern_reference_files").insert({
      pattern_component_id: selectedComponentId, file_url: path, file_type: fileType, uploaded_by: userId, notes: notesText,
    });
    loadComponentData(selectedComponentId);
  }

  async function deleteReferenceFile(fileId: string, fileUrl: string) {
    await supabase.storage.from("pattern-references").remove([fileUrl]);
    await supabase.from("pattern_reference_files").delete().eq("id", fileId);
    if (selectedComponentId) loadComponentData(selectedComponentId);
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
              canEdit={canEdit}
              onUpload={uploadReferenceFile}
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
  pattern: PatternType; canEdit: boolean; onSave: (name: string, category: string) => void; onDelete: () => void;
}) {
  const [name, setName] = useState(pattern.name);
  const [category, setCategory] = useState(pattern.category);
  return (
    <div className="flex flex-col gap-8 max-w-md">
      <form onSubmit={(e) => { e.preventDefault(); onSave(name, category); }} className="flex flex-col gap-4">
        <Field label="Nome do padrão">
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} className={inputCls} />
        </Field>
        <Field label="Categoria">
          <input value={category} onChange={(e) => setCategory(e.target.value)} disabled={!canEdit} className={inputCls} />
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
                    <option value="point_x">point_x</option>
                    <option value="point_y">point_y</option>
                    <option value="distance">distance</option>
                    <option value="angle">angle</option>
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

function FilesTab({ components, selectedComponentId, onSelectComponent, files, canEdit, onUpload, onDelete }: {
  components: PatternComponent[]; selectedComponentId: string | null; onSelectComponent: (id: string) => void;
  files: PatternReferenceFile[]; canEdit: boolean;
  onUpload: (file: File, type: ReferenceFileType, notes: string) => void; onDelete: (id: string, url: string) => void;
}) {
  const [fileType, setFileType] = useState<ReferenceFileType>("image");
  const [notesText, setNotesText] = useState("");
  const [pending, setPending] = useState<File | null>(null);

  return (
    <div>
      <ComponentPicker components={components} selectedComponentId={selectedComponentId} onSelectComponent={onSelectComponent} />
      {selectedComponentId && (
        <>
          {canEdit && (
            <form onSubmit={(e) => { e.preventDefault(); if (pending) { onUpload(pending, fileType, notesText); setPending(null); setNotesText(""); } }} className="flex flex-col gap-2 mb-4">
              <input type="file" accept="image/*,.pdf,.dxf,.ads,.amk,.adsx,.amkx" onChange={(e) => setPending(e.target.files?.[0] ?? null)} className="text-sm text-slate-300" />
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
          )}
          <div className="grid gap-2">
            {files.map((f) => (
              <div key={f.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-sm">[{f.file_type}] {f.file_url.split("/").pop()} {f.notes && `— ${f.notes}`}</span>
                {canEdit && <button onClick={() => onDelete(f.id, f.file_url)} className="text-red-400 hover:text-red-300 text-xs">Excluir</button>}
              </div>
            ))}
            {files.length === 0 && <p className="text-slate-500 text-sm">Nenhum arquivo enviado para esta peça.</p>}
          </div>
        </>
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
          {canEdit && (
            <form onSubmit={(e) => { e.preventDefault(); if (label && x && y) { onAdd(label, parseFloat(x), parseFloat(y)); setLabel(""); setX(""); setY(""); } }} className="flex gap-2 mb-4">
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="A" className={inputCls + " w-20"} />
              <input value={x} onChange={(e) => setX(e.target.value)} type="number" step="0.1" placeholder="X (cm)" className={inputCls + " w-28"} />
              <input value={y} onChange={(e) => setY(e.target.value)} type="number" step="0.1" placeholder="Y (cm)" className={inputCls + " w-28"} />
              <button type="submit" className={btnCls}>Adicionar ponto</button>
            </form>
          )}
          <div className="grid grid-cols-3 gap-2">
            {points.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                <span className="font-mono">{p.label}: ({p.x_cm}, {p.y_cm})</span>
                {canEdit && <button onClick={() => onDelete(p.id)} className="text-red-400 hover:text-red-300 text-xs">Excluir</button>}
              </div>
            ))}
            {points.length === 0 && <p className="text-slate-500 text-sm col-span-3">Nenhum ponto registrado para esta peça ainda.</p>}
          </div>
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
