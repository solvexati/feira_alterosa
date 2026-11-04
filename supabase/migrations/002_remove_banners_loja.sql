-- Feira Alterosa — remove o banner por loja.
-- O "banner" do site é só a capa (até 5 imagens em feira_config.fotos_capa).
-- Cada loja tem apenas logo + até 10 fotos de produtos.
-- Seguro: a tabela não tem nenhum registro (verificado em 04/11/2026).

drop trigger if exists barraca_banners_limite on public.barraca_banners;
drop table if exists public.barraca_banners;
