-- Feira Alterosa — dados iniciais
-- Só os dados da feira. As barracas são cadastradas de verdade pelo painel ADM do site.

insert into public.feira_config (id, nome, cidade, whatsapp, frase_capa, fotos_capa)
values (1, 'Feira Alterosa', 'Betim', null, 'Todo domingo, das 7h às 13h, em Betim.', '{}')
on conflict (id) do update set nome = excluded.nome, cidade = excluded.cidade, frase_capa = excluded.frase_capa;

-- Para começar do zero (apaga TODAS as barracas, fotos e banners do banco):
--   delete from public.barracas;
-- Os arquivos de imagem ficam no Storage (bucket "feira") e podem ser apagados pelo painel do Supabase.
