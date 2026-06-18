-- ============================================================
-- AUTH — Proteger os dados por usuário (rode no SQL Editor > Run)
-- Pode rodar mesmo que você já tenha criado as tabelas antes.
-- ============================================================

-- 1) Garante as tabelas (caso ainda não existam)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  description text not null default '',
  category text not null default 'Diversos',
  side text not null default 'eduardo' check (side in ('eduardo','maite','negocio','proprio')),
  type text not null default 'out' check (type in ('in','out')),
  amount numeric(12,2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);
create table if not exists public.savings (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  description text not null default 'Depósito',
  amount numeric(12,2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  meta numeric(12,2) not null default 1000,
  saldo_inicial numeric(12,2) not null default 0.13,
  updated_at timestamptz not null default now()
);

-- 2) Adiciona a coluna de "dono" (user_id) em cada tabela
alter table public.transactions add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.savings      add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.settings     add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- preenche automaticamente o dono ao inserir
create or replace function public.set_user_id()
returns trigger language plpgsql security definer as $$
begin
  if new.user_id is null then new.user_id := auth.uid(); end if;
  return new;
end; $$;

drop trigger if exists trg_uid_tx on public.transactions;
create trigger trg_uid_tx before insert on public.transactions
  for each row execute function public.set_user_id();
drop trigger if exists trg_uid_sv on public.savings;
create trigger trg_uid_sv before insert on public.savings
  for each row execute function public.set_user_id();
drop trigger if exists trg_uid_st on public.settings;
create trigger trg_uid_st before insert on public.settings
  for each row execute function public.set_user_id();

create index if not exists idx_tx_user on public.transactions (user_id, date desc);
create index if not exists idx_sv_user on public.savings (user_id, date desc);

-- 3) Ativa RLS e troca as políticas: cada um só vê o que é seu
alter table public.transactions enable row level security;
alter table public.savings enable row level security;
alter table public.settings enable row level security;

-- remove políticas antigas (abertas) se existirem
drop policy if exists anon_all_transactions on public.transactions;
drop policy if exists anon_all_savings on public.savings;
drop policy if exists anon_all_settings on public.settings;

drop policy if exists own_transactions on public.transactions;
create policy own_transactions on public.transactions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists own_savings on public.savings;
create policy own_savings on public.savings
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists own_settings on public.settings;
create policy own_settings on public.settings
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- Pronto. Agora só usuários logados acessam, e cada um vê apenas os seus dados.
-- ============================================================
