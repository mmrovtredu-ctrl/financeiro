-- ============================================================
-- Controle Financeiro Casava (Eduardo & Maitê)
-- Cole TODO este conteúdo no Supabase: SQL Editor > New query > Run
-- ============================================================

-- Movimentações (entradas e saídas)
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

-- Depósitos na poupança da Maitê
create table if not exists public.savings (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  description text not null default 'Depósito',
  amount numeric(12,2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);

-- Configurações (meta da poupança e saldo inicial) — linha única
create table if not exists public.settings (
  id int primary key default 1,
  meta numeric(12,2) not null default 1000,
  saldo_inicial numeric(12,2) not null default 0.13,
  updated_at timestamptz not null default now(),
  constraint settings_single_row check (id = 1)
);

insert into public.settings (id, meta, saldo_inicial)
  values (1, 1000, 0.13)
  on conflict (id) do nothing;

create index if not exists idx_transactions_date on public.transactions (date desc);
create index if not exists idx_savings_date on public.savings (date desc);

-- ============================================================
-- SEGURANÇA (RLS)
-- App pessoal sem login: liberado para a chave anon (pública).
-- ⚠️ IMPORTANTE: com estas políticas, QUALQUER pessoa que tenha a URL
-- do projeto + a anon key consegue ler e escrever nestas tabelas.
-- Como a anon key fica no código (e no GitHub), recomenda-se:
--   • manter o repositório PRIVADO, ou
--   • adicionar Supabase Auth e trocar as políticas por auth.uid().
-- ============================================================
alter table public.transactions enable row level security;
alter table public.savings enable row level security;
alter table public.settings enable row level security;

drop policy if exists anon_all_transactions on public.transactions;
create policy anon_all_transactions on public.transactions
  for all to anon, authenticated using (true) with check (true);

drop policy if exists anon_all_savings on public.savings;
create policy anon_all_savings on public.savings
  for all to anon, authenticated using (true) with check (true);

drop policy if exists anon_all_settings on public.settings;
create policy anon_all_settings on public.settings
  for all to anon, authenticated using (true) with check (true);
