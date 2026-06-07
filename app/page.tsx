import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-white flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <span className="text-2xl font-bold tracking-tight">
          Patrofy<span className="text-purple-400">.</span>
        </span>
        <Link
          href="/login"
          className="text-sm font-medium bg-purple-600 hover:bg-purple-500 transition-colors px-5 py-2 rounded-full"
        >
          Entrar
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/30 px-4 py-1 rounded-full mb-6">
          IA para Costura Profissional
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight max-w-3xl">
          Moldes profissionais gerados por{" "}
          <span className="text-purple-400">IA em segundos.</span>
        </h1>
        <p className="mt-6 text-lg text-slate-300 max-w-xl">
          Descreva a peça que deseja e receba instruções técnicas completas —
          medidas, formato, marcações e orientações de corte.
        </p>
        <Link
          href="/login"
          className="mt-10 inline-block bg-purple-600 hover:bg-purple-500 active:scale-95 transition-all text-white font-semibold text-lg px-10 py-4 rounded-full shadow-lg shadow-purple-900/50"
        >
          Começar agora →
        </Link>
      </section>

      {/* Benefícios */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 pb-20 max-w-5xl mx-auto w-full">
        {[
          {
            icon: "⚡",
            titulo: "Rapidez",
            desc: "Moldes detalhados em segundos, sem esperar pelo próximo atendimento.",
          },
          {
            icon: "📐",
            titulo: "Precisão técnica",
            desc: "Instruções profissionais com medidas, marcações e orientações de corte.",
          },
          {
            icon: "🔄",
            titulo: "Histórico completo",
            desc: "Todos os seus moldes salvos e acessíveis a qualquer momento.",
          },
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
        © 2024 Patrofy — Powered by LLaMA 3 (Meta) via OpenRouter
      </footer>
    </main>
  );
}
