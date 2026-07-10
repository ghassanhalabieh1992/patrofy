-- =============================================
-- PATROFY — Knowledge Platform + Expert Portal
-- Execute este script no SQL Editor do Supabase
-- (não altera a tabela "moldes" existente)
-- =============================================

-- =============================================
-- 1) PERFIS E PAPÉIS (roles)
-- =============================================

CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'expert', 'admin')),
  name       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Cria automaticamente um perfil ("user") para cada novo cadastro
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Preenche perfis para usuários que já existem (rodar uma vez é seguro sempre)
INSERT INTO profiles (id, name)
SELECT id, raw_user_meta_data->>'name' FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Funções auxiliares (SECURITY DEFINER evita recursão de RLS em "profiles")
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_expert_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('expert', 'admin'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Única forma permitida de alterar o papel de um usuário (usada pela tela /admin/users)
-- Qualquer admin pode conceder/revogar "expert", mas somente o admin principal
-- (email fixo abaixo) pode conceder o papel de "admin".
CREATE OR REPLACE FUNCTION set_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID AS $$
DECLARE
  caller_email TEXT;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar papéis de usuário';
  END IF;
  IF new_role NOT IN ('user', 'expert', 'admin') THEN
    RAISE EXCEPTION 'Papel inválido: %', new_role;
  END IF;
  IF new_role = 'admin' THEN
    SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();
    IF caller_email IS DISTINCT FROM 'ghassanhalabieh@gmail.com' THEN
      RAISE EXCEPTION 'Apenas o administrador principal pode conceder o papel de admin';
    END IF;
  END IF;
  UPDATE profiles SET role = new_role WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Lista todos os perfis com email (para a tela /admin/users) — admin only
CREATE OR REPLACE FUNCTION list_profiles_with_email()
RETURNS TABLE (id UUID, email TEXT, name TEXT, role TEXT, created_at TIMESTAMPTZ) AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem listar usuários';
  END IF;
  RETURN QUERY
    SELECT p.id, u.email::TEXT, p.name, p.role, p.created_at
    FROM profiles p JOIN auth.users u ON u.id = p.id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "usuario_ve_proprio_perfil" ON profiles;
CREATE POLICY "usuario_ve_proprio_perfil" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "admin_ve_todos_perfis" ON profiles;
CREATE POLICY "admin_ve_todos_perfis" ON profiles
  FOR SELECT USING (is_admin());

-- =============================================
-- 2) PLATAFORMA DE CONHECIMENTO
-- =============================================

