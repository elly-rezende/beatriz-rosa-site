-- Adiciona o campo "motivo da consulta" (opcional) na tabela de agendamentos
alter table appointments add column if not exists reason text;
