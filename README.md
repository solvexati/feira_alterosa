# Feira Alterosa (Betim/MG)

Site da Feira Alterosa feito em **HTML, CSS e JavaScript puro**, seguindo o protótipo aprovado (`feira-modelo.html`) em layout, cores, fontes, textos e comportamento.
Os dados ficam no **Supabase** (Postgres, Auth e Storage) e o site roda na **Vercel**.

```
index.html               marcação das telas (igual ao modelo)
css/style.css            CSS do modelo (mobile first: 700px, 900px e 1024px)
js/config.js             URL e chave pública do Supabase (vazio = modo demonstração)
js/data.js               camada de dados: modo demonstração (localStorage) ou Supabase
js/app.js                telas, rotas (#hash), carrosséis, painel ADM e área do feirante
api/barracas.js          função da Vercel: cria, altera e apaga barraca + conta do feirante (service_role)
supabase/migrations/     tabelas, RLS, view pública, gatilhos e Storage
supabase/seed.sql        as 12 barracas do modelo
scripts/criar-contas.mjs cria o admin de teste e o feirante de teste
scripts/extrair-foto.mjs tira a foto da capa de dentro do feira-modelo.html
```

## Telas (rotas)

| Endereço | Tela |
|---|---|
| `#inicio` | Capa em carrossel, botão "Barracas", busca, "Na feira hoje" e botão do WhatsApp |
| `#barracas` | Lista com busca, Categorias e Mapa da feira |
| `#mapa`, `/mapa` ou `?mapa=1` | Lista com o mapa aberto |
| `#barraca-12` | Página da barraca 12-777 (carrossel de até 10 fotos, passa a cada 2s) |
| `#vendedor` | Área do feirante (login com WhatsApp e senha, 10 fotos, descrição e Instagram) |
| `#admin` | Painel do administrador (dados da feira, barracas, modal de cadastro/edição) |

## 1. Testar já, sem configurar nada (modo demonstração)

Com `js/config.js` vazio o site funciona igual ao modelo, guardando tudo no navegador:

```bash
npm run demo          # abre em http://localhost:3000
```

- ADM: usuário **admin**, senha **feira123**
- Feirante: WhatsApp **(31) 98765-4321**, senha **1234**

**Foto da capa:** coloque o `feira-modelo.html` na raiz do projeto e rode `npm run foto`. Isso cria `assets/capa-feira.jpg` com a foto do modelo. Sem esse arquivo, a capa usa a ilustração de reserva do modelo. Depois, o admin pode trocar a capa pelo painel (até 3 fotos).

## 2. Criar o projeto no Supabase

1. Em [supabase.com](https://supabase.com), crie um projeto.
2. No **SQL Editor**, rode **nesta ordem**:
   - `supabase/migrations/001_schema.sql` (tabelas, RLS, funções e bucket `feira`)
   - `supabase/seed.sql` (as 12 barracas)
3. Em **Project Settings → API**, copie:
   - a **Project URL** e a chave **anon / publishable** → `js/config.js`
   - a chave **service_role** → `.env` e Vercel (nunca no `js/config.js`)
4. Crie o arquivo `.env` a partir do `.env.example` e rode:

```bash
npm install
npm run contas        # cria o admin e o feirante de teste
```

| Conta de teste | Login | Senha |
|---|---|---|
| Admin | admin@feiraalterosa.app | feira123 |
| Feirante (Hortifruti da Maria, 12-777) | WhatsApp (31) 98765-4321 | 123456 |

Para usar outro e-mail e outra senha de admin: `node --env-file=.env scripts/criar-contas.mjs voce@email.com SuaSenha`.

> O Supabase exige senha com **no mínimo 6 caracteres**. Por isso, no modo Supabase, a senha do feirante tem no mínimo 6. Na edição, deixe a senha em branco para manter a atual.

As outras barracas do seed ainda não têm acesso. Para liberar, o admin abre **Editar**, define a senha do feirante e salva.

## 3. Publicar na Vercel

1. Suba a pasta para um repositório (GitHub/GitLab) e importe na Vercel. Escolha **Framework: Other**, sem comando de build.
2. Em **Settings → Environment Variables**, cadastre:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `EMAIL_FEIRANTE_DOMINIO` = `feirante.feiraalterosa.app` (igual ao `js/config.js`)
3. Faça o deploy. Os arquivos estáticos são servidos direto, e `api/barracas.js` vira a função `/api/barracas`.

Para rodar localmente com a função: `npm i -g vercel` e depois `vercel dev`.

## Como funciona o login do feirante

Quando o admin cadastra a barraca com uma senha, a função `/api/barracas` (no servidor, com a service_role) cria no Supabase Auth o usuário `55{whatsapp}@feirante.feiraalterosa.app` e grava o `user_id` na barraca. No login, o site converte o WhatsApp digitado nesse e-mail. Ao editar, trocar a senha ou o WhatsApp atualiza a conta. Ao remover a barraca, a função apaga a conta e os arquivos dela.

## Segurança (RLS)

- **Público:** lê `feira_config`, a view `barracas_publicas` (sem `user_id`) e `barraca_fotos`.
- **Admin** (linha em `admins`): acesso total às tabelas e ao bucket.
- **Feirante:** altera só descrição e Instagram da própria barraca, pela função `atualizar_minha_barraca`. Insere, reordena e apaga fotos só da própria barraca, e só escreve em `barracas/{sua_barraca}/fotos/`.
- Gatilho impede mais de 10 fotos por barraca. Bucket com limite de 2 MB e só `image/*`.
- As imagens são comprimidas no navegador antes do envio: 1000px de largura, JPEG com qualidade 0,8 (cerca de 200 KB).

## Diferenças em relação ao modelo

- O login do admin é por **e-mail** (Supabase Auth) no lugar de "usuário". No modo demonstração continua "usuário: admin".
- As notas "No modelo: …" com as senhas de teste só aparecem no modo demonstração.