CREATE TABLE IF NOT EXISTS pattern_types (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected')),
  created_by  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewed_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Migração para bancos já criados antes deste campo existir (seguro rodar sempre)
ALTER TABLE pattern_types ADD COLUMN IF NOT EXISTS description TEXT;

CREATE TABLE IF NOT EXISTS pattern_components (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_type_id UUID REFERENCES pattern_types(id) ON DELETE CASCADE NOT NULL,
  name            TEXT NOT NULL,
  order_index     INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS measurements (
  id       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code     TEXT NOT NULL UNIQUE,
  label_pt TEXT NOT NULL,
  unit     TEXT NOT NULL DEFAULT 'cm'
);

CREATE TABLE IF NOT EXISTS pattern_type_measurements (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_type_id  UUID REFERENCES pattern_types(id) ON DELETE CASCADE NOT NULL,
  measurement_id   UUID REFERENCES measurements(id) ON DELETE CASCADE NOT NULL,
  is_required      BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (pattern_type_id, measurement_id)
);

CREATE TABLE IF NOT EXISTS formulas (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_component_id  UUID REFERENCES pattern_components(id) ON DELETE CASCADE NOT NULL,
  point_name            TEXT NOT NULL,
  expression            TEXT NOT NULL,
  expression_type       TEXT NOT NULL CHECK (expression_type IN ('point_x', 'point_y', 'distance', 'angle')),
  order_index           INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS construction_rules (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_type_id       UUID REFERENCES pattern_types(id) ON DELETE CASCADE NOT NULL,
  condition_expression  TEXT NOT NULL,
  adjustment_formula    TEXT NOT NULL,
  priority              INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ease_rules (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_component_id  UUID REFERENCES pattern_components(id) ON DELETE CASCADE NOT NULL,
  fabric_type           TEXT,
  ease_cm               NUMERIC NOT NULL DEFAULT 0,
  notes                 TEXT
);

CREATE TABLE IF NOT EXISTS validation_rules (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_type_id  UUID REFERENCES pattern_types(id) ON DELETE CASCADE NOT NULL,
  rule_type        TEXT NOT NULL,
  expression       TEXT NOT NULL,
  error_message    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pattern_reference_files (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_component_id  UUID REFERENCES pattern_components(id) ON DELETE CASCADE NOT NULL,
  file_url              TEXT NOT NULL,
  file_type             TEXT NOT NULL CHECK (file_type IN ('image', 'pdf', 'dxf', 'ads', 'amk', 'adsx', 'amkx')),
  uploaded_by           UUID REFERENCES auth.users(id) NOT NULL,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pattern_points (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_component_id  UUID REFERENCES pattern_components(id) ON DELETE CASCADE NOT NULL,
  reference_file_id     UUID REFERENCES pattern_reference_files(id) ON DELETE SET NULL,
  label                 TEXT NOT NULL,
  x_cm                  NUMERIC NOT NULL,
  y_cm                  NUMERIC NOT NULL,
  linked_formula_id     UUID REFERENCES formulas(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS expert_notes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  note_text   TEXT NOT NULL,
  created_by  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices (colunas de FK não são indexadas automaticamente no Postgres)
CREATE INDEX IF NOT EXISTS pattern_types_created_by_idx        ON pattern_types (created_by, status);
CREATE INDEX IF NOT EXISTS pattern_components_pt_idx           ON pattern_components (pattern_type_id);
CREATE INDEX IF NOT EXISTS pattern_type_measurements_pt_idx    ON pattern_type_measurements (pattern_type_id);
CREATE INDEX IF NOT EXISTS formulas_pc_idx                     ON formulas (pattern_component_id);
CREATE INDEX IF NOT EXISTS construction_rules_pt_idx           ON construction_rules (pattern_type_id);
CREATE INDEX IF NOT EXISTS ease_rules_pc_idx                   ON ease_rules (pattern_component_id);
CREATE INDEX IF NOT EXISTS validation_rules_pt_idx              ON validation_rules (pattern_type_id);
CREATE INDEX IF NOT EXISTS pattern_reference_files_pc_idx      ON pattern_reference_files (pattern_component_id);
CREATE INDEX IF NOT EXISTS pattern_points_pc_idx                ON pattern_points (pattern_component_id);

-- Funções que dependem das tabelas acima (por isso ficam aqui, não na seção 1)
CREATE OR REPLACE FUNCTION owns_pattern_type(pt_id UUID)
RETURNS BOOLEAN AS $$
  SELECT is_admin() OR EXISTS (
    SELECT 1 FROM pattern_types WHERE id = pt_id AND created_by = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION owns_pattern_component(pc_id UUID)
RETURNS BOOLEAN AS $$
  SELECT is_admin() OR EXISTS (
    SELECT 1 FROM pattern_components pc
    JOIN pattern_types pt ON pt.id = pc.pattern_type_id
    WHERE pc.id = pc_id AND pt.created_by = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- 3) ROW LEVEL SECURITY — plataforma de conhecimento
-- =============================================

ALTER TABLE pattern_types             ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_components        ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements              ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_type_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulas                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE construction_rules        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ease_rules                ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_rules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_reference_files   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_points            ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_notes              ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expert_gerencia_seus_patterns" ON pattern_types;
CREATE POLICY "expert_gerencia_seus_patterns" ON pattern_types
  FOR ALL
  USING (is_admin() OR created_by = auth.uid())
  WITH CHECK (is_expert_or_admin() AND (is_admin() OR created_by = auth.uid()));

DROP POLICY IF EXISTS "gerencia_componentes" ON pattern_components;
CREATE POLICY "gerencia_componentes" ON pattern_components
  FOR ALL
  USING (owns_pattern_type(pattern_type_id))
  WITH CHECK (owns_pattern_type(pattern_type_id));

DROP POLICY IF EXISTS "expert_le_medidas" ON measurements;
CREATE POLICY "expert_le_medidas" ON measurements
  FOR SELECT USING (is_expert_or_admin());

DROP POLICY IF EXISTS "expert_adiciona_medidas" ON measurements;
CREATE POLICY "expert_adiciona_medidas" ON measurements
  FOR INSERT WITH CHECK (is_expert_or_admin());

DROP POLICY IF EXISTS "admin_edita_medidas" ON measurements;
CREATE POLICY "admin_edita_medidas" ON measurements
  FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "admin_remove_medidas" ON measurements;
CREATE POLICY "admin_remove_medidas" ON measurements
  FOR DELETE USING (is_admin());

DROP POLICY IF EXISTS "gerencia_medidas_do_pattern" ON pattern_type_measurements;
CREATE POLICY "gerencia_medidas_do_pattern" ON pattern_type_measurements
  FOR ALL
  USING (owns_pattern_type(pattern_type_id))
  WITH CHECK (owns_pattern_type(pattern_type_id));

DROP POLICY IF EXISTS "gerencia_formulas" ON formulas;
CREATE POLICY "gerencia_formulas" ON formulas
  FOR ALL
  USING (owns_pattern_component(pattern_component_id))
  WITH CHECK (owns_pattern_component(pattern_component_id));

DROP POLICY IF EXISTS "gerencia_regras_construcao" ON construction_rules;
CREATE POLICY "gerencia_regras_construcao" ON construction_rules
  FOR ALL
  USING (owns_pattern_type(pattern_type_id))
  WITH CHECK (owns_pattern_type(pattern_type_id));

DROP POLICY IF EXISTS "gerencia_folga" ON ease_rules;
CREATE POLICY "gerencia_folga" ON ease_rules
  FOR ALL
  USING (owns_pattern_component(pattern_component_id))
  WITH CHECK (owns_pattern_component(pattern_component_id));

DROP POLICY IF EXISTS "gerencia_validacao" ON validation_rules;
CREATE POLICY "gerencia_validacao" ON validation_rules
  FOR ALL
  USING (owns_pattern_type(pattern_type_id))
  WITH CHECK (owns_pattern_type(pattern_type_id));

DROP POLICY IF EXISTS "gerencia_arquivos_referencia" ON pattern_reference_files;
CREATE POLICY "gerencia_arquivos_referencia" ON pattern_reference_files
  FOR ALL
  USING (owns_pattern_component(pattern_component_id))
  WITH CHECK (owns_pattern_component(pattern_component_id));

DROP POLICY IF EXISTS "gerencia_pontos" ON pattern_points;
CREATE POLICY "gerencia_pontos" ON pattern_points
  FOR ALL
  USING (owns_pattern_component(pattern_component_id))
  WITH CHECK (owns_pattern_component(pattern_component_id));

DROP POLICY IF EXISTS "expert_gerencia_suas_notas" ON expert_notes;
CREATE POLICY "expert_gerencia_suas_notas" ON expert_notes
  FOR ALL
  USING (is_admin() OR created_by = auth.uid())
  WITH CHECK (is_expert_or_admin() AND (is_admin() OR created_by = auth.uid()));

-- =============================================
-- 4) STORAGE — arquivos de referência (PDF/imagem/DXF)
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('pattern-references', 'pattern-references', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "expert_envia_arquivos_referencia" ON storage.objects;
CREATE POLICY "expert_envia_arquivos_referencia" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pattern-references' AND is_expert_or_admin());

DROP POLICY IF EXISTS "expert_le_arquivos_referencia" ON storage.objects;
CREATE POLICY "expert_le_arquivos_referencia" ON storage.objects
  FOR SELECT USING (bucket_id = 'pattern-references' AND is_expert_or_admin());

DROP POLICY IF EXISTS "expert_apaga_seus_arquivos_referencia" ON storage.objects;
CREATE POLICY "expert_apaga_seus_arquivos_referencia" ON storage.objects
  FOR DELETE USING (bucket_id = 'pattern-references' AND (is_admin() OR owner = auth.uid()));

-- =============================================
-- 5) SEED — dicionário de medidas (mesmas 17 medidas já usadas em lib/patterns)
-- =============================================

INSERT INTO measurements (code, label_pt, unit) VALUES
  ('cintura',     'Cintura',           'cm'),
  ('quadril',     'Quadril',           'cm'),
  ('comprimento', 'Comprimento',       'cm'),
  ('busto',       'Busto / Peitoral',  'cm'),
  ('altura',      'Altura total',      'cm'),
  ('mangas',      'Comprimento manga', 'cm'),
  ('ombros',      'Largura ombros',    'cm'),
  ('pescoco',     'Pescoço (circ.)',   'cm'),
  ('dorsoCostas', 'Largura costas',    'cm'),
  ('profCava',    'Prof. cava',        'cm'),
  ('punho',       'Punho (circ.)',     'cm'),
  ('bracoCirc',   'Braço (circ.)',     'cm'),
  ('entrepernas', 'Entrep. (interno)', 'cm'),
  ('cava',        'Cava (circ.)',      'cm'),
  ('coxa',        'Coxa (circ.)',      'cm'),
  ('joelho',      'Joelho (circ.)',    'cm'),
  ('tornozelo',   'Tornozelo (circ.)', 'cm')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 6) BOOTSTRAP DO PRIMEIRO ADMIN (rodar manualmente uma única vez)
-- Troque o email abaixo pelo seu e remova o comentário para executar.
-- =============================================

-- UPDATE profiles SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'ghassanhalabieh@gmail.com');
