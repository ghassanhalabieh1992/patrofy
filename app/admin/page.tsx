"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { PatternType, PatternStatus, ProfileWithEmail } from "@/lib/knowledge/types";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/knowledge/types";

const FILTERS: (PatternStatus | "all")[] = ["pending_review", "draft", "approved", "rejected", "all"];
const FILTER_LABELS: Record<string, string> = {
  pending_review: "Em revisão",
  draft: "Rascunho",
  approved: "Aprovado",
  rejected: "Rejeitado",
  all: "Todos",
};

export default function AdminReviewPage() {
  const supabase = createClient();
  const [filter, setFilter] = useState<PatternStatus | "all">("pending_review");
  const [patterns, setPatterns] = useState<PatternType[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("pattern_types").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    const list = (data as PatternType[]) ?? [];
    setPatterns(list);

    const { data: profiles } = await supabase.rpc("list_profiles_with_email");
    const map: Record<string, string> = {};
    ((profiles as ProfileWithEmail[]) ?? []).forEach((p) => { map[p.id] = p.name || p.email; });
    setAuthorNames(map);

    setLoading(false);
  }, [filter, supabase]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">← Painel</Link>
        <h1 className="text-lg font-bold">Painel Admin — Revisão de Padrões</h1>
        <Link href="/admin/users" className="ml-auto text-sm text-purple-300 hover:text-purple-200 transition-colors">
          Gerenciar usuários →
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-sm px-4 py-2 rounded-xl transition-colors ${
                filter === f ? "bg-purple-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-slate-500 text-sm">Carregando...</p>
        ) : patterns.length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhum padrão com este status.</p>
        ) : (
          <div className="grid gap-3">
            {patterns.map((p) => (
              <Link
                key={p.id}
                href={`/expert/${p.id}`}
                className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-5 py-4 transition-colors"
              >
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.category} — por {authorNames[p.created_by] ?? "—"}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full border ${STATUS_COLORS[p.status]}`}>
                  {STATUS_LABELS[p.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
