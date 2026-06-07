import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarMolde } from "@/lib/llama";

// POST /api/moldes/gerar — Gera molde com IA e salva no Supabase
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Verificar sessão via cookie (gerenciado pelo @supabase/ssr)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json();
  const { descricao, medidas, imageBase64, historico, pattern_data } = body;

  if (!descricao && !imageBase64) {
    return NextResponse.json({ error: "Forneça uma descrição ou imagem." }, { status: 400 });
  }

  let resultado: string | null = null;

  // Se não for molde paramétrico puro, chamar a IA
  if (!pattern_data) {
    try {
      resultado = await gerarMolde({
        descricao: descricao ?? "",
        medidas,
        imageBase64,
        historico,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar molde.";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // Salvar no Supabase (RLS garante que user_id = usuário autenticado)
  const { data: molde, error: dbError } = await supabase
    .from("moldes")
    .insert({
      user_id:      user.id,
      descricao:    descricao ?? "(molde paramétrico)",
      resultado:    resultado,
      pattern_data: pattern_data ?? null,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ molde }, { status: 201 });
}
