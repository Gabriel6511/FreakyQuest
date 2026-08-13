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

-- ==========================================
-- 6. MIGRAÇÃO 2026-08-13 — visão de admin (painel local `admin.html`)
--
-- DECISÃO DE SEGURANÇA: o painel admin NÃO usa a service_role key. Essa
-- chave ignora todo o RLS e daria acesso irrestrito a peso/dieta/lesões de
-- todo mundo; guardá-la em texto puro num arquivo local seria um ponto
-- único de vazamento pra sempre. Em vez disso o painel loga com o mesmo
-- fluxo de e-mail + código do app (usando a chave publishable, que já é
-- pública) e chama esta função. A checagem de dono acontece DENTRO do
-- banco, comparando o e-mail do usuário autenticado — não dá pra burlar
-- pelo client, e nenhum segredo precisa existir fora do Supabase.
--
-- Pra passar o painel pra outro dono no futuro, é só trocar o e-mail aqui.
-- ==========================================
create or replace function public.admin_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  caller_email text;
  flame bigint := 0;
  result jsonb;
begin
  select email into caller_email from auth.users where id = auth.uid();
  if caller_email is distinct from 'gabrielnavarrobruno@gmail.com' then
    raise exception 'Acesso negado: essa funcao e restrita ao dono do app.';
  end if;

  -- to_regclass evita quebrar caso a migração 5 (Chama Eterna) ainda não
  -- tenha sido rodada neste projeto.
  if to_regclass('public.eternal_flame') is not null then
    execute 'select clicks from public.eternal_flame where id = 1' into flame;
  end if;

  select jsonb_build_object(
    'gerado_em', now(),
    'totais', jsonb_build_object(
      'contas', (select count(*) from auth.users),
      'com_progresso', (select count(*) from public.profiles),
      'ativos_7d', (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
      'ativos_30d', (select count(*) from auth.users where last_sign_in_at > now() - interval '30 days'),
      'novos_7d', (select count(*) from auth.users where created_at > now() - interval '7 days'),
      'chama_eterna', coalesce(flame, 0),
      'amizades', (select count(*) from public.friendships)
    ),
    'usuarios', (select coalesce(jsonb_agg(to_jsonb(t) order by t.criada_em desc), '[]'::jsonb) from (
      select u.email, pp.nickname as apelido, u.created_at as criada_em,
             u.last_sign_in_at as ultimo_login, pp.level as nivel, pp.xp,
             pp.current_streak as streak,
             (p.state->>'workoutsCompleted')::int as treinos,
             p.state->>'activeMentor' as mentor,
             p.state->>'appMode' as modo,
             p.updated_at as progresso_salvo
      from auth.users u
      left join public.profiles p on p.id = u.id
      left join public.public_profiles pp on pp.id = u.id
    ) t),
    'mentores', (select coalesce(jsonb_object_agg(mentor, qtd), '{}'::jsonb) from (
      select coalesce(state->>'activeMentor', '(sem dados)') as mentor, count(*) as qtd
      from public.profiles group by 1
    ) m),
    'modos', (select coalesce(jsonb_object_agg(modo, qtd), '{}'::jsonb) from (
      select coalesce(state->>'appMode', '(sem dados)') as modo, count(*) as qtd
      from public.profiles group by 1
    ) mo)
  ) into result;

  return result;
end;
$fn$;

revoke execute on function public.admin_overview() from public;
grant execute on function public.admin_overview() to authenticated;

-- ==========================================
-- 7. MIGRAÇÃO 2026-08-13 — Cartão de amigo com compartilhamento opt-in
--
-- Antes o app não tinha NENHUMA forma de ver o perfil de um amigo — a lista
-- só mostrava nome/nível/XP/streak (já público pro ranking). Agora dá pra
-- abrir o card de um amigo e ver mais: recordes pessoais, mentores em
-- destaque, troféus fixados (Modo RPG) ou treinos/dias da semana (Modo
-- Simples) — mas SÓ o que essa pessoa marcou como "quero compartilhar".
-- Cada categoria tem o próprio interruptor, começando todos DESLIGADOS
-- (opt-in, nunca opt-out).
--
-- Os 4 booleanos abaixo ficam em public_profiles (não em profiles) porque
-- QUALQUER amigo precisa poder ler "esse cara compartilha recordes?" antes
-- de decidir se pede os dados — e public_profiles já é lida por todo
-- autenticado (linha 45), diferente de profiles que é 100% privada.
--
-- A função get_friend_card() é quem realmente busca os dados de dentro de
-- `profiles.state` (que continua com RLS travada, só o dono lê direto) —
-- ela roda como SECURITY DEFINER, confere amizade de verdade no banco (não
-- confia em nada vindo do client) e só devolve cada campo se o dono daquele
-- perfil ligou o toggle correspondente.
-- ==========================================
alter table public.public_profiles
  add column if not exists share_prs boolean not null default false,
  add column if not exists share_mentors boolean not null default false,
  add column if not exists share_trophies boolean not null default false,
  add column if not exists share_schedule boolean not null default false;

create or replace function public.get_friend_card(target_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  is_friend boolean;
  target_state jsonb;
  target_pub record;
  result jsonb;
begin
  if target_id = auth.uid() then
    is_friend := true; -- ver o próprio card sempre funciona (pré-visualização)
  else
    select exists(
      select 1 from public.friendships
      where (user_id = auth.uid() and friend_id = target_id)
         or (user_id = target_id and friend_id = auth.uid())
    ) into is_friend;
  end if;

  if not is_friend then
    raise exception 'Vocês precisam ser amigos pra ver esse card.';
  end if;

  select nickname, level, xp, active_mentor, current_streak,
         share_prs, share_mentors, share_trophies, share_schedule
  into target_pub
  from public.public_profiles where id = target_id;

  if target_pub is null then
    raise exception 'Perfil não encontrado.';
  end if;

  select state into target_state from public.profiles where id = target_id;
  target_state := coalesce(target_state, '{}'::jsonb);

  select jsonb_build_object(
    'nickname', target_pub.nickname,
    'level', target_pub.level,
    'xp', target_pub.xp,
    'active_mentor', target_pub.active_mentor,
    'current_streak', target_pub.current_streak,
    'app_mode', target_state->>'appMode',
    'char_class', target_state->>'charClass',
    'prs', case when target_pub.share_prs
      then target_state->'personalRecords' else null end,
    'mentor_affinities', case when target_pub.share_mentors
      then target_state->'mentorAffinities' else null end,
    'showcase_trophies', case when target_pub.share_trophies
      then target_state->'showcaseTrophies' else null end,
    'training_days', case when target_pub.share_schedule
      then target_state->'trainingDays' else null end,
    'custom_workouts', case when target_pub.share_schedule
      then target_state->'customWorkouts' else null end,
    'shares', jsonb_build_object(
      'prs', target_pub.share_prs, 'mentors', target_pub.share_mentors,
      'trophies', target_pub.share_trophies, 'schedule', target_pub.share_schedule
    )
  ) into result;

  return result;
end;
$fn$;

revoke execute on function public.get_friend_card(uuid) from public;
grant execute on function public.get_friend_card(uuid) to authenticated;
