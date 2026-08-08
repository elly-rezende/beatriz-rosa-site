-- ============================================================
-- Migração: simplifica a tabela appointments
-- (remove calendário/horário, adiciona idade da criança)
--
-- Só é necessário rodar isto UMA VEZ, porque a tabela antiga já existe
-- no seu banco (criada pelo schema.sql anterior). Como só tinha dados
-- de teste, a forma mais limpa é recriar a tabela do zero.
-- ============================================================

drop table if exists appointments;

create table appointments (
  id uuid primary key default gen_random_uuid(),
  responsible_name text not null,
  child_name text not null,
  child_age text,
  phone text,
  status text not null default 'pendente'
    check (status in ('pendente','confirmado','cancelado')),
  created_at timestamptz not null default now()
);

create index idx_appointments_created_at on appointments (created_at desc);
