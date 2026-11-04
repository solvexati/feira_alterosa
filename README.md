# Feira Alterosa (Betim/MG)

Site da Feira Alterosa feito em **HTML, CSS e JavaScript puro**, seguindo o protótipo aprovado (`feira-modelo.html`) em layout, cores, fontes, textos e comportamento.
Os dados ficam no **Supabase** (Postgres, Auth e Storage) e o site é publicado na **Vercel** a cada `git push` no `main`.

- Site: https://feira-alterosa.vercel.app
- Supabase: projeto `feira_alterosa` (`debphfbpqinwstugjfgz`)

```
index.html               marcação das telas (igual ao modelo)
css/style.css            CSS do modelo (mobile first: 700px, 900px e 1024px)
js/config.js             URL e chave pública do Supabase (vazio = modo demonstração)
js/data.js               camada de dados: Supabase ou modo demonstração (localStorage)
js/app.js                telas, rotas (#hash), carrosséis e painel ADM
supabase/migrations/     tabelas, RLS, view pública, gatilhos e Storage
supabase/seed.sql        dados da feira (sem barracas de exemplo)
supabase/criar-admin.sql transforma um usuário em administrador
scripts/extrair-foto.mjs tira a foto da capa de dentro do feira-modelo.html
```

## O que cada barraca tem

| Item | Limite | Onde aparece |
|---|---|---|
| Logo | 1 | cartões, lista, mapa e página da barraca |
| Banner | até **5** imagens | cartão "Na feira hoje" (as imagens se alternam a cada 4s) e página da barraca enquanto ainda não houver fotos |
| Fotos dos produtos | até **10** | carrossel da página da barraca (passa a cada 2s) |

Por enquanto **só o administrador** cadastra e envia as imagens, no modal da barraca. A área do feirante foi retirada. O banco já guarda o `user_id` da barraca e as regras de "dono", para quando ela voltar.

## Telas (rotas)

| Endereço | Tela |
|---|---|
| `#inicio` | Capa em carrossel, botão "Barracas", busca, "Na feira hoje" e botão do WhatsApp |
| `#barracas` | Lista com busca, Categorias e Mapa da feira |
| `#mapa`, `/mapa` ou `?mapa=1` | Lista com o mapa aberto |
| `#barraca-12` | Página da barraca 12-777 |
| `#admin` (botão ADM) | Painel: dados da feira e barracas (modal para cadastrar, editar e colocar imagens) |

## Configurar o Supabase (uma vez)

1. No **SQL Editor** do projeto, rode `supabase/migrations/001_schema.sql` e depois `supabase/seed.sql`.
2. Crie o administrador: em **Authentication → Users → Add user → Create new user**, informe o e-mail e a senha e marque **Auto Confirm User**. Depois rode `supabase/criar-admin.sql` com esse e-mail.
3. Entre no site pelo botão **ADM** com esse e-mail e senha.

O `js/config.js` já aponta para o projeto `feira_alterosa`. A chave que está lá é a **anon** (pública). A segurança vem das regras RLS: só quem está na tabela `admins` consegue gravar. O site **não usa a service_role**, e ela nunca deve ir para o código.

## Rodar localmente

```bash
npm run dev           # http://localhost:3000
```

Para testar sem banco, deixe `SUPABASE_URL` e `SUPABASE_ANON_KEY` vazios no `js/config.js`. O site entra no **modo demonstração** (ADM: `admin` / `feira123`, com 12 barracas de exemplo guardadas no navegador).

**Foto da capa:** coloque o `feira-modelo.html` na raiz e rode `npm run foto`. Isso cria `assets/capa-feira.jpg`. Sem ela, a capa usa a ilustração de reserva. O admin também pode trocar a capa pelo painel (até 3 fotos).

## Segurança (RLS)

- **Público:** lê `feira_config`, a view `barracas_publicas` (sem `user_id`), `barraca_fotos` e `barraca_banners`.
- **Admin** (linha em `admins`): acesso total às tabelas e ao bucket `feira`.
- Gatilhos impedem mais de 10 fotos e mais de 5 banners por barraca. O bucket aceita só `image/*`, até 2 MB por arquivo.
- As imagens são comprimidas no navegador antes do envio: 1000px de largura (logo com 300px), JPEG com qualidade 0,8.
