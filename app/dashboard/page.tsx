"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/knowledge/types";
import { downloadMoldePDF } from "@/lib/pdf";
import { extractJSON } from "@/lib/llama";
import { PatternViewer } from "./PatternViewer";
import { FichaTecnica, type FichaTecnicaData } from "./FichaTecnica";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Dictionary } from "@/lib/i18n/dictionary";
import {
  generatePattern,
  detectGarment,
  REQUIRED_FIELDS,
  OPTIONAL_FIELDS,
  type GarmentType,
  type PatternData,
  type Measurements,
} from "@/lib/patterns";

// ── Extract numeric measurements from free text ───────────────────────────────
function extractMeasurementsFromText(text: string): Partial<Measurements> {
  const num = (r: RegExp) => { const m = text.match(r); return m ? parseFloat(m[1].replace(',', '.')) : undefined; };
  return {
    cintura:      num(/(?:cintura|waist|خصر)[:\s]+(\d+(?:[.,]\d+)?)/i),
    quadril:      num(/(?:quadril|hip|ورك|ارداف)[:\s]+(\d+(?:[.,]\d+)?)/i),
    busto:        num(/(?:busto|bust|peitoral|peito|صدر)[:\s]+(\d+(?:[.,]\d+)?)/i),
    comprimento:  num(/(?:comprimento|length|طول)[:\s]+(\d+(?:[.,]\d+)?)/i),
    altura:       num(/(?:altura|height|ارتفاع|طول القامة)[:\s]+(\d+(?:[.,]\d+)?)/i),
    mangas:       num(/(?:manga[s]?|sleeve|طول الكم)[:\s]+(\d+(?:[.,]\d+)?)/i),
    ombros:       num(/(?:ombro[s]?|shoulder|عرض الكتف)[:\s]+(\d+(?:[.,]\d+)?)/i),
    pescoco:      num(/(?:pescoço|pesco[çc]o|neck|الرقبة|محيط الرقبة)[:\s]+(\d+(?:[.,]\d+)?)/i),
    dorsoCostas:  num(/(?:costas|dorso|back width|عرض الظهر)[:\s]+(\d+(?:[.,]\d+)?)/i),
    profCava:     num(/(?:cava|armhole depth|عمق فتحة الكم)[:\s]+(\d+(?:[.,]\d+)?)/i),
    punho:        num(/(?:punho|wrist|محيط المعصم)[:\s]+(\d+(?:[.,]\d+)?)/i),
    bracoCirc:    num(/(?:bra[çc]o|arm circ|محيط العضد)[:\s]+(\d+(?:[.,]\d+)?)/i),
    entrepernas:  num(/(?:entrep|inseam|الطول الداخلي)[:\s]+(\d+(?:[.,]\d+)?)/i),
    coxa:         num(/(?:coxa|thigh|محيط الفخذ)[:\s]+(\d+(?:[.,]\d+)?)/i),
    joelho:       num(/(?:joelho|knee|محيط الركبة)[:\s]+(\d+(?:[.,]\d+)?)/i),
    tornozelo:    num(/(?:tornozelo|ankle|محيط الكاحل)[:\s]+(\d+(?:[.,]\d+)?)/i),
  };
}

// ── Auto-generate pattern from AI Ficha Técnica + user text ──────────────────
function fichaToPattern(ficha: FichaTecnicaData, userText: string): PatternData | null {
  const garment = detectGarment(ficha.peca ?? userText);
  if (!garment) return null;
  const textM    = extractMeasurementsFromText(userText);
  const sizeData = ficha.medidas_tabela?.["M"] ?? ficha.medidas_tabela?.["G"] ?? {};
  const comprPart = ficha.partes?.reduce((max, p) => Math.max(max, p.medidas?.comprimento_cm ?? 0), 0) ?? 0;
  const m: Measurements = {
    cintura:     textM.cintura     ?? sizeData.cintura     ?? 0,
    quadril:     textM.quadril     ?? sizeData.quadril     ?? 0,
    busto:       textM.busto       ?? sizeData.busto,
    comprimento: textM.comprimento ?? sizeData.comprimento ?? (comprPart > 0 ? comprPart : 0),
    altura:      textM.altura,
    mangas:      textM.mangas,
    ombros:      textM.ombros,
    pescoco:     textM.pescoco,
    dorsoCostas: textM.dorsoCostas,
    punho:       textM.punho,
    bracoCirc:   textM.bracoCirc,
    entrepernas: textM.entrepernas,
    coxa:        textM.coxa,
    joelho:      textM.joelho,
    tornozelo:   textM.tornozelo,
  };
  const required = REQUIRED_FIELDS[garment];
  if (required.some(f => !m[f])) return null;
  try { return generatePattern(garment, m); } catch { return null; }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imagePreview?: string;
  medidas?: Medidas;
  isLoading?: boolean;
  pattern?: PatternData;        // parametric SVG pattern
  ficha?: FichaTecnicaData;     // structured AI JSON response
}

