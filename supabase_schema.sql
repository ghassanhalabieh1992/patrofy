-- =============================================
-- PATROFY — Schema do banco de dados (Supabase)
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- Tabela de moldes gerados
CREATE TABLE IF NOT EXISTS moldes (
  id           UUID      DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID      REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Entrada do usuário
  descricao    TEXT      NOT NULL,

  -- Saída da IA (texto)
  resultado    TEXT,

  -- Dados do molde paramétrico (SVG / coordenadas geradas pelo motor paramétrico)
  pattern_data JSONB,

  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE moldes ENABLE ROW LEVEL SECURITY;

-- Política: cada usuário acessa apenas seus próprios moldes
DROP POLICY IF EXISTS "usuario_ve_seus_moldes" ON moldes;
CREATE POLICY "usuario_ve_seus_moldes"
  ON moldes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índice para buscas por usuário (desempenho)
CREATE INDEX IF NOT EXISTS moldes_user_id_idx ON moldes (user_id, created_at DESC);
