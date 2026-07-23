"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ProfileWithEmail, UserRole } from "@/lib/knowledge/types";

const ROLE_LABELS: Record<UserRole, string> = { user: "Usuário", expert: "Especialista", admin: "Admin" };
// Apenas para exibir/ocultar o botão na UI — a checagem real acontece no banco (set_user_role).
// Valor vem de env var (não commitado) porque este repositório é público.
const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL ?? "";

export default function AdminUsersPage() {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<ProfileWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setIsSuperAdmin(user?.email === SUPER_ADMIN_EMAIL);

    const { data, error } = await supabase.rpc("list_profiles_with_email");
    if (error) { setError(error.message); setLoading(false); return; }
    setProfiles((data as ProfileWithEmail[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const filteredProfiles = profiles.filter((p) =>
    p.email.toLowerCase().includes(search.trim().toLowerCase())
  );

  async function changeRole(userId: string, newRole: UserRole) {
    setError("");
    const { error } = await supabase.rpc("set_user_role", { target_user_id: userId, new_role: newRole });
    if (error) { setError(error.message); return; }
    load();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
        <Link href="/admin" className="text-sm text-slate-400 hover:text-white transition-colors">← Revisão de padrões</Link>
        <h1 className="text-lg font-bold">Gerenciar usuários</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por email..."
          className="w-full mb-6 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400"
        />
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {loading ? (
          <p className="text-slate-500 text-sm">Carregando...</p>
        ) : filteredProfiles.length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhum usuário encontrado.</p>
        ) : (
          <div className="grid gap-2">
            {filteredProfiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
                <div>
                  <p className="font-medium">{p.name || "Sem nome"}</p>
                  <p className="text-xs text-slate-500">{p.email}</p>
                </div>
                <select
                  value={p.role}
                  onChange={(e) => changeRole(p.id, e.target.value as UserRole)}
                  className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-400"
                >
                  {(Object.keys(ROLE_LABELS) as UserRole[])
                    .filter((r) => r !== "admin" || isSuperAdmin || p.role === "admin")
                    .map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
