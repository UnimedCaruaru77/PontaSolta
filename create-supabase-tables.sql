-- Criar tabelas no Supabase
-- Execute este SQL no painel do Supabase (SQL Editor)

-- Limpar tabelas existentes (se houver)
DROP TABLE IF EXISTS project_collaborators CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS card_history CASCADE;
DROP TABLE IF EXISTS checklist_items CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS columns CASCADE;
DROP TABLE IF EXISTS board_members CASCADE;
DROP TABLE IF EXISTS boards CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Criar enums (apenas se não existirem)
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TEAM_LEADER', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TeamRole" AS ENUM ('LEADER', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "BoardRole" AS ENUM ('ADMIN', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "Priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "Urgency" AS ENUM ('URGENT', 'NOT_URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ProjectMethodology" AS ENUM ('AGILE', 'LEAN_STARTUP', 'DESIGN_THINKING', 'PMI');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ProjectRole" AS ENUM ('OWNER', 'COLLABORATOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela de usuários
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password TEXT NOT NULL,
    role "UserRole" DEFAULT 'MEMBER',
    sector TEXT,
    branch TEXT,
    phone TEXT,
    lecom_username TEXT,
    can_open_tickets_for_others BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de equipes
CREATE TABLE teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_team_id TEXT REFERENCES teams(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de membros de equipe
CREATE TABLE team_members (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role "TeamRole" DEFAULT 'MEMBER',
    UNIQUE(user_id, team_id)
);

-- Tabela de quadros
CREATE TABLE boards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de membros de quadro
CREATE TABLE board_members (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    role "BoardRole" DEFAULT 'MEMBER',
    UNIQUE(user_id, board_id)
);

-- Tabela de colunas
CREATE TABLE columns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de cards
CREATE TABLE cards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    column_id TEXT NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
    board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    creator_id TEXT NOT NULL REFERENCES users(id),
    assignee_id TEXT REFERENCES users(id),
    position INTEGER NOT NULL,
    priority "Priority" DEFAULT 'MEDIUM',
    urgency "Urgency" DEFAULT 'NOT_URGENT',
    high_impact BOOLEAN DEFAULT false,
    is_project BOOLEAN DEFAULT false,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    lecom_ticket TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens de checklist
CREATE TABLE checklist_items (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    position INTEGER NOT NULL,
    parent_id TEXT REFERENCES checklist_items(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de cards
CREATE TABLE card_history (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de projetos
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    card_id TEXT UNIQUE NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    canvas JSONB,
    mvp_canvas JSONB,
    timeline JSONB,
    methodology "ProjectMethodology" DEFAULT 'AGILE',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de colaboradores de projeto
CREATE TABLE project_collaborators (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role "ProjectRole" DEFAULT 'COLLABORATOR',
    UNIQUE(project_id, user_id)
);

-- Criar índices para melhor performance
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_boards_team_id ON boards(team_id);
CREATE INDEX idx_columns_board_id ON columns(board_id);
CREATE INDEX idx_cards_board_id ON cards(board_id);
CREATE INDEX idx_cards_column_id ON cards(column_id);
CREATE INDEX idx_cards_creator_id ON cards(creator_id);
CREATE INDEX idx_cards_assignee_id ON cards(assignee_id);
CREATE INDEX idx_checklist_items_card_id ON checklist_items(card_id);
CREATE INDEX idx_card_history_card_id ON card_history(card_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (permitir tudo por enquanto)
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON teams FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON team_members FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON boards FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON board_members FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON columns FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON cards FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON checklist_items FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON card_history FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON project_collaborators FOR ALL USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_columns_updated_at BEFORE UPDATE ON columns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_checklist_items_updated_at BEFORE UPDATE ON checklist_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();