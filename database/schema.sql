-- ============================================================
-- Site da Dra. Beatriz Rosa — Schema do banco de dados (Neon/Postgres)
--
-- Diferença em relação ao modelo anterior (Supabase):
-- aqui o banco NÃO tem regras de acesso embutidas (Row Level Security).
-- Ele confia totalmente em quem se conecta a ele — e só a nossa API
-- (rodando no servidor, nunca no navegador) tem a senha de conexão.
-- Por isso a validação de "quem pode fazer o quê" mora no código
-- da API (pasta /api), não no banco.
--
-- Rode este arquivo inteiro no Neon: SQL Editor → cole tudo → Run.
-- ============================================================

-- Extensão necessária para gerar IDs únicos (uuid) automaticamente
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tabela: admins
-- Guarda o(s) login(s) de acesso ao painel. Normalmente só terá
-- uma linha (a Dra. Beatriz), mas está no formato de tabela para
-- o caso de, no futuro, mais de uma pessoa precisar de acesso.
-- ------------------------------------------------------------
create table if not exists admins (
  id serial primary key,
  email text unique not null,
  password_hash text not null,      -- nunca a senha em texto puro, sempre o hash (bcrypt)
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Tabela: appointments
-- O agendamento em si.
-- ------------------------------------------------------------
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  appointment_date date not null,
  appointment_time text not null,
  responsible_name text not null,
  child_name text,
  phone text,
  status text not null default 'pendente'
    check (status in ('pendente','confirmado','cancelado')),
  created_at timestamptz not null default now()
);

-- Impede dois agendamentos ativos (não cancelados) no mesmo dia+horário.
-- Isso é garantido pelo PRÓPRIO BANCO, então mesmo que a API tenha um bug,
-- é fisicamente impossível existir duas linhas ativas com o mesmo horário.
create unique index if not exists unique_active_slot
  on appointments (appointment_date, appointment_time)
  where status != 'cancelado';

-- Acelera a consulta mais comum: "quais horários já estão ocupados nesse dia?"
create index if not exists idx_appointments_date
  on appointments (appointment_date);

-- ------------------------------------------------------------
-- Tabela: booking_attempts
-- Usada só para limitar tentativas de agendamento por IP
-- (evita que um script mal-intencionado crie centenas de agendamentos
-- falsos em minutos — "rate limiting" simples).
-- ------------------------------------------------------------
create table if not exists booking_attempts (
  id serial primary key,
  ip text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_booking_attempts_ip_time
  on booking_attempts (ip, created_at);
