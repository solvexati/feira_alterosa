# Feira Alterosa (Betim/MG)

Site da Feira Alterosa feito em **HTML, CSS e JavaScript puro**, seguindo o protótipo aprovado (`feira-modelo.html`) em layout, cores, fontes, textos e comportamento.
Os dados ficam no **Supabase** (Postgres, Auth e Storage) e o site é publicado na **Vercel** a cada `git push` no `main`.

- Site: https://feiraalterosamp.vercel.app (o endereço antigo https://feira-alterosa.vercel.app continua funcionando)
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

## Imagens

| Item | Limite | Onde aparece |
|---|---|---|
| Capa do site (banner) | até **5** imagens | carrossel do início (troca a cada 6s) |
| Logo da loja | 1 | lista, cartões e página da loja |
| Banner da loja | 1 | fundo do topo da página da loja e imagem do cartão em "Na feira hoje" (sem banner, o cartão usa a 1ª foto) |
| Fotos dos produtos | até **10** por loja | grade embaixo dos dados da loja. Clicando, a foto abre grande (setas, teclado ou arrastar, sem passagem automática) |

Por enquanto **só o administrador** cadastra e envia as imagens, no modal da loja. A área do feirante foi retirada. O banco já guarda o `user_id` da loja e as regras de "dono", para quando ela voltar.

**Compressão (feita no navegador antes do envio):**

- foto de produto: lado maior até **1280px**
- capa: até **1920px**
- banner da loja: até **1600px**
- logo: até **300px**

O formato é **WebP qualidade 0,82**. Se o navegador não gerar WebP, usa JPEG 0,85. Imagens menores que esses tamanhos não são ampliadas.

Medido com uma foto real: 1280px em WebP pesa praticamente o mesmo que 1000px em JPEG (~99 KB contra ~92 KB), com 64% mais pixels.

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

**Foto da capa:** coloque o `feira-modelo.html` na raiz e rode `npm run foto`. Isso cria `assets/capa-feira.jpg`. Sem ela, a capa usa a ilustração de reserva. O admin também pode trocar a capa pelo painel (até 5 fotos).

## Segurança (RLS)

- **Público:** lê `feira_config`, a view `barracas_publicas` (sem `user_id`), `barraca_fotos` e `barraca_banners` (o banner único de cada loja).
- **Admin** (linha em `admins`): acesso total às tabelas e ao bucket `feira`.
- Um gatilho impede mais de 10 fotos por loja. O bucket aceita só `image/*`, até 2 MB por arquivo.
