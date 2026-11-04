-- Feira Alterosa — dados de exemplo (as 12 barracas do modelo)
-- Rode depois da migração 001_schema.sql.

insert into public.feira_config (id, nome, cidade, whatsapp, frase_capa, fotos_capa)
values (1, 'Feira Alterosa', 'Betim', '31999990000', 'Todo domingo, das 7h às 13h, em Betim.', '{}')
on conflict (id) do update set nome = excluded.nome, cidade = excluded.cidade,
  whatsapp = excluded.whatsapp, frase_capa = excluded.frase_capa;

insert into public.barracas (numero, nome, proprietario, categoria, whatsapp, instagram, descricao) values
  ( 1, 'Caldo de Cana do Zé',     'José Ribeiro',    'Bebidas',    '31921110099', 'caldodecanadoze',   'Caldo de cana com limão ou abacaxi, gelado na hora.'),
  ( 3, 'Pastel do Seu João',      'João Batista',    'Comidas',    '31991234567', 'pasteldoseujoao',   'Pastel na hora: carne, queijo, palmito e o especial de bacalhau.'),
  ( 7, 'Queijos Serra Azul',      'Rosângela Lima',  'Laticínios', '31975551234', 'queijosserraazul',  'Queijo minas, canastra curado, requeijão de corte e manteiga.'),
  (12, 'Hortifruti da Maria',     'Maria Aparecida', 'Hortifruti', '31987654321', 'hortifrutidamaria', 'Verduras colhidas no sábado, frutas da estação e cheiro-verde.'),
  (15, 'Frutas do Kenji',         'Kenji Tanaka',    'Hortifruti', '31919998877', 'frutasdokenji',     'Caqui, morango, uva e banana direto do sítio.'),
  (18, 'Flores da Dona Lúcia',    'Lúcia Ferreira',  'Flores',     '31964443322', 'floresdadonalucia', 'Buquês, vasos de orquídea e mudas para horta.'),
  (21, 'Peixaria Mar Aberto',     'Carlos Nunes',    'Peixes',     '31958887766', 'peixariamaraberto', 'Sardinha, tilápia, camarão limpo e filé de pescada.'),
  (26, 'Temperos & Cia',          'Fátima Souza',    'Temperos',   '31943332211', 'temperosecia',      'Ervas secas, pimentas, castanhas e grãos a granel.'),
  (30, 'Mãos de Barro',           'Ana Clara Rocha', 'Artesanato', '31932221100', 'maosdebarro',       'Cerâmica feita à mão: canecas, travessas e vasinhos.'),
  (34, 'Doces da Vó Nena',        'Antônia Silva',   'Doces',      '31908887766', 'docesdavonena',     'Doce de leite, goiabada cascão, cocada e pé de moleque.'),
  (40, 'Pães da Fazenda',         'Roberto Alves',   'Padaria',    '31997776655', 'paesdafazenda',     'Pão de fermentação natural, broa de milho e rosca.'),
  (44, 'Ovos Sítio Bom Sucesso',  'Marcos Pereira',  'Hortifruti', '31986665544', 'sitiobomsucesso',   'Ovos caipiras, mel e mandioca descascada.')
on conflict (numero) do nothing;

-- As contas de login (admin de teste e feirante de teste) são criadas pelo script:
--   node --env-file=.env scripts/criar-contas.mjs
-- porque criar usuários no Supabase Auth exige a service_role.
