-- FreakyQuest — esquema inicial do Supabase
-- Rodar isto inteiro no SQL Editor do painel do Supabase (Project → SQL Editor → New query)
-- Etapas 1-2 (login + sync) usam só `profiles`. Etapas 3-4 (amigos + ranking)
-- usam `public_profiles` e `friendships` — já criamos tudo de uma vez pra não
-- precisar voltar aqui depois.

create extension if not exists "pgcrypto";

-- ==========================================
-- 1. PROGRESSO PRIVADO (espelho do `state` local, só o dono acessa)
-- ==========================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_owner_select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_owner_insert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_owner_update" on public.profiles
  for update using (auth.uid() = id);

-- ==========================================
-- 2. DADOS PÚBLICOS DE VITRINE (ranking + comparação com amigos)
-- Só o que é seguro mostrar pra outras pessoas: apelido, XP, nível, mentor
-- ativo e sequência de treino. NUNCA peso/altura/dieta/dores articulares.
-- ==========================================
create table public.public_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  xp int not null default 0,
  level int not null default 1,
  active_mentor text,
  current_streak int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.public_profiles enable row level security;

-- Qualquer usuário logado pode ver o ranking (nome + stats públicas de todo mundo)
create policy "public_profiles_read_all" on public.public_profiles
  for select using (auth.role() = 'authenticated');
create policy "public_profiles_owner_insert" on public.public_profiles
  for insert with check (auth.uid() = id);
create policy "public_profiles_owner_update" on public.public_profiles
  for update using (auth.uid() = id);

-- ==========================================
-- 3. AMIZADES (por código de convite — sem busca pública por nome)
-- ==========================================
create table public.friendships (
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id)
);

alter table public.friendships enable row level security;

create policy "friendships_owner_select" on public.friendships
  for select using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "friendships_owner_insert" on public.friendships
  for insert with check (auth.uid() = user_id);
create policy "friendships_owner_delete" on public.friendships
  for delete using (auth.uid() = user_id);

-- ==========================================
-- 4. MIGRAÇÃO 2026-08-10 — permite apagar os próprios dados
-- (botão "Apagar dados da nuvem" e o reset de progresso quando logado)
-- ==========================================
create policy "profiles_owner_delete" on public.profiles
  for delete using (auth.uid() = id);
create policy "public_profiles_owner_delete" on public.public_profiles
  for delete using (auth.uid() = id);

-- ==========================================
-- 5. MIGRAÇÃO 2026-08-13 — Chama Eterna cooperativa (contador global)
-- Antes cada usuário tinha sua própria contagem local (eternalFlameClicks no
-- state), então um toque só aparecia pra quem tocou. Agora é uma única linha
-- compartilhada por todo mundo: leitura é pública (mesmo deslogado, pra
-- qualquer um ver o total), e o incremento só acontece via função com
-- SECURITY DEFINER — a tabela em si não aceita UPDATE direto de ninguém, só
-- +1 atômico por vez, então nunca dá pra "setar" o contador pra um valor
-- arbitrário nem perder toques em cliques simultâneos de pessoas diferentes.
-- ==========================================
create table public.eternal_flame (
  id int primary key default 1,
  clicks bigint not null default 0,
  constraint eternal_flame_single_row check (id = 1)
);

insert into public.eternal_flame (id, clicks) values (1, 0);

alter table public.eternal_flame enable row level security;

create policy "eternal_flame_read_all" on public.eternal_flame
  for select using (true);
-- Sem policy de insert/update/delete de propósito — a única forma de mudar
-- o valor é a função abaixo.

create or replace function public.increment_eternal_flame()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count bigint;
begin
  update public.eternal_flame set clicks = clicks + 1 where id = 1
  returning clicks into new_count;
  return new_count;
end;
$$;

-- Só usuário logado pode incrementar (mesma exigência das outras features
-- de nuvem do app — sem login, o toque fica só local, como já era antes).
revoke execute on function public.increment_eternal_flame() from public;
grant execute on function public.increment_eternal_flame() to authenticated;
