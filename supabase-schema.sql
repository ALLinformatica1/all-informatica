-- ==========================================================
-- ALL INFORMÁTICA — BANCO ONLINE
-- Cole este SQL no SQL Editor do Supabase e execute uma vez.
-- ==========================================================

create table if not exists public.all_produtos (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  dados jsonb not null,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.all_vendas (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  dados jsonb not null,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.all_ordens_servico (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  dados jsonb not null,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.all_produtos enable row level security;
alter table public.all_vendas enable row level security;
alter table public.all_ordens_servico enable row level security;

-- Cada usuário enxerga somente os próprios dados.
drop policy if exists "all_produtos_select_own" on public.all_produtos;
drop policy if exists "all_produtos_insert_own" on public.all_produtos;
drop policy if exists "all_produtos_update_own" on public.all_produtos;
drop policy if exists "all_produtos_delete_own" on public.all_produtos;
create policy "all_produtos_select_own" on public.all_produtos for select to authenticated using (user_id = auth.uid());
create policy "all_produtos_insert_own" on public.all_produtos for insert to authenticated with check (user_id = auth.uid());
create policy "all_produtos_update_own" on public.all_produtos for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "all_produtos_delete_own" on public.all_produtos for delete to authenticated using (user_id = auth.uid());

drop policy if exists "all_vendas_select_own" on public.all_vendas;
drop policy if exists "all_vendas_insert_own" on public.all_vendas;
drop policy if exists "all_vendas_update_own" on public.all_vendas;
drop policy if exists "all_vendas_delete_own" on public.all_vendas;
create policy "all_vendas_select_own" on public.all_vendas for select to authenticated using (user_id = auth.uid());
create policy "all_vendas_insert_own" on public.all_vendas for insert to authenticated with check (user_id = auth.uid());
create policy "all_vendas_update_own" on public.all_vendas for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "all_vendas_delete_own" on public.all_vendas for delete to authenticated using (user_id = auth.uid());

drop policy if exists "all_os_select_own" on public.all_ordens_servico;
drop policy if exists "all_os_insert_own" on public.all_ordens_servico;
drop policy if exists "all_os_update_own" on public.all_ordens_servico;
drop policy if exists "all_os_delete_own" on public.all_ordens_servico;
create policy "all_os_select_own" on public.all_ordens_servico for select to authenticated using (user_id = auth.uid());
create policy "all_os_insert_own" on public.all_ordens_servico for insert to authenticated with check (user_id = auth.uid());
create policy "all_os_update_own" on public.all_ordens_servico for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "all_os_delete_own" on public.all_ordens_servico for delete to authenticated using (user_id = auth.uid());

create index if not exists idx_all_produtos_user on public.all_produtos(user_id);
create index if not exists idx_all_vendas_user on public.all_vendas(user_id);
create index if not exists idx_all_os_user on public.all_ordens_servico(user_id);


-- ==========================================================
-- SUPABASE REALTIME
-- Permite que PC, celular e tablet recebam alterações automaticamente.
-- Execute este bloco uma vez depois das tabelas/policies acima.
-- ==========================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'all_produtos'
  ) then
    alter publication supabase_realtime add table public.all_produtos;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'all_vendas'
  ) then
    alter publication supabase_realtime add table public.all_vendas;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'all_ordens_servico'
  ) then
    alter publication supabase_realtime add table public.all_ordens_servico;
  end if;
end $$;
