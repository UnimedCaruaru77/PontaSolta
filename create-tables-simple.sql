-- Script simplificado para criar apenas as tabelas essenciais
-- Execute este SQL no painel do Supabase se houver problemas com o script completo

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'MEMBER',
    sector TEXT,
    branch TEXT,
    phone TEXT,
    lecom_username TEXT,
    can_open_tickets_for_others BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de equipes
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_team_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de membros de equipe
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    role TEXT DEFAULT 'MEMBER'
);

-- Tabela de quadros
CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    team_id TEXT NOT NULL,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de colunas
CREATE TABLE IF NOT EXISTS columns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    board_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de cards
CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    column_id TEXT NOT NULL,
    board_id TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    assignee_id TEXT,
    position INTEGER NOT NULL,
    priority TEXT DEFAULT 'MEDIUM',
    urgency TEXT DEFAULT 'NOT_URGENT',
    high_impact BOOLEAN DEFAULT false,
    is_project BOOLEAN DEFAULT false,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    lecom_ticket TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de itens de checklist
CREATE TABLE IF NOT EXISTS checklist_items (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    position INTEGER NOT NULL,
    parent_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS nas tabelas principais
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS permissivas (permitir tudo por enquanto)
DROP POLICY IF EXISTS "Allow all operations" ON users;
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON teams;
CREATE POLICY "Allow all operations" ON teams FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON team_members;
CREATE POLICY "Allow all operations" ON team_members FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON boards;
CREATE POLICY "Allow all operations" ON boards FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON columns;
CREATE POLICY "Allow all operations" ON columns FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON cards;
CREATE POLICY "Allow all operations" ON cards FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations" ON checklist_items;
CREATE POLICY "Allow all operations" ON checklist_items FOR ALL USING (true);