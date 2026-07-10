"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

export default function LandingPage() {
  const { locale, setLocale, dict } = useLanguage();
  const t = dict.landing;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-white flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tracking-tight">Patrofy</span>
          <span className="text-xs font-semibold uppercase tracking-widest bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1 rounded-full">
            {t.free}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/10 rounded-full p-0.5 text-xs font-semibold">
            <button
              onClick={() => setLocale("pt")}
              className={`px-3 py-1.5 rounded-full transition-colors ${locale === "pt" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              PT
            </button>
            <button
              onClick={() => setLocale("en")}
              className={`px-3 py-1.5 rounded-full transition-colors ${locale === "en" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
            >
              EN
            </button>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-5 py-2 rounded-full"
          >
            {dict.common.entrar}
          </Link>
          <Link
            href="/login?modo=cadastro"
            className="text-sm font-medium bg-purple-600 hover:bg-purple-500 transition-colors px-5 py-2 rounded-full"
          >
            {dict.common.cadastrar}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/30 px-4 py-1 rounded-full mb-6">
          {t.badge}
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight max-w-3xl">
          {t.titlePart1}{" "}
          <span className="text-purple-400">{t.titlePart2}</span>
        </h1>
        <p className="mt-6 text-lg text-slate-300 max-w-xl">
          {t.subtitle}
        </p>
        <Link
          href="/login?modo=cadastro"
          className="mt-10 inline-block bg-purple-600 hover:bg-purple-500 active:scale-95 transition-all text-white font-semibold text-lg px-10 py-4 rounded-full shadow-lg shadow-purple-900/50"
        >
          {t.cta}
        </Link>
        <p className="mt-3 text-sm text-slate-400">{t.ctaSub}</p>
      </section>

      {/* Benefícios */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 pb-20 max-w-5xl mx-auto w-full">
        {[
          { icon: "⚡", titulo: t.feature1Title, desc: t.feature1Desc },
          { icon: "📐", titulo: t.feature2Title, desc: t.feature2Desc },
          { icon: "🔄", titulo: t.feature3Title, desc: t.feature3Desc },
        ].map((item) => (
          <div
            key={item.titulo}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-3 hover:bg-white/10 transition-colors"
          >
            <span className="text-3xl">{item.icon}</span>
            <h3 className="text-lg font-semibold">{item.titulo}</h3>
            <p className="text-slate-400 text-sm">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* Rodapé */}
      <footer className="text-center text-xs text-slate-600 pb-6">
        {t.footer}
      </footer>
    </main>
  );
}
