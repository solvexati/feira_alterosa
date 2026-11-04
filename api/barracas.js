// Função da Vercel (Node.js): cadastra, altera e remove barracas e a conta de login do feirante.
// Usa a SUPABASE_SERVICE_ROLE_KEY, que fica SÓ no servidor (variável de ambiente da Vercel).
// Só aceita chamadas de um administrador logado (token do Supabase no cabeçalho Authorization).
//
//   POST   /api/barracas            → cria a barraca (+ conta do feirante, se vier "senha")
//   PATCH  /api/barracas            → altera (body.id); "senha" opcional troca/cria a senha
//   DELETE /api/barracas?id=<uuid>  → remove a barraca, os arquivos dela e a conta do feirante
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DOMINIO = process.env.EMAIL_FEIRANTE_DOMINIO || "feirante.feiraalterosa.app";
const CATEGORIAS = ["Hortifruti", "Comidas", "Laticínios", "Flores", "Peixes", "Temperos", "Artesanato", "Bebidas", "Doces", "Padaria"];
const BUCKET = "feira";
const SENHA_MIN = 6;

const digits = s => String(s ?? "").replace(/\D/g, "");
const code = n => String(n).padStart(2, "0") + "-777";
const emailFeirante = wa => `55${digits(wa)}@${DOMINIO}`;
const fail = (status, message) => Object.assign(new Error(message), { status });

function validar(b, { parcial = false } = {}) {
  const numero = parseInt(b.numero, 10);
  if (!Number.isInteger(numero) || numero < 1 || numero > 48) throw fail(400, "O número da barraca vai de 1 a 48.");
  const nome = String(b.nome || "").trim();
  const proprietario = String(b.proprietario || "").trim();
  if (!nome || !proprietario) throw fail(400, "Preencha o nome da barraca e o(a) proprietário(a).");
  if (!CATEGORIAS.includes(b.categoria)) throw fail(400, "Escolha uma categoria válida.");
  const whatsapp = digits(b.whatsapp);
  if (whatsapp.length < 10 || whatsapp.length > 11) throw fail(400, "O WhatsApp precisa ter DDD e número, por exemplo (31) 98765-4321.");
  const instagram = String(b.instagram || "").trim().replace(/^@/, "") || null;
  const descricao = String(b.descricao || "").trim().slice(0, 180) || null;
  const senha = b.senha ? String(b.senha).trim() : "";
  if (senha && senha.length < SENHA_MIN) throw fail(400, `A senha do feirante precisa ter pelo menos ${SENHA_MIN} caracteres.`);
  if (!parcial && !senha) throw fail(400, "Defina a senha do feirante.");
  return { row: { numero, nome, proprietario, categoria: b.categoria, whatsapp, instagram, descricao }, senha };
}

async function numeroLivre(db, numero, exceptId) {
  let q = db.from("barracas").select("id,nome").eq("numero", numero);
  if (exceptId) q = q.neq("id", exceptId);
  const { data } = await q.maybeSingle();
  if (data) throw fail(409, `A barraca ${code(numero)} já está com “${data.nome}”. Escolha outro número.`);
}

function erroConta(error) {
  if (/already|registered|exists/i.test(error.message)) return fail(409, "Já existe um acesso de feirante com esse WhatsApp.");
  if (/password/i.test(error.message)) return fail(400, `A senha do feirante precisa ter pelo menos ${SENHA_MIN} caracteres.`);
  return fail(400, "Não foi possível criar o acesso do feirante: " + error.message);
}

async function criarConta(db, whatsapp, senha, barracaId) {
  const { data, error } = await db.auth.admin.createUser({
    email: emailFeirante(whatsapp), password: senha, email_confirm: true,
    user_metadata: { papel: "feirante", barraca_id: barracaId }
  });
  if (error) throw erroConta(error);
  return data.user.id;
}

async function criar(db, body) {
  const { row, senha } = validar(body);
  await numeroLivre(db, row.numero);
  const { data, error } = await db.from("barracas").insert(row).select("id").single();
  if (error) throw fail(400, error.code === "23505" ? `A barraca ${code(row.numero)} já está ocupada. Escolha outro número.` : error.message);
  try {
    const userId = await criarConta(db, row.whatsapp, senha, data.id);
    await db.from("barracas").update({ user_id: userId }).eq("id", data.id);
  } catch (e) {
    await db.from("barracas").delete().eq("id", data.id); // desfaz o cadastro
    throw e;
  }
  return { id: data.id };
}

async function atualizar(db, body) {
  if (!body.id) throw fail(400, "Barraca não informada.");
  const { row, senha } = validar(body, { parcial: true });
  const { data: atual } = await db.from("barracas").select("id,whatsapp,user_id").eq("id", body.id).maybeSingle();
  if (!atual) throw fail(404, "Essa barraca não está mais cadastrada.");
  await numeroLivre(db, row.numero, body.id);

  // conta do feirante primeiro: se falhar, nada muda na barraca
  let userId = atual.user_id;
  if (userId) {
    const upd = {};
    if (row.whatsapp !== atual.whatsapp) upd.email = emailFeirante(row.whatsapp);
    if (senha) upd.password = senha;
    if (Object.keys(upd).length) {
      const { error } = await db.auth.admin.updateUserById(userId, { ...upd, email_confirm: true });
      if (error) throw erroConta(error);
    }
  } else if (senha) {
    userId = await criarConta(db, row.whatsapp, senha, body.id);
  }

  const { error } = await db.from("barracas").update({ ...row, user_id: userId }).eq("id", body.id);
  if (error) throw fail(400, error.code === "23505" ? `A barraca ${code(row.numero)} já está ocupada. Escolha outro número.` : error.message);
  return { id: body.id };
}

async function listarArquivos(db, pasta) {
  const { data } = await db.storage.from(BUCKET).list(pasta, { limit: 1000 });
  let out = [];
  for (const item of data || []) {
    const p = `${pasta}/${item.name}`;
    if (item.id) out.push(p);          // arquivo
    else out = out.concat(await listarArquivos(db, p)); // subpasta
  }
  return out;
}

async function remover(db, id) {
  if (!id) throw fail(400, "Barraca não informada.");
  const { data: atual } = await db.from("barracas").select("id,user_id").eq("id", id).maybeSingle();
  if (!atual) throw fail(404, "Essa barraca não está mais cadastrada.");
  const arquivos = await listarArquivos(db, `barracas/${id}`);
  if (arquivos.length) await db.storage.from(BUCKET).remove(arquivos);
  const { error } = await db.from("barracas").delete().eq("id", id); // fotos saem em cascata
  if (error) throw fail(400, error.message);
  if (atual.user_id) await db.auth.admin.deleteUser(atual.user_id);
  return { ok: true };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(500).json({ error: "Servidor sem SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY configuradas." });

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  // só administrador
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Entre como administrador." });
  const { data: { user } = {}, error: authErr } = await db.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: "Sua sessão expirou. Entre de novo." });
  const { data: adm } = await db.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!adm) return res.status(403).json({ error: "Acesso só para administradores." });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (req.method === "POST") return res.status(201).json(await criar(db, body));
    if (req.method === "PATCH") return res.status(200).json(await atualizar(db, body));
    if (req.method === "DELETE") return res.status(200).json(await remover(db, req.query.id || body.id));
    res.setHeader("Allow", "POST, PATCH, DELETE");
    return res.status(405).json({ error: "Método não permitido." });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || "Erro inesperado." });
  }
}
