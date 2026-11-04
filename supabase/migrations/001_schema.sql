-- Feira Alterosa — esquema, RLS e Storage
-- Cada barraca: 1 logo, até 5 imagens de banner e até 10 fotos de produtos.
-- Hoje só o administrador cadastra e envia imagens. A coluna user_id e as policies
-- de "dono" ficam prontas para quando a área do feirante voltar.

create extension if not exists pgcrypto;

-- ===================== TABELAS =====================
create table if not exists public.feira_config (
  id int primary key default 1 check (id = 1),
  nome text not null default 'Feira Alterosa',
  cidade text default 'Betim',
  whatsapp text,
  frase_capa text default 'Todo domingo, das 7h às 13h, em Betim.',
  fotos_capa text[] default '{}'
);
insert into public.feira_config (id) values (1) on conflict (id) do nothing;

create table if not exists public.barracas (
  id uuid primary key default gen_random_uuid(),
  numero int not null unique check (numero between 1 and 48),
  nome text not null,
  proprietario text not null,
  categoria text not null,
  whatsapp text not null check (whatsapp ~ '^[0-9]{10,11}$'),   -- só dígitos, com DDD
  instagram text,                                                -- sem @
  descricao text check (char_length(descricao) <= 180),
  logo_path text,
  user_id uuid references auth.users(id) on delete set null,     -- conta do feirante (futuro)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists barracas_user_id_idx on public.barracas(user_id);

-- até 10 fotos de produtos por barraca
create table if not exists public.barraca_fotos (
  id uuid primary key default gen_random_uuid(),
  barraca_id uuid not null references public.barracas(id) on delete cascade,
  path text not null,
  ordem int not null,
  created_at timestamptz default now()
);
create index if not exists barraca_fotos_barraca_idx on public.barraca_fotos(barraca_id, ordem);

-- até 5 imagens de banner por barraca
create table if not exists public.barraca_banners (
  id uuid primary key default gen_random_uuid(),
  barraca_id uuid not null references public.barracas(id) on delete cascade,
  path text not null,
  ordem int not null,
  created_at timestamptz default now()
);
create index if not exists barraca_banners_barraca_idx on public.barraca_banners(barraca_id, ordem);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- ===================== FUNÇÕES =====================
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.minha_barraca_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.barracas where user_id = auth.uid() limit 1;
$$;

create or replace function public.tocar_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists barracas_updated_at on public.barracas;
create trigger barracas_updated_at before update on public.barracas
  for each row execute function public.tocar_updated_at();

-- limite de imagens por barraca (o limite vem do argumento do gatilho)
create or replace function public.limitar_imagens()
returns trigger language plpgsql set search_path = public as $$
declare
  limite int := TG_ARGV[0]::int;
  total int;
begin
  execute format('select count(*) from public.%I where barraca_id = $1', TG_TABLE_NAME)
    into total using new.barraca_id;
  if total >= limite then
    raise exception 'Limite de % imagens por barraca.', limite using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists barraca_fotos_limite on public.barraca_fotos;
create trigger barraca_fotos_limite before insert on public.barraca_fotos
  for each row execute function public.limitar_imagens('10');
drop trigger if exists barraca_banners_limite on public.barraca_banners;
create trigger barraca_banners_limite before insert on public.barraca_banners
  for each row execute function public.limitar_imagens('5');

-- ===================== VIEW PÚBLICA (sem user_id) =====================
create or replace view public.barracas_publicas as
  select id, numero, nome, proprietario, categoria, whatsapp, instagram, descricao, logo_path
    from public.barracas;
grant select on public.barracas_publicas to anon, authenticated;

-- ===================== RLS =====================
alter table public.feira_config    enable row level security;
alter table public.barracas        enable row level security;
alter table public.barraca_fotos   enable row level security;
alter table public.barraca_banners enable row level security;
alter table public.admins          enable row level security;

drop policy if exists "config leitura publica" on public.feira_config;
create policy "config leitura publica" on public.feira_config for select using (true);
drop policy if exists "config admin" on public.feira_config;
create policy "config admin" on public.feira_config for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- tabela base: admin (tudo) e dono (leitura). O público lê pela view.
drop policy if exists "barracas admin" on public.barracas;
create policy "barracas admin" on public.barracas for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "barracas dono le" on public.barracas;
create policy "barracas dono le" on public.barracas for select to authenticated
  using (user_id = auth.uid());

-- fotos e banners: leitura pública; admin tudo; dono só na própria barraca
drop policy if exists "fotos leitura publica" on public.barraca_fotos;
create policy "fotos leitura publica" on public.barraca_fotos for select using (true);
drop policy if exists "fotos admin" on public.barraca_fotos;
create policy "fotos admin" on public.barraca_fotos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "fotos dono" on public.barraca_fotos;
create policy "fotos dono" on public.barraca_fotos for all to authenticated
  using (barraca_id = public.minha_barraca_id()) with check (barraca_id = public.minha_barraca_id());

drop policy if exists "banners leitura publica" on public.barraca_banners;
create policy "banners leitura publica" on public.barraca_banners for select using (true);
drop policy if exists "banners admin" on public.barraca_banners;
create policy "banners admin" on public.barraca_banners for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins le proprio" on public.admins;
create policy "admins le proprio" on public.admins for select to authenticated
  using (user_id = auth.uid());

-- ===================== STORAGE =====================
-- bucket "feira": leitura pública, 2 MB por arquivo, só imagens
-- pastas: capa/, barracas/{id}/logo/, barracas/{id}/banners/, barracas/{id}/fotos/
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('feira', 'feira', true, 2097152, array['image/*'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/*'];

drop policy if exists "feira admin" on storage.objects;
create policy "feira admin" on storage.objects for all to authenticated
  using (bucket_id = 'feira' and public.is_admin())
  with check (bucket_id = 'feira' and public.is_admin());

drop policy if exists "feira feirante fotos" on storage.objects;
create policy "feira feirante fotos" on storage.objects for all to authenticated
  using (
    bucket_id = 'feira'
    and (storage.foldername(name))[1] = 'barracas'
    and (storage.foldername(name))[2] = public.minha_barraca_id()::text
    and (storage.foldername(name))[3] = 'fotos'
  )
  with check (
    bucket_id = 'feira'
    and (storage.foldername(name))[1] = 'barracas'
    and (storage.foldername(name))[2] = public.minha_barraca_id()::text
    and (storage.foldername(name))[3] = 'fotos'
  );
