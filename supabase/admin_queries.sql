-- FreakyQuest — queries de administração (rodar no SQL Editor do Supabase)
-- Só leitura (select), seguro versionar — nenhuma credencial aqui.

-- 1) Quantos estão cadastrados vs. quantos realmente usam
select
  (select count(*) from auth.users) as total_contas_criadas,
  (select count(*) from public.profiles) as total_com_progresso_salvo,
  (select count(*) from public.public_profiles) as total_com_apelido_definido;

-- 2) Lista completa: quem é, quando entrou, quando usou por último, nível/streak
select
  u.email,
  u.created_at as conta_criada_em,
  u.last_sign_in_at as ultimo_login,
  pp.nickname,
  pp.level,
  pp.xp,
  pp.current_streak,
  p.updated_at as progresso_salvo_pela_ultima_vez,
  (p.state->>'workoutsCompleted')::int as treinos_completados,
  p.state->>'appMode' as modo_do_app
from auth.users u
left join public.profiles p on p.id = u.id
left join public.public_profiles pp on pp.id = u.id
order by u.created_at desc;
