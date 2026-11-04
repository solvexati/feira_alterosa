-- Transforma um usuário do Supabase Auth em administrador do site.
-- 1) No painel do Supabase: Authentication → Users → Add user → Create new user
--    (informe e-mail e senha e marque "Auto Confirm User").
-- 2) Troque o e-mail abaixo e rode este SQL no SQL Editor.
insert into public.admins (user_id)
select id from auth.users where email = 'SEU-EMAIL@exemplo.com'
on conflict (user_id) do nothing;

-- conferir:
select u.email from public.admins a join auth.users u on u.id = a.user_id;
