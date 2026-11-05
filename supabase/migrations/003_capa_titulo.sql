-- Feira Alterosa — título e subtítulo editáveis da capa do site
-- (o subtítulo começa com a frase atual da capa)

alter table public.feira_config add column if not exists titulo_capa text check (char_length(titulo_capa) <= 70);
alter table public.feira_config add column if not exists subtitulo_capa text check (char_length(subtitulo_capa) <= 220);
update public.feira_config set subtitulo_capa = coalesce(subtitulo_capa, frase_capa) where id = 1;

-- avisa a API do Supabase que a estrutura mudou
notify pgrst, 'reload schema';
