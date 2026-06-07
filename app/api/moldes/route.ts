import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/moldes — Retorna todos os moldes do usuário autenticado
export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // RLS filtra automaticamente por user_id
  const { data: moldes, error: dbError } = await supabase
    .from("moldes")
    .select("id, descricao, resultado, pattern_data, created_at")
    .order("created_at", { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ moldes });
}
