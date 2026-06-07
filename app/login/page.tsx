"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Modo = "login" | "cadastro";

export default function LoginPage() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [msg, setMsg] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setMsg("");
    setCarregando(true);

    const supabase = createClient();

    try {
      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) { setErro(error.message); return; }
        router.push("/dashboard");
        router.refresh();

      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { data: { name: nome } },
        });
        if (error) { setErro(error.message); return; }
        // Supabase sends a confirmation email by default
        setMsg("Conta criada! Verifique seu email para confirmar o cadastro.");
      }
    } catch {
      setErro("Erro de rede. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-white tracking-tight">
            Patrofy<span className="text-purple-400">.</span>
          </Link>
          <p className="text-slate-400 mt-2 text-sm">Sistema de IA para Geração de Moldes</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          {/* Toggle */}
          <div className="flex bg-white/10 rounded-xl p-1 mb-6">
            {(["login", "cadastro"] as Modo[]).map((m) => (
              <button
                key={m}
                onClick={() => { setModo(m); setErro(""); setMsg(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  modo === m ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                {m === "login" ? "Entrar" : "Cadastrar"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {modo === "cadastro" && (
              <div className="flex flex-col gap-1">
                <label className="text-sm text-slate-300">Nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-slate-300">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>

            {erro && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {erro}
              </p>
            )}

            {msg && (
              <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                {msg}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="mt-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-white font-semibold py-3 rounded-xl"
            >
              {carregando ? "Aguarde..." : modo === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Ao continuar, você concorda com os termos de uso da Patrofy.
        </p>
      </div>
    </main>
  );
}