interface Medidas {
  busto: string;
  cintura: string;
  quadril: string;
  altura: string;
}

interface SavedMolde {
  id: string;
  descricao: string;
  resultado: string | null;
  pattern_data: PatternData | null;
  created_at: string;
}

// ── Markdown-like renderer ────────────────────────────────────────────────────

function RenderContent({ text }: { text: string }) {
  return (
    <div className="space-y-0.5">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="leading-relaxed text-sm">
            {parts.map((p, j) =>
              p.startsWith("**") && p.endsWith("**") ? (
                <strong key={j} className="font-semibold text-white">{p.slice(2, -2)}</strong>
              ) : p
            )}
          </p>
        );
      })}
    </div>
  );
}

// ── Welcome message ───────────────────────────────────────────────────────────

function getWelcome(dict: Dictionary): ChatMessage {
  return { id: "welcome", role: "assistant", content: dict.dashboard.welcomeMessage };
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const { dict } = useLanguage();
  const t = dict.dashboard;

  // ── State ───────────────────────────────────────────────────────
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("user");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [getWelcome(dict)]);
  const [savedMoldes, setSavedMoldes] = useState<SavedMolde[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [input, setInput] = useState("");
  const [medidas, setMedidas] = useState<Medidas>({ busto: "", cintura: "", quadril: "", altura: "" });
  const [showMedidas, setShowMedidas] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Parametric panel
  const [showPatternPanel, setShowPatternPanel] = useState(false);
  const [patternGarment, setPatternGarment] = useState<GarmentType>("saia");
  const [patternMeasures, setPatternMeasures] = useState<Record<string, string>>({});

  const bottomRef   = useRef<HTMLDivElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Effects ─────────────────────────────────────────────────────

  // Auth check + load user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUserEmail(user.email ?? null);
      supabase.from("profiles").select("role").eq("id", user.id).single().then(({ data: profile }) => {
        setUserRole((profile?.role as UserRole) ?? "user");
      });
    });
  }, []);

  // Load history from Supabase
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/moldes");
      if (res.ok) {
        const data = await res.json();
        setSavedMoldes(data.moldes ?? []);
      }
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Scroll to bottom on new messages
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 160) + "px"; }
  }, [input]);

  // ── Handlers ────────────────────────────────────────────────────

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setImageBase64(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  }, []);

  const loadMolde = useCallback((molde: SavedMolde) => {
    const msgs: ChatMessage[] = [getWelcome(dict)];
    msgs.push({ id: "u-" + molde.id, role: "user", content: molde.descricao });

    if (molde.pattern_data) {
      msgs.push({
        id: "a-" + molde.id,
        role: "assistant",
        content: molde.resultado ?? t.moldeParametricoFallback,
        pattern: molde.pattern_data,
      });
    } else {
      // Try to parse AI response as structured JSON
      const fichaJSON = molde.resultado ? extractJSON(molde.resultado) as FichaTecnicaData | null : null;
      msgs.push({
        id:      "a-" + molde.id,
        role:    "assistant",
        content: fichaJSON ? (fichaJSON.peca ? t.fichaTecnicaSimples(fichaJSON.peca) : t.moldeGerado) : (molde.resultado ?? ""),
        ficha:   fichaJSON ?? undefined,
      });
    }
    setMessages(msgs);
  }, [dict, t]);

  const newChat = useCallback(() => {
    setMessages([getWelcome(dict)]);
    setInput("");
    setUploadedFile(null);
    setImageBase64("");
  }, [dict]);

  // Send message → call IA API
  const handleSend = useCallback(async () => {
    if (isLoading || (!input.trim() && !uploadedFile)) return;

    const userContent = input.trim() || `${t.analisarPrefix}${uploadedFile?.name}`;
    const hasMedidas = Object.values(medidas).some((v) => v);
    const isImage = !!imageBase64;

    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      role: "user",
      content: userContent,
      imagePreview: imageBase64 || undefined,
      medidas: hasMedidas ? { ...medidas } : undefined,
    };
    const loadingMsg: ChatMessage = { id: "loading", role: "assistant", content: "", isLoading: true };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setImageBase64("");
    setUploadedFile(null);
    setShowMedidas(false);
    setIsLoading(true);

    // ── Fast path: if user provided garment + measurements directly, skip AI ──
    if (!isImage) {
      const directGarment = detectGarment(userContent);
      if (directGarment) {
        const textM = extractMeasurementsFromText(userContent);
        const m: Measurements = {
          cintura:     textM.cintura     ?? 0,
          quadril:     textM.quadril     ?? 0,
          busto:       textM.busto,
          comprimento: textM.comprimento ?? 0,
          altura:      textM.altura,
          mangas:      textM.mangas,
          ombros:      textM.ombros,
          pescoco:     textM.pescoco,
          dorsoCostas: textM.dorsoCostas,
          punho:       textM.punho,
          bracoCirc:   textM.bracoCirc,
          entrepernas: textM.entrepernas,
          coxa:        textM.coxa,
          joelho:      textM.joelho,
          tornozelo:   textM.tornozelo,
        };
        const required = REQUIRED_FIELDS[directGarment];
        if (required.every(f => m[f])) {
          try {
            const pattern = generatePattern(directGarment, m);
            const label = t.garmentLabels[directGarment];
            const assistantMsg: ChatMessage = {
              id:      "pa-" + Date.now(),
              role:    "assistant",
              content: t.moldeParametricoGeradoFast(label, pattern.sizeName),
              pattern,
            };
            setMessages(prev => prev.map(m => m.id === "loading" ? assistantMsg : m));
            setIsLoading(false);
            fetch("/api/moldes/gerar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ descricao: userContent, pattern_data: pattern }),
            }).then(() => loadHistory());
            return;
          } catch { /* fall through to AI path */ }
        }
      }
    }

    // Build conversation history (last 6 turns for context)
    const historico = messages
      .filter((m) => !m.isLoading && m.id !== "welcome" && !m.pattern)
      .slice(-6)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    try {
      const res = await fetch("/api/moldes/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao:   userContent,
          medidas:     hasMedidas ? medidas : undefined,
          imageBase64: isImage ? imageBase64 : undefined,
          historico,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.erroAoGerar);

      const rawResultado: string = data.molde.resultado ?? "";
      const fichaJSON = extractJSON(rawResultado) as FichaTecnicaData | null;
      const autoPattern = fichaJSON ? fichaToPattern(fichaJSON, userContent) : null;
      const assistantId = "a-" + Date.now();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === "loading"
            ? {
                id:      assistantId,
                role:    "assistant",
                content: fichaJSON
                  ? (fichaJSON.peca ? t.fichaTecnicaGeradaPara(fichaJSON.peca) : t.moldeGeradoComSucesso)
                  : rawResultado,
                medidas:  hasMedidas ? { ...medidas } : undefined,
                ficha:    fichaJSON ?? undefined,
                pattern:  autoPattern ?? undefined,
              }
            : m
        )
      );
      // Refresh sidebar history
      loadHistory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.erroDesconhecido;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === "loading"
            ? { id: "err-" + Date.now(), role: "assistant", content: `${t.erroPrefix}${msg}` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, uploadedFile, imageBase64, medidas, messages, isLoading, loadHistory, t]);

  // Download PDF for a text message
  const handleDownloadPDF = useCallback(async (msg: ChatMessage) => {
    if (downloadingId) return;
    setDownloadingId(msg.id);
    const idx = messages.findIndex((m) => m.id === msg.id);
    const userMsg = idx > 0 ? messages[idx - 1] : undefined;
    await downloadMoldePDF(
      { descricao: userMsg?.content ?? "Patrofy", resultado: msg.content, medidas: msg.medidas },
      `molde-patrofy-${Date.now()}.pdf`
    );
    setDownloadingId(null);
  }, [messages, downloadingId]);

  // Generate parametric pattern → save to Supabase
  const handleGeneratePattern = useCallback(async () => {
    const required = REQUIRED_FIELDS[patternGarment];
    if (required.some((f) => !patternMeasures[f])) return;

    const p = (k: string) => parseFloat(patternMeasures[k] ?? "0") || undefined;
    const measures: Measurements = {
      cintura:     parseFloat(patternMeasures.cintura     ?? "0"),
      quadril:     parseFloat(patternMeasures.quadril     ?? "0"),
      comprimento: parseFloat(patternMeasures.comprimento ?? "0"),
      busto:       p('busto'),
      altura:      p('altura'),
      mangas:      p('mangas'),
      ombros:      p('ombros'),
      pescoco:     p('pescoco'),
      dorsoCostas: p('dorsoCostas'),
      profCava:    p('profCava'),
      punho:       p('punho'),
      bracoCirc:   p('bracoCirc'),
      entrepernas: p('entrepernas'),
      coxa:        p('coxa'),
      joelho:      p('joelho'),
      tornozelo:   p('tornozelo'),
    };

    const pattern = generatePattern(patternGarment, measures);
    const garmentLabel = t.garmentLabels[patternGarment];
    const descricao = `${garmentLabel} — ${Object.entries(patternMeasures).filter(([,v]) => v).map(([k,v]) => `${k} ${v}cm`).join(", ")}`;

    const userMsg: ChatMessage = { id: "pu-" + Date.now(), role: "user", content: descricao };
    const assistantMsg: ChatMessage = {
      id: "pa-" + Date.now(),
      role: "assistant",
      content: t.moldeParametricoGeradoManual(garmentLabel, pattern.sizeName, pattern.pieces.length),
      pattern,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setShowPatternPanel(false);
    setPatternMeasures({});

    // Save to Supabase (no IA call — pattern_data is the output)
    fetch("/api/moldes/gerar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descricao, pattern_data: pattern }),
    }).then(() => loadHistory());
  }, [patternGarment, patternMeasures, loadHistory, t]);

  // Logout
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }, [supabase, router]);

  const canSend = (input.trim() || !!uploadedFile) && !isLoading;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0"} flex-shrink-0 transition-all duration-200 overflow-hidden bg-slate-900 border-r border-white/10 flex flex-col`}>
        <div className="p-4 border-b border-white/10">
          <span className="text-xl font-bold tracking-tight block mb-3">Patrofy</span>
          <button
            onClick={newChat}
            className="w-full flex items-center gap-2 text-sm bg-purple-600 hover:bg-purple-500 transition-colors px-3 py-2 rounded-xl font-medium"
          >
            <span className="text-lg leading-none">+</span> {t.novaConversa}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 px-2 mb-2">{t.meusMoldes}</p>
          {historyLoading ? (
            <div className="flex items-center gap-2 px-2 text-xs text-slate-500 py-4">
              <span className="w-3 h-3 border border-slate-600 border-t-purple-400 rounded-full animate-spin" />
              {dict.common.carregando}
            </div>
          ) : savedMoldes.length === 0 ? (
            <p className="text-xs text-slate-600 px-2 py-4">{t.nenhumMolde}</p>
          ) : (
            savedMoldes.map((m) => (
              <button
                key={m.id}
                onClick={() => loadMolde(m)}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  {m.pattern_data ? (
                    <span className="text-purple-400 text-xs">📐</span>
                  ) : (
                    <span className="text-indigo-400 text-xs">✦</span>
                  )}
                  <span className="truncate">{m.descricao.slice(0, 36)}{m.descricao.length > 36 ? "…" : ""}</span>
                </span>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-white/10">
          {userEmail && <p className="text-xs text-slate-500 truncate mb-2">{userEmail}</p>}
          {(userRole === "expert" || userRole === "admin") && (
            <Link href="/expert" className="block text-sm text-purple-400 hover:text-purple-300 transition-colors mb-2">
              {t.portalEspecialista}
            </Link>
          )}
          {userRole === "admin" && (
            <Link href="/admin" className="block text-sm text-purple-400 hover:text-purple-300 transition-colors mb-2">
              {t.painelAdmin}
            </Link>
          )}
          <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            {dict.common.sairDaConta}
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="font-semibold text-sm text-slate-200">{t.assistente}</span>
          <span className="ml-auto hidden sm:flex items-center gap-1.5 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            LLaMA 3 via OpenRouter
          </span>
        </header>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>

                <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                  msg.role === "assistant" ? "bg-purple-600" : "bg-indigo-600"
                }`}>
                  {msg.role === "assistant" ? "AI" : "EU"}
                </div>

                <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>

                  {msg.imagePreview && (
                    <img src={msg.imagePreview} alt={t.imagemEnviada} className="max-w-[220px] rounded-xl border border-white/10" />
                  )}

                  {msg.medidas && Object.values(msg.medidas).some((v) => v) && (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(msg.medidas).filter(([,v]) => v).map(([k,v]) => (
                        <span key={k} className="text-xs bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full">
                          {t.fieldLabels[k] ?? k}: {v}cm
                        </span>
                      ))}
                    </div>
                  )}

                  {msg.isLoading ? (
                    <div className="bg-slate-800 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-slate-600 border-t-purple-400 rounded-full animate-spin" />
                      <span className="text-sm text-slate-400">{t.gerandoMolde}</span>
                    </div>
                  ) : (
                    <div className={`rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-sm"
                        : "bg-slate-800 border border-white/10 text-slate-200 rounded-tl-sm"
                    }`}>
                      <RenderContent text={msg.content} />
                    </div>
                  )}

                  {/* Parametric pattern viewer — always shown first */}
                  {msg.pattern && <PatternViewer pattern={msg.pattern} />}

                  {/* Structured AI ficha técnica — detail card */}
                  {msg.ficha && !msg.pattern && <FichaTecnica data={msg.ficha} descricao={msg.id ? messages.find(m => m.id === "u-" + msg.id.slice(2))?.content : undefined} />}

                  {/* Action buttons — only for plain text responses */}
                  {msg.role === "assistant" && !msg.isLoading && msg.id !== "welcome" && !msg.pattern && !msg.ficha && (
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => handleDownloadPDF(msg)}
                        disabled={downloadingId === msg.id}
                        className="flex items-center gap-1.5 text-xs bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 hover:text-white px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {downloadingId === msg.id ? (
                          <span className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/>
                          </svg>
                        )}
                        {t.baixarPDF}
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                        {t.copiar}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Measurements panel */}
        {showMedidas && (
          <div className="border-t border-white/10 bg-slate-900 px-4 py-3">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-300">{t.medidasCliente}</span>
                <button onClick={() => setShowMedidas(false)} className="text-slate-500 hover:text-white text-lg">×</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["busto", "cintura", "quadril", "altura"] as const).map((campo) => (
                  <div key={campo} className="flex flex-col gap-1">
                    <label className="text-xs text-slate-500">{t.fieldLabels[campo] ?? campo}</label>
                    <input
                      type="number"
                      placeholder="cm"
                      value={medidas[campo]}
                      onChange={(e) => setMedidas((prev) => ({ ...prev, [campo]: e.target.value }))}
                      className="bg-slate-800 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-400 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Parametric pattern panel */}
        {showPatternPanel && (
          <div className="border-t border-white/10 bg-slate-900 px-4 py-4">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{t.gerarMoldeParametricoTitulo}</span>
                <button onClick={() => setShowPatternPanel(false)} className="text-slate-400 hover:text-white text-xl">×</button>
              </div>

              {/* Garment selector */}
              <div className="flex flex-wrap gap-2">
                {(["saia", "calca", "blusa", "blazer-fem", "blazer-masc"] as GarmentType[]).map((g) => (
                  <button key={g} onClick={() => { setPatternGarment(g); setPatternMeasures({}); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${patternGarment === g ? "bg-purple-600 text-white" : "bg-white/10 text-slate-300 hover:bg-white/15"}`}>
                    {t.garmentLabels[g]}
                  </button>
                ))}
              </div>

              {/* Required fields */}
              <div>
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-2">{t.medidasObrigatorias}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {REQUIRED_FIELDS[patternGarment].map((field) => (
                    <div key={field} className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">{t.fieldLabels[field] ?? field} <span className="text-purple-400">*</span></label>
                      <div className="relative">
                        <input type="number" placeholder="0" value={patternMeasures[field] ?? ""}
                          onChange={(e) => setPatternMeasures((prev) => ({ ...prev, [field]: e.target.value }))}
                          className="w-full bg-slate-800 border border-white/15 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-400 pr-9"/>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">cm</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional fields */}
              {OPTIONAL_FIELDS[patternGarment].length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">{t.medidasComplementares}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {OPTIONAL_FIELDS[patternGarment].map((field) => (
                      <div key={field} className="flex flex-col gap-1">
                        <label className="text-xs text-slate-500">{t.fieldLabels[field] ?? field}</label>
                        <div className="relative">
                          <input type="number" placeholder="—" value={patternMeasures[field] ?? ""}
                            onChange={(e) => setPatternMeasures((prev) => ({ ...prev, [field]: e.target.value }))}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-purple-400/50 pr-9"/>
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600">cm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(() => {
                const missing = REQUIRED_FIELDS[patternGarment].filter((f) => !patternMeasures[f]);
                return (
                  <button onClick={handleGeneratePattern} disabled={missing.length > 0}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
                    {missing.length > 0
                      ? t.preencher(missing.map((f) => t.fieldLabels[f] ?? f).join(", "))
                      : t.gerarMolde(t.garmentLabels[patternGarment])}
                  </button>
                );
              })()}
            </div>
          </div>
        )}

        {/* File preview strip */}
        {uploadedFile && (
          <div className="border-t border-white/10 bg-slate-900 px-4 py-2">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              {imageBase64 ? (
                <img src={imageBase64} alt="" className="w-12 h-12 object-cover rounded-lg border border-white/10" />
              ) : (
                <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center text-xl">📄</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{uploadedFile.name}</p>
                <p className="text-xs text-slate-500">{imageBase64 ? t.imagemReferencia : t.arquivoReferencia}</p>
              </div>
              <button onClick={() => { setUploadedFile(null); setImageBase64(""); }} className="text-slate-500 hover:text-white text-xl">×</button>
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="border-t border-white/10 bg-slate-950 px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-slate-800 border border-white/15 focus-within:border-purple-500/60 rounded-2xl px-3 py-2 transition-colors">

              {/* Parametric pattern */}
              <button onClick={() => setShowPatternPanel((v) => !v)}
                className={`p-1.5 transition-colors flex-shrink-0 mb-0.5 ${showPatternPanel ? "text-purple-400" : "text-slate-400 hover:text-white"}`}
                title={t.gerarMoldeParametricoTooltip}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
                </svg>
              </button>

              {/* Attach file */}
              <button onClick={() => fileRef.current?.click()}
                className="p-1.5 text-slate-400 hover:text-white transition-colors flex-shrink-0 mb-0.5"
                title={t.anexarImagemTooltip}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>
              <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />

              {/* Measurements */}
              <button onClick={() => setShowMedidas((v) => !v)}
                className={`p-1.5 transition-colors flex-shrink-0 mb-0.5 ${showMedidas ? "text-purple-400" : "text-slate-400 hover:text-white"}`}
                title={t.adicionarMedidasTooltip}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 7l3 3 4-4 4 4 4-4 3 3M3 17l3 3 4-4 4 4 4-4 3 3"/>
                </svg>
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef} value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={uploadedFile ? t.inputPlaceholderFile : t.inputPlaceholderDefault}
                rows={1}
                className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-500 resize-none focus:outline-none max-h-40 py-1.5"
              />

              {/* Send */}
              <button onClick={handleSend} disabled={!canSend}
                className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors rounded-xl flex-shrink-0">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>

            <p className="text-center text-xs text-slate-600 mt-2">
              {t.footerHint}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
