-- Feira Alterosa — dados iniciais
-- Só os dados da feira. As barracas são cadastradas de verdade pelo painel ADM do site.

insert into public.feira_config (id, nome, cidade, whatsapp, frase_capa, fotos_capa)
values (1, 'Feira Alterosa', 'Betim', null, 'Todo domingo, das 7h às 13h, em Betim.', '{}')
on conflict (id) do update set nome = excluded.nome, cidade = excluded.cidade, frase_capa = excluded.frase_capa;

-- Barraca modelo (para ver como fica; edite ou remova pelo painel ADM)
insert into public.barracas (numero, nome, proprietario, categoria, whatsapp, instagram, descricao)
values (1, 'Barraca Modelo', 'Nome do Feirante', 'Hortifruti', '31999990000', null,
        'Exemplo de barraca. Pelo painel ADM, troque os dados e coloque a logo, o banner e as fotos.')
on conflict (numero) do nothing;

-- Para começar do zero (apaga TODAS as barracas, fotos e banners do banco):
--   delete from public.barracas;
-- Os arquivos de imagem ficam no Storage (bucket "feira") e podem ser apagados pelo painel do Supabase.
