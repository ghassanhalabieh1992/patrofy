import { createClient } from "@supabase/supabase-js";

// Cliente Supabase compartilhado — usa as variáveis de ambiente do .env.local
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
