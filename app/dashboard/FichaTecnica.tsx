"use client";

import { useCallback, useState } from "react";
import { downloadMoldePDF } from "@/lib/pdf";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

// ── Types that mirror the JSON schema returned by Patrofy AI ─────────────────

interface Parte {
  nome: string;
  quantidade: number;
  medidas?: { largura_cm?: number; comprimento_cm?: number };
  fio_tecido?: string;
  instrucoes?: string;
}

interface MedidasTabela {
  cintura?: number;
  quadril?: number;
  busto?: number;
  comprimento?: number;
}

export interface FichaTecnicaData {
  modo?: string;
  peca?: string;
  tecido_recomendado?: string;
  tamanho_base?: string;
  medidas_tabela?: Record<string, MedidasTabela>;
  margem_costura?: string;
  partes?: Parte[];
  montagem?: string[];
  rendimento_tecido_metros?: number;
  observacoes_tecnicas?: string;
  alteracoes_aplicadas?: string[];
}

// ── Helper ────────────────────────────────────────────────────────────────────

function Badge({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400">{title}</h4>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function FichaTecnica({ data, descricao }: { data: FichaTecnicaData; descricao?: string }) {
  const { dict } = useLanguage();
  const ft = dict.fichaTecnica;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      // Build a human-readable text version of the ficha for the PDF
      const linhas: string[] = [];

      linhas.push(ft.pdfLines.fichaTecnica(data.peca ?? ft.moldeFallback));
      linhas.push(ft.pdfLines.tamanhoLinha(data.tamanho_base ?? "M", data.tecido_recomendado ?? "—", data.margem_costura ?? "1,5 cm"));
      if (data.rendimento_tecido_metros) linhas.push(ft.pdfLines.rendimento(data.rendimento_tecido_metros));
      linhas.push("");

      if (data.partes?.length) {
        linhas.push(ft.pdfLines.partesDoMolde);
        data.partes.forEach((p, i) => {
          linhas.push(ft.pdfLines.parteItem(i + 1, p.nome, p.quantidade, p.fio_tecido ?? "reto", p.medidas?.largura_cm ?? 0, p.medidas?.comprimento_cm ?? 0));
          if (p.instrucoes) linhas.push(`   ${p.instrucoes}`);
        });
        linhas.push("");
      }

      if (data.montagem?.length) {
        linhas.push(ft.pdfLines.sequenciaMontagem);
        data.montagem.forEach((s) => linhas.push(`• ${s}`));
        linhas.push("");
      }

      if (data.observacoes_tecnicas) {
        linhas.push(ft.pdfLines.observacoesTecnicas);
        linhas.push(data.observacoes_tecnicas);
      }

      if (data.alteracoes_aplicadas?.length) {
        linhas.push(ft.pdfLines.alteracoesAplicadas);
        data.alteracoes_aplicadas.forEach((a) => linhas.push(`• ${a}`));
      }

      await downloadMoldePDF(
        { descricao: descricao ?? data.peca ?? ft.moldeFallback, resultado: linhas.join("\n") },
        `ficha-${(data.peca ?? "molde").toLowerCase().replace(/\s+/g, "-")}.pdf`
      );
    } finally {
      setDownloading(false);
    }
  }, [data, descricao, ft]);

  const hasMedidasTabela = data.medidas_tabela && Object.keys(data.medidas_tabela).length > 0;

  return (
    <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl overflow-hidden mt-2 w-full max-w-2xl">

      {/* Header */}
      <div className="bg-indigo-900/60 px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
              {ft.headerTitle}
            </span>
            {data.modo && (
              <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full capitalize">
                {ft.modo} {data.modo}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-white">{data.peca ?? ft.moldeFallback}</h3>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs bg-white text-indigo-900 hover:bg-indigo-50 disabled:opacity-50 font-semibold px-3 py-2 rounded-xl transition-colors"
        >
          {downloading ? (
            <span className="w-3 h-3 border-2 border-indigo-300 border-t-indigo-900 rounded-full animate-spin" />
          ) : (
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"/>
            </svg>
          )}
          {ft.pdf}
        </button>
      </div>

      <div className="px-5 py-4 space-y-5">

        {/* Summary badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-800/60 rounded-xl p-4">
          <Badge label={ft.tamanhoBase} value={data.tamanho_base ?? "—"} />
          <Badge label={ft.margemCostura} value={data.margem_costura ?? "1,5 cm"} />
          {data.rendimento_tecido_metros ? (
            <Badge label={ft.rendimentoTecido} value={`${data.rendimento_tecido_metros} m`} />
          ) : null}
          <div className="flex flex-col gap-0.5 col-span-2 sm:col-span-1">
            <span className="text-xs text-slate-400">{ft.tecidoRecomendado}</span>
            <span className="text-sm font-semibold text-white leading-snug">{data.tecido_recomendado ?? "—"}</span>
          </div>
        </div>

        {/* Measurements table */}
        {hasMedidasTabela && (
          <Section title={ft.tabelaMedidas}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 text-xs text-slate-400 font-medium">{ft.tamanho}</th>
                    {Object.keys(Object.values(data.medidas_tabela!)[0] ?? {}).map((k) => (
                      <th key={k} className="text-center py-2 text-xs text-slate-400 font-medium capitalize">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.medidas_tabela!).map(([tam, vals]) => (
                    <tr key={tam} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-2 font-semibold text-indigo-300">{tam}</td>
                      {Object.values(vals).map((v, i) => (
                        <td key={i} className="py-2 text-center text-slate-200">{v ?? "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Pattern parts */}
        {data.partes && data.partes.length > 0 && (
          <Section title={ft.partesDoMolde(data.partes.length)}>
            <div className="space-y-2">
              {data.partes.map((parte, i) => (
                <div key={i} className="bg-slate-800/60 rounded-xl p-3">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-white text-sm">{parte.nome}</span>
                    <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                      {parte.quantidade > 0 && (
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                          × {parte.quantidade}
                        </span>
                      )}
                      {parte.fio_tecido && (
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                          {ft.fio} {parte.fio_tecido}
                        </span>
                      )}
                    </div>
                  </div>
                  {(parte.medidas?.largura_cm || parte.medidas?.comprimento_cm) && (
                    <p className="text-xs text-slate-400 mb-1 ml-9">
                      {parte.medidas.largura_cm ?? 0} cm × {parte.medidas.comprimento_cm ?? 0} cm
                    </p>
                  )}
                  {parte.instrucoes && (
                    <p className="text-xs text-slate-300 ml-9 leading-relaxed">{parte.instrucoes}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Assembly steps */}
        {data.montagem && data.montagem.length > 0 && (
          <Section title={ft.sequenciaMontagem}>
            <ol className="space-y-1.5">
              {data.montagem.map((passo, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600/40 text-indigo-300 text-xs flex items-center justify-center font-semibold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{passo.replace(/^passo\s*\d+[:\s]*/i, "")}</span>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* Applied changes */}
        {data.alteracoes_aplicadas && data.alteracoes_aplicadas.length > 0 && (
          <Section title={ft.alteracoesAplicadas}>
            <ul className="space-y-1">
              {data.alteracoes_aplicadas.map((alt, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-green-400 flex-shrink-0">✓</span>
                  {alt}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Technical notes */}
        {data.observacoes_tecnicas && (
          <Section title={ft.observacoesTecnicas}>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/60 rounded-xl p-3">
              {data.observacoes_tecnicas}
            </p>
          </Section>
        )}
      </div>
    </div>
  );
}
