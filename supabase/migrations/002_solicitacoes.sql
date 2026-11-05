-- Feira Alterosa — pedidos de quem quer ser feirante (formulário "Quero ser feirante")
-- Qualquer visitante pode ENVIAR um pedido; só o administrador pode LER, mudar o status e apagar.
-- O CPF nunca fica visível para o público.

create table if not exists public.solicitacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 3 and 120),
  telefone text not null check (telefone ~ '^[0-9]{10,11}$'),       -- só dígitos, com DDD
  cpf text not null check (cpf ~ '^[0-9]{11}$'),                     -- só dígitos
  barraca text not null check (char_length(barraca) between 2 and 80),
  categoria text not null check (char_length(categoria) between 2 and 60),
  descricao text check (char_length(descricao) <= 300),
  status text not null default 'nova' check (status in ('nova', 'contatada', 'aprovada', 'recusada')),
  created_at timestamptz not null default now()
);
create index if not exists solicitacoes_created_idx on public.solicitacoes(created_at desc);

alter table public.solicitacoes enable row level security;

-- visitante (com ou sem login) só consegue criar um pedido novo
drop policy if exists "solicitacoes envio publico" on public.solicitacoes;
create policy "solicitacoes envio publico" on public.solicitacoes for insert to anon, authenticated
  with check (status = 'nova');

-- administrador: ler, mudar status e apagar
drop policy if exists "solicitacoes admin" on public.solicitacoes;
create policy "solicitacoes admin" on public.solicitacoes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant insert on public.solicitacoes to anon, authenticated;
grant select, update, delete on public.solicitacoes to authenticated;
