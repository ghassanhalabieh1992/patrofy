"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { PatternType, UserRole } from "@/lib/knowledge/types";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/knowledge/types";

export default function ExpertPortalPage() {
  const router = useRouter();
  const supabase = createClient();

  const [role, setRole] = useState<UserRole | null>(null);
  const [patterns, setPatterns] = useState<PatternType[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    setRole((profile?.role as UserRole) ?? "user");

    const { data } = await supabase
      .from("pattern_types")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });
    setPatterns((data as PatternType[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("pattern_types")
      .insert({ name: newName, category: newCategory, created_by: user.id })
      .select()
      .single();

    if (error) { setError(error.message); return; }
    router.push(`/expert/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
          ← Painel
        </Link>
        <h1 className="text-lg font-bold">Portal do Especialista</h1>
        {role === "admin" && (
          <Link href="/admin" className="ml-auto text-sm text-purple-300 hover:text-purple-200 transition-colors">
            Painel Admin →
          </Link>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Meus Padrões</h2>
          <button
            onClick={() => setCreating((v) => !v)}
            className="bg-purple-600 hover:bg-purple-500 transition-colors px-4 py-2 rounded-xl text-sm font-medium"
          >
            + Novo padrão
          </button>
        </div>

        {creating && (
          <form onSubmit={handleCreate} className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">Nome do padrão</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Saia Reta"
                required
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">Categoria</label>
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Saia / Calça / Blusa / Blazer"
                required
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" className="bg-purple-600 hover:bg-purple-500 transition-colors px-4 py-2 rounded-xl text-sm font-medium">
                Criar e continuar
              </button>
              <button type="button" onClick={() => setCreating(false)} className="text-slate-400 hover:text-white text-sm px-4 py-2">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-slate-500 text-sm">Carregando...</p>
        ) : patterns.length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhum padrão ainda. Comece criando um.</p>
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
                  <p className="text-xs text-slate-500">{p.category}</p>
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
