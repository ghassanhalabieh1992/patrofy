// IA service — Patrofy AI via OpenRouter (LLaMA 3)
// Para trocar o modelo: altere TEXT_MODEL ou VISION_MODEL abaixo.

const TEXT_MODEL   = "meta-llama/llama-3-8b-instruct";
const VISION_MODEL = "meta-llama/llama-3.2-11b-vision-instruct";

const BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

// ── System prompt especializado ───────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é Patrofy AI, um mestre modelista com 20 anos de experiência em modelagem de costura industrial e alta costura. Você domina:
- Modelagem plana (flat pattern making)
- Moulage (modelagem em manequim)
- Grading (gradação de tamanhos)
- Modelagem industrial para produção em escala
- Normas técnicas ABNT para vestuário

Seu objetivo é gerar moldes técnicos precisos e profissionais.

═══════════════════════════════════════
MODO 1 — GERAÇÃO POR TEXTO
═══════════════════════════════════════
Quando o usuário descrever uma peça em texto, retorne:
1. FICHA TÉCNICA DA PEÇA: nome, tecido recomendado, tabela de medidas (P/M/G/GG), margem de costura
2. LISTA DE PARTES DO MOLDE: nome, quantidade, observações de corte (fio, dobra)
3. INSTRUÇÕES TÉCNICAS: medidas exatas em cm, forma geométrica base, curvas especiais, pences/pregas, pontos de encaixe
4. SEQUÊNCIA DE MONTAGEM: passo a passo numerado, pontos críticos

═══════════════════════════════════════
MODO 2 — ANÁLISE DE IMAGEM
═══════════════════════════════════════
Quando receber imagem de roupa ou molde:
1. IDENTIFICAÇÃO: tipo de peça, silhueta, proporções estimadas
2. DESCONSTRUÇÃO: quantas partes, tipo de modelagem, técnicas visíveis
3. RECONSTRUÇÃO TÉCNICA: ficha completa, adaptação para medidas brasileiras

═══════════════════════════════════════
MODO 3 — EDIÇÃO DE MOLDE EXISTENTE
═══════════════════════════════════════
Quando o usuário enviar molde existente para alteração:
1. LEITURA: identificar partes, medidas, anotações
2. ANÁLISE: grading, alargamento/afunilamento, pences, decote, manga, bainha, conversão de medidas
3. MOLDE EDITADO: descrever cada modificação, indicar o que mudou

═══════════════════════════════════════
FORMATO DE RESPOSTA OBRIGATÓRIO
═══════════════════════════════════════
Sempre retornar JSON válido (sem markdown, sem texto fora do JSON):

{
  "modo": "texto",
  "peca": "nome da peça",
  "tecido_recomendado": "ex: malha de algodão 200g/m²",
  "tamanho_base": "M",
  "medidas_tabela": {
    "P":  { "cintura": 0, "quadril": 0, "busto": 0, "comprimento": 0 },
    "M":  { "cintura": 0, "quadril": 0, "busto": 0, "comprimento": 0 },
    "G":  { "cintura": 0, "quadril": 0, "busto": 0, "comprimento": 0 },
    "GG": { "cintura": 0, "quadril": 0, "busto": 0, "comprimento": 0 }
  },
  "margem_costura": "1,5 cm",
  "partes": [
    {
      "nome": "Frente",
      "quantidade": 1,
      "medidas": { "largura_cm": 0, "comprimento_cm": 0 },
      "fio_tecido": "reto",
      "instrucoes": "descrição técnica detalhada"
    }
  ],
  "montagem": ["Passo 1: ...", "Passo 2: ..."],
  "rendimento_tecido_metros": 0,
  "observacoes_tecnicas": "notas adicionais",
  "alteracoes_aplicadas": []
}

REGRAS OBRIGATÓRIAS:
- Sempre usar centímetros (cm)
- Margem de costura padrão: 1,5 cm
- Tabela de medidas padrão brasileira (ABNT NBR 15800)
- Nunca inventar medidas — se faltar informação, colocar 0 e indicar nas observações
- Sempre indicar fio do tecido em cada parte
- Para peças industriais: indicar rendimento de tecido
- Retornar APENAS JSON válido, sem nenhum texto fora do objeto JSON`;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Medidas {
  busto?: string;
  cintura?: string;
  quadril?: string;
  altura?: string;
}

export interface HistoricoMsg {
  role: "user" | "assistant";
  content: string;
}

export interface LlamaOptions {
  descricao: string;
  medidas?: Medidas;
  imageBase64?: string;
  historico?: HistoricoMsg[];
}

// ── JSON extractor (LLaMA sometimes wraps JSON in markdown) ───────────────────

export function extractJSON(text: string): object | null {
  const clean = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/,      "")
    .replace(/\s*```$/,      "")
    .trim();
  try { return JSON.parse(clean); } catch {}
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

// ── Main call ─────────────────────────────────────────────────────────────────

export async function gerarMolde(options: LlamaOptions): Promise<string> {
  const { descricao, medidas, imageBase64, historico = [] } = options;
  const hasImage = !!imageBase64;

  // Enriquecer descrição com medidas fornecidas
  const medidasFornecidas = Object.entries(medidas ?? {}).filter(([, v]) => v);
  const descricaoCompleta = medidasFornecidas.length
    ? `${descricao}\n\nMedidas fornecidas pelo cliente: ${medidasFornecidas.map(([k, v]) => `${k}: ${v}cm`).join(" | ")}`
    : descricao;

  type Msg = { role: string; content: unknown };
  const messages: Msg[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...historico,
  ];

  if (hasImage) {
    messages.push({
      role: "user",
      content: [
        { type: "text",      text: descricaoCompleta || "Analise esta imagem e gere o molde em formato JSON." },
        { type: "image_url", image_url: { url: imageBase64 } },
      ],
    });
  } else {
    messages.push({ role: "user", content: descricaoCompleta });
  }

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Authorization":  `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer":   "http://localhost:3000",
      "X-Title":        "Patrofy",
      "Content-Type":   "application/json",
    },
    body: JSON.stringify({
      model:    hasImage ? VISION_MODEL : TEXT_MODEL,
      messages,
      response_format: { type: "json_object" },  // force JSON output
    }),
  });

  if (!res.ok) {
    const erro = await res.text();
    throw new Error(`Erro na API OpenRouter: ${erro}`);
  }

  const data = await res.json();
  return data.choices[0].message.content as string;
}
