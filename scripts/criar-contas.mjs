// Cria as contas de teste no Supabase Auth (precisa da service_role).
//   node --env-file=.env scripts/criar-contas.mjs [email-admin] [senha-admin]
//
// - Admin de teste: admin@feiraalterosa.app / feira123 (ou os valores passados)
// - Feirante de teste: Hortifruti da Maria — WhatsApp (31) 98765-4321 / senha 123456
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DOMINIO = process.env.EMAIL_FEIRANTE_DOMINIO || "feirante.feiraalterosa.app";
if (!URL || !KEY) { console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env"); process.exit(1); }

const db = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const [adminEmail = "admin@feiraalterosa.app", adminSenha = "feira123"] = process.argv.slice(2);

async function garantirUsuario(email, password, meta) {
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: meta });
  if (!error) return data.user.id;
  if (!/already|registered|exists/i.test(error.message)) throw error;
  // já existe: procura e atualiza a senha
  for (let page = 1; page < 50; page++) {
    const { data: list, error: e2 } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (e2) throw e2;
    const u = list.users.find(x => x.email === email);
    if (u) { await db.auth.admin.updateUserById(u.id, { password }); return u.id; }
    if (list.users.length < 200) break;
  }
  throw new Error("Não encontrei o usuário " + email);
}

const adminId = await garantirUsuario(adminEmail, adminSenha, { papel: "admin" });
const { error: e1 } = await db.from("admins").upsert({ user_id: adminId });
if (e1) throw e1;
console.log(`✔ Admin: ${adminEmail} / ${adminSenha}`);

const { data: maria } = await db.from("barracas").select("id,whatsapp,user_id").eq("numero", 12).maybeSingle();
if (maria) {
  const id = await garantirUsuario(`55${maria.whatsapp}@${DOMINIO}`, "123456", { papel: "feirante", barraca_id: maria.id });
  await db.from("barracas").update({ user_id: id }).eq("id", maria.id);
  console.log("✔ Feirante: WhatsApp (31) 98765-4321 / senha 123456 (Hortifruti da Maria, barraca 12-777)");
} else {
  console.log("• Barraca 12 não encontrada — rode o supabase/seed.sql para criar o feirante de teste.");
}
